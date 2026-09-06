/**
 * "Bu hafta aranan ürünler" — ilan ARZINI artirmak icin talep-arz bosluk listesi.
 *
 * Amac liste degil cagri: talebi olculebilen ama panoda satis ilani OLMAYAN
 * urunleri gosterip "ürününü ilana çevir" adimina baglar. Uc gercek sinyal:
 *   - alici ilani (birisi acikca "aliyorum" demis) — en agir sinyal
 *   - takip/alarm (kullanici o urunu izliyor)
 *   - arama hacmi (site disindan gelen talep)
 * Uydurma skor yok: her satir hangi sinyalden geldigini kendisi soyler.
 */
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/client";

type Row = RowDataPacket & Record<string, unknown>;

export interface WantedProduct {
  slug: string;
  name: string;
  imageUrl: string | null;
  /** Acik alim ilani sayisi. */
  buyers: number;
  /** Takip + fiyat alarmi kuran kullanici sayisi. */
  watchers: number;
  /** Aylik arama hacmi (0 = veri yok). */
  searchVolume: number;
  /** Bugunun hal fiyati (yalniz hal kaynaklari) — ilan verecek uretici referans alsin. */
  price: number | null;
  markets: number;
  priceDate: string | null;
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v).slice(0, 10) : null);

export async function listWantedProducts(limit = 8): Promise<WantedProduct[]> {
  const safeLimit = Math.max(3, Math.min(limit, 20));
  const [rows] = await pool.query<Row[]>(
    `WITH open_listings AS (
       SELECT product_id, listing_type, COUNT(*) AS n
       FROM hf_listings
       WHERE status = 'approved' AND is_suspicious = 0
         AND (valid_until IS NULL OR valid_until >= CURRENT_DATE())
       GROUP BY product_id, listing_type
     ),
     watchers AS (
       SELECT product_id, COUNT(*) AS n FROM (
         SELECT product_id FROM hf_user_favorites
         UNION ALL
         SELECT product_id FROM hf_alerts WHERE is_active = 1
       ) w GROUP BY product_id
     ),
     obs AS (
       SELECT ph.product_id, ph.recorded_date, ph.market_id, ph.avg_price
       FROM hf_price_history ph
       JOIN hf_markets mk ON mk.id = ph.market_id AND mk.is_active = 1
         AND mk.market_type = 'hal' AND mk.city_name <> 'Türkiye'
       WHERE ph.recorded_date >= CURDATE() - INTERVAL 7 DAY AND ph.unit = 'kg' AND ph.avg_price > 0
     ),
     latest AS (SELECT product_id, MAX(recorded_date) AS d, COUNT(DISTINCT recorded_date) AS days FROM obs GROUP BY product_id),
     price AS (
       SELECT o.product_id, AVG(o.avg_price) AS price, COUNT(DISTINCT o.market_id) AS markets, l.d, l.days
       FROM obs o JOIN latest l ON l.product_id = o.product_id AND o.recorded_date = l.d
       GROUP BY o.product_id, l.d, l.days
     )
     SELECT p.slug, COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS name, p.image_url,
            COALESCE(p.search_volume, 0) AS search_volume,
            COALESCE(buy.n, 0) AS buyers,
            COALESCE(w.n, 0) AS watchers,
            pr.price, pr.markets, pr.d AS price_date
     FROM hf_products p
     LEFT JOIN open_listings sell ON sell.product_id = p.id AND sell.listing_type = 'satis'
     LEFT JOIN open_listings buy ON buy.product_id = p.id AND buy.listing_type = 'alim'
     LEFT JOIN watchers w ON w.product_id = p.id
     LEFT JOIN price pr ON pr.product_id = p.id
     WHERE p.is_active = 1 AND p.canonical_slug IS NULL AND p.seo_index = 1 AND p.unit = 'kg'
       AND sell.n IS NULL
       -- Mevsim disi urun ilana cagrilmaz: son haftada en az 3 gun ve 3 halde kayit sarti.
       AND pr.markets >= 3 AND pr.days >= 3
       AND (COALESCE(buy.n, 0) > 0 OR COALESCE(w.n, 0) > 0 OR COALESCE(p.search_volume, 0) >= 500)
     ORDER BY COALESCE(buy.n, 0) DESC, COALESCE(w.n, 0) DESC, COALESCE(p.search_volume, 0) DESC
     LIMIT ?`,
    [safeLimit],
  );

  return (rows ?? []).map((r) => ({
    slug: String(r.slug),
    name: String(r.name),
    imageUrl: r.image_url ? String(r.image_url) : null,
    buyers: Number(r.buyers ?? 0),
    watchers: Number(r.watchers ?? 0),
    searchVolume: Number(r.search_volume ?? 0),
    price: r.price != null ? Number(r.price) : null,
    markets: Number(r.markets ?? 0),
    priceDate: iso(r.price_date),
  }));
}
