/**
 * Sosyal kart icerik secimi.
 *
 * Neden ayri modul: Telegram karti ve Tanitio'nun FB/IG uretimi ayni `trendingChanges`
 * havuzunu kullaniyordu ve ikisi de "en buyuk degisim" diyerek UC kayitlari seciyordu —
 * 5 Eylul kartinda Eylul'de kiraz, deniz borulcesi, rambutan cikti. Kart artik
 * TEMEL GIDA anlatir: kurallar burada, tek yerde.
 *
 * Kurallar (docs/HALDEFIYAT-SOSYAL-ICERIK-PLANI-2026-09-06.md §3.2):
 *   - yalniz seo_index=1 master urun (varyant/koli degil)
 *   - degisim bandi %8–%45 (usttekiler veri hatasi olasiligi tasir)
 *   - o gun en az 2 halde kayit (tek hal sicramasi kart olmaz)
 *   - son 14 gunde en az 5 halde kayit (sezon disi urun elenir)
 *   - ayni urun karta bir kez girer
 */
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/client";

type Row = RowDataPacket & Record<string, unknown>;

export const RULES = {
  minChangePct: 8,
  maxChangePct: 45,
  minMarketsToday: 2,
  minMarkets14d: 5,
  maxPrice: 500,
} as const;

/** Sepet karti icin sabit liste — arama hacmi yuksek, herkesin bildigi urunler. */
export const BASKET_SLUGS = [
  "domates", "biber-carliston", "patlican", "salatalik", "patates", "sogan-kuru",
  "limon", "elma", "muz", "havuc",
] as const;

export interface MoverRow {
  productSlug: string; productName: string; canonicalSlug: string | null; imageUrl: string | null;
  cityName: string; marketName: string; unit: string;
  latest: number; previous: number; changePct: number; marketsToday: number; recordedDate: string;
}

export interface CityCompareRow {
  cityName: string; price: number; markets: number; diffPct: number | null;
}

export interface CityCompare {
  productSlug: string; productName: string; imageUrl: string | null; unit: string;
  national: number; rows: CityCompareRow[]; date: string;
}

export interface GapRow {
  productSlug: string; productName: string; canonicalSlug: string | null; imageUrl: string | null;
  halPrice: number; retailPrice: number; retailChain: string; gapPct: number; markets: number; chains: number;
}

export interface ListingRow {
  slug: string; title: string; productName: string; productSlug: string | null; imageUrl: string | null;
  kind: "satis" | "alim"; cityName: string; quantity: string | null; price: string | null;
}

export interface BasketRow {
  productSlug: string; productName: string; canonicalSlug: string | null; imageUrl: string | null;
  unit: string; price: number; weekChangePct: number | null; markets: number; recordedDate: string;
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "").slice(0, 10));

// Master urun + ona bagli varyantlar; birim esitligi ile (kg varyanti koli ile karismaz).
const FAMILY = `fam AS (
  SELECT id AS pid, id AS master_id, unit FROM hf_products WHERE is_active = 1 AND canonical_slug IS NULL
  UNION ALL
  SELECT v.id, m.id, m.unit FROM hf_products v JOIN hf_products m ON m.slug = v.canonical_slug WHERE v.is_active = 1 AND v.unit = m.unit
)`;

/** Karantinaya alinmis (guvenilmez) satirlar karta girmez. */
const NOT_QUARANTINED = `NOT EXISTS (
  SELECT 1 FROM hf_price_quarantine q
  WHERE q.product_id = ph.product_id AND q.market_id = ph.market_id AND q.recorded_date = ph.recorded_date
    AND q.status <> 'rejected'
)`;

const NOT_BLACKOUT = `NOT EXISTS (
  SELECT 1 FROM hf_market_blackouts b
  WHERE b.market_id = ph.market_id AND ph.recorded_date BETWEEN b.from_date AND b.to_date
)`;

/** K1 — gunun hareketleri: temel gida bandinda, en cok artan ve dusen urunler. */
export async function selectMovers(perSide = 4): Promise<{ risers: MoverRow[]; fallers: MoverRow[]; date: string }> {
  const [rows] = await pool.query<Row[]>(
    `WITH ${FAMILY},
     obs AS (
       SELECT f.master_id, ph.market_id, ph.recorded_date, AVG(ph.avg_price) AS price
       FROM hf_price_history ph
       JOIN fam f ON f.pid = ph.product_id AND ph.unit = f.unit
       JOIN hf_markets mk ON mk.id = ph.market_id AND mk.is_active = 1 AND mk.market_type = 'hal' AND mk.city_name <> 'Türkiye'
       WHERE ph.recorded_date >= CURDATE() - INTERVAL 14 DAY AND ${NOT_QUARANTINED} AND ${NOT_BLACKOUT}
       GROUP BY f.master_id, ph.market_id, ph.recorded_date
     ),
     ranked AS (
       SELECT o.*, ROW_NUMBER() OVER (PARTITION BY o.master_id, o.market_id ORDER BY o.recorded_date DESC) AS rn
       FROM obs o
     ),
     paired AS (
       SELECT c.master_id, c.market_id, c.recorded_date, c.price AS latest, p.price AS previous
       FROM ranked c JOIN ranked p ON p.master_id = c.master_id AND p.market_id = c.market_id AND p.rn = 2
       WHERE c.rn = 1 AND p.price > 0
     ),
     reach AS (
       SELECT master_id, COUNT(DISTINCT market_id) AS markets14d, MAX(recorded_date) AS last_date FROM obs GROUP BY master_id
     ),
     today AS (
       SELECT o.master_id, COUNT(DISTINCT o.market_id) AS markets_today
       FROM obs o JOIN reach r ON r.master_id = o.master_id AND o.recorded_date = r.last_date
       GROUP BY o.master_id
     )
     SELECT p.slug AS product_slug, COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS product_name,
            p.canonical_slug, p.image_url, p.unit, mk.city_name, mk.name AS market_name,
            pr.latest, pr.previous, pr.recorded_date, t.markets_today,
            ((pr.latest - pr.previous) / pr.previous) * 100 AS change_pct
     FROM paired pr
     JOIN hf_products p ON p.id = pr.master_id
     JOIN hf_markets mk ON mk.id = pr.market_id
     JOIN reach r ON r.master_id = pr.master_id
     JOIN today t ON t.master_id = pr.master_id
     WHERE p.seo_index = 1 AND r.markets14d >= ? AND t.markets_today >= ?
       AND pr.latest BETWEEN 1 AND ? AND pr.recorded_date >= CURDATE() - INTERVAL 3 DAY
       AND ABS(((pr.latest - pr.previous) / pr.previous) * 100) BETWEEN ? AND ?
     ORDER BY ABS(((pr.latest - pr.previous) / pr.previous) * 100) DESC`,
    [RULES.minMarkets14d, RULES.minMarketsToday, RULES.maxPrice, RULES.minChangePct, RULES.maxChangePct],
  );

  const seen = new Set<string>();
  const risers: MoverRow[] = [];
  const fallers: MoverRow[] = [];
  let date = "";
  for (const r of rows ?? []) {
    const slug = String(r.product_slug);
    if (seen.has(slug)) continue; // ayni urun ikinci sehirle tekrar etmesin
    const row: MoverRow = {
      productSlug: slug, productName: String(r.product_name), canonicalSlug: r.canonical_slug ? String(r.canonical_slug) : null,
      imageUrl: r.image_url ? String(r.image_url) : null, cityName: String(r.city_name), marketName: String(r.market_name),
      unit: String(r.unit), latest: Number(r.latest), previous: Number(r.previous), changePct: Number(r.change_pct),
      marketsToday: Number(r.markets_today), recordedDate: iso(r.recorded_date),
    };
    const target = row.changePct >= 0 ? risers : fallers;
    if (target.length >= perSide) continue;
    seen.add(slug);
    target.push(row);
    if (row.recordedDate > date) date = row.recordedDate;
    if (risers.length >= perSide && fallers.length >= perSide) break;
  }
  return { risers, fallers, date };
}

/** K2 — mutfak sepeti: sabit temel urunler, bugunku ulusal ortalama + haftalik degisim. */
export async function selectBasket(): Promise<{ items: BasketRow[]; date: string }> {
  const slugs = [...BASKET_SLUGS];
  const [rows] = await pool.query<Row[]>(
    `WITH ${FAMILY},
     obs AS (
       SELECT f.master_id, ph.market_id, ph.recorded_date, AVG(ph.avg_price) AS price
       FROM hf_price_history ph
       JOIN fam f ON f.pid = ph.product_id AND ph.unit = f.unit
       JOIN hf_markets mk ON mk.id = ph.market_id AND mk.is_active = 1 AND mk.market_type = 'hal' AND mk.city_name <> 'Türkiye'
       WHERE ph.recorded_date >= CURDATE() - INTERVAL 10 DAY AND ${NOT_QUARANTINED} AND ${NOT_BLACKOUT}
       GROUP BY f.master_id, ph.market_id, ph.recorded_date
     ),
     last_day AS (SELECT master_id, MAX(recorded_date) AS d FROM obs GROUP BY master_id),
     cur AS (
       SELECT o.master_id, AVG(o.price) AS price, COUNT(DISTINCT o.market_id) AS markets, l.d AS recorded_date
       FROM obs o JOIN last_day l ON l.master_id = o.master_id AND o.recorded_date = l.d
       GROUP BY o.master_id, l.d
     ),
     week_day AS (
       SELECT o.master_id, MAX(o.recorded_date) AS d FROM obs o JOIN last_day l ON l.master_id = o.master_id
       WHERE o.recorded_date <= l.d - INTERVAL 6 DAY GROUP BY o.master_id
     ),
     prev AS (
       SELECT o.master_id, AVG(o.price) AS price FROM obs o JOIN week_day w ON w.master_id = o.master_id AND o.recorded_date = w.d
       GROUP BY o.master_id
     )
     SELECT p.slug AS product_slug, COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS product_name,
            p.canonical_slug, p.image_url, p.unit, c.price, c.markets, c.recorded_date, pv.price AS prev_price
     FROM cur c JOIN hf_products p ON p.id = c.master_id LEFT JOIN prev pv ON pv.master_id = c.master_id
     WHERE p.slug IN (${slugs.map(() => "?").join(",")}) AND c.price BETWEEN 1 AND ?
     ORDER BY FIELD(p.slug, ${slugs.map(() => "?").join(",")})`,
    [...slugs, RULES.maxPrice, ...slugs],
  );
  const items = (rows ?? []).map((r) => ({
    productSlug: String(r.product_slug), productName: String(r.product_name),
    canonicalSlug: r.canonical_slug ? String(r.canonical_slug) : null, imageUrl: r.image_url ? String(r.image_url) : null,
    unit: String(r.unit), price: Number(r.price), markets: Number(r.markets), recordedDate: iso(r.recorded_date),
    weekChangePct: r.prev_price && Number(r.prev_price) > 0 ? (Number(r.price) / Number(r.prev_price) - 1) * 100 : null,
  }));
  const date = items.map((i) => i.recordedDate).sort().at(-1) ?? "";
  return { items, date };
}


/** K3 — sehir sehir hal: bir urunun ayni gunde sehirlere gore fiyati. */
export async function selectCityCompare(maxCities = 8): Promise<CityCompare | null> {
  const [picks] = await pool.query<Row[]>(
    `WITH ${FAMILY},
     obs AS (
       SELECT f.master_id, mk.city_name, ph.recorded_date, AVG(ph.avg_price) AS price
       FROM hf_price_history ph
       JOIN fam f ON f.pid = ph.product_id AND ph.unit = f.unit
       JOIN hf_markets mk ON mk.id = ph.market_id AND mk.is_active = 1 AND mk.market_type = 'hal' AND mk.city_name <> 'Türkiye'
       WHERE ph.recorded_date >= CURDATE() - INTERVAL 3 DAY AND ph.unit = 'kg' AND ${NOT_QUARANTINED} AND ${NOT_BLACKOUT}
       GROUP BY f.master_id, mk.city_name, ph.recorded_date
     ),
     last_day AS (SELECT master_id, MAX(recorded_date) AS d FROM obs GROUP BY master_id),
     spread AS (
       SELECT o.master_id, l.d AS recorded_date, COUNT(DISTINCT o.city_name) AS cities
       FROM obs o JOIN last_day l ON l.master_id = o.master_id AND o.recorded_date = l.d
       GROUP BY o.master_id, l.d
     )
     SELECT p.id AS product_id, p.slug AS product_slug, COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS product_name,
            p.image_url, p.unit, s.recorded_date, s.cities, COALESCE(p.search_volume, 0) AS search_volume
     FROM spread s JOIN hf_products p ON p.id = s.master_id
     WHERE p.seo_index = 1 AND s.cities >= ?
     ORDER BY search_volume DESC, s.cities DESC
     LIMIT 1`,
    [Math.max(4, Math.min(maxCities, 6))],
  );
  const pick = (picks ?? [])[0];
  if (!pick) return null;

  const [rows] = await pool.query<Row[]>(
    `WITH ${FAMILY}
     SELECT mk.city_name, AVG(ph.avg_price) AS price, COUNT(DISTINCT ph.market_id) AS markets
     FROM hf_price_history ph
     JOIN fam f ON f.pid = ph.product_id AND ph.unit = f.unit
     JOIN hf_markets mk ON mk.id = ph.market_id AND mk.is_active = 1 AND mk.market_type = 'hal' AND mk.city_name <> 'Türkiye'
     WHERE f.master_id = ? AND ph.recorded_date = ? AND ph.unit = 'kg' AND ${NOT_QUARANTINED} AND ${NOT_BLACKOUT}
     GROUP BY mk.city_name
     ORDER BY price ASC`,
    [Number(pick.product_id), iso(pick.recorded_date)],
  );

  const all = (rows ?? []).map((r) => ({
    cityName: String(r.city_name), price: Number(r.price), markets: Number(r.markets),
  })).filter((row) => Number.isFinite(row.price) && row.price > 0);
  if (all.length < 4) return null;

  // Ulusal deger: sehir ortalamalarinin MEDYANI — tek sehirdeki uc fiyat gostergeyi bozmasin.
  const sorted = [...all].map((row) => row.price).sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const national = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;

  // En ucuz ve en pahali uclar korunur; ortadan doldurulur — kart "makasi" anlatir.
  const picked = all.length <= maxCities
    ? all
    : [...all.slice(0, Math.ceil(maxCities / 2)), ...all.slice(-Math.floor(maxCities / 2))];

  return {
    productSlug: String(pick.product_slug),
    productName: String(pick.product_name),
    imageUrl: pick.image_url ? String(pick.image_url) : null,
    unit: String(pick.unit),
    national,
    date: iso(pick.recorded_date),
    rows: picked.map((row) => ({
      ...row,
      diffPct: national > 0 ? (row.price / national - 1) * 100 : null,
    })),
  };
}


/** Perakende zincir adlari — kart ve altyazida gorunen etiket. */
const CHAIN_LABELS: Record<string, string> = {
  a101: "A101", bim: "BİM", sok: "ŞOK", migros: "Migros", carrefour: "Carrefour", tarim_kredi: "Tarım Kredi",
};

export function chainLabel(slug: string): string {
  return CHAIN_LABELS[slug] ?? slug.replace(/_/g, " ");
}

/**
 * K4 — halden markete: ayni urunun hal fiyati ile marketteki EN UCUZ rafi.
 * Makas tuketicinin sordugu tek soru; rakiplerin hicbirinde iki taraf da yok.
 */
export async function selectHalToMarket(limit = 8): Promise<{ items: GapRow[]; date: string; retailDate: string }> {
  const [rows] = await pool.query<Row[]>(
    `WITH ${FAMILY},
     obs AS (
       SELECT f.master_id, ph.market_id, ph.recorded_date, AVG(ph.avg_price) AS price
       FROM hf_price_history ph
       JOIN fam f ON f.pid = ph.product_id AND ph.unit = f.unit
       JOIN hf_markets mk ON mk.id = ph.market_id AND mk.is_active = 1 AND mk.market_type = 'hal' AND mk.city_name <> 'Türkiye'
       WHERE ph.recorded_date >= CURDATE() - INTERVAL 5 DAY AND ph.unit = 'kg' AND ${NOT_QUARANTINED} AND ${NOT_BLACKOUT}
       GROUP BY f.master_id, ph.market_id, ph.recorded_date
     ),
     hal_day AS (SELECT master_id, MAX(recorded_date) AS d FROM obs GROUP BY master_id),
     hal AS (
       SELECT o.master_id, AVG(o.price) AS price, COUNT(DISTINCT o.market_id) AS markets, h.d AS recorded_date
       FROM obs o JOIN hal_day h ON h.master_id = o.master_id AND o.recorded_date = h.d
       GROUP BY o.master_id, h.d
     ),
     retail_day AS (
       SELECT rp.product_id, MAX(rp.recorded_date) AS d
       FROM hf_retail_prices rp
       WHERE rp.recorded_date >= CURDATE() - INTERVAL 5 DAY AND rp.unit IN ('kg', 'KG', 'kilogram')
       GROUP BY rp.product_id
     ),
     retail AS (
       SELECT rp.product_id, rp.chain_slug, rp.price, rd.d AS recorded_date,
              ROW_NUMBER() OVER (PARTITION BY rp.product_id ORDER BY rp.price ASC) AS rn,
              COUNT(*) OVER (PARTITION BY rp.product_id) AS chains
       FROM hf_retail_prices rp
       JOIN retail_day rd ON rd.product_id = rp.product_id AND rp.recorded_date = rd.d
       WHERE rp.price > 0
     )
     SELECT p.slug AS product_slug, COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS product_name,
            p.canonical_slug, p.image_url, h.price AS hal_price, h.markets, h.recorded_date,
            r.price AS retail_price, r.chain_slug, r.chains, r.recorded_date AS retail_date
     FROM hal h
     JOIN hf_products p ON p.id = h.master_id
     JOIN retail r ON r.product_id = h.master_id AND r.rn = 1
     WHERE p.seo_index = 1 AND h.price > 0 AND h.markets >= 3 AND r.price > h.price
     ORDER BY COALESCE(p.search_volume, 0) DESC, (r.price / h.price) DESC
     LIMIT ?`,
    [Math.max(3, Math.min(limit, 12))],
  );

  const items: GapRow[] = (rows ?? []).map((r) => ({
    productSlug: String(r.product_slug), productName: String(r.product_name),
    canonicalSlug: r.canonical_slug ? String(r.canonical_slug) : null,
    imageUrl: r.image_url ? String(r.image_url) : null,
    halPrice: Number(r.hal_price), retailPrice: Number(r.retail_price),
    retailChain: chainLabel(String(r.chain_slug)), markets: Number(r.markets), chains: Number(r.chains ?? 1),
    gapPct: (Number(r.retail_price) / Number(r.hal_price) - 1) * 100,
  }));
  items.sort((a, b) => b.gapPct - a.gapPct);
  return {
    items,
    date: items.length ? iso((rows ?? [])[0]!.recorded_date) : "",
    retailDate: items.length ? iso((rows ?? [])[0]!.retail_date) : "",
  };
}


/** ETL adlari bazen tumu buyuk harf geliyor ("HÜNNAP"); kartta bagirmasin. */
function tidyName(value: string): string {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean !== clean.toLocaleUpperCase("tr-TR")) return clean;
  return clean
    .toLocaleLowerCase("tr-TR")
    .replace(/(^|[\s(])([\p{L}])/gu, (_m, pre: string, ch: string) => pre + ch.toLocaleUpperCase("tr-TR"));
}

const TR_QTY = (value: number) => value.toLocaleString("tr-TR", { maximumFractionDigits: 0 });

/** K5 — ilan panosu: yayindaki satis ve alim ilanlari. */
export async function selectListings(limit = 6): Promise<{ items: ListingRow[]; date: string }> {
  const [rows] = await pool.query<Row[]>(
    `SELECT l.slug, l.title, l.product_name, l.product_slug, l.listing_type, l.city_slug,
            l.quantity, l.quantity_unit, l.price_min, l.price_max, l.price_unit, l.price_type,
            p.image_url, COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS master_name,
            DATE(l.published_at) AS published_date
     FROM hf_listings l
     LEFT JOIN hf_products p ON p.id = l.product_id
     WHERE l.status = 'approved' AND (l.expires_at IS NULL OR l.expires_at > NOW())
     ORDER BY l.published_at DESC, l.id DESC
     LIMIT ?`,
    [Math.max(3, Math.min(limit, 10))],
  );

  const items: ListingRow[] = (rows ?? []).map((r) => {
    const qty = r.quantity == null ? null : Number(r.quantity);
    const unit = String(r.quantity_unit ?? "").trim();
    const min = r.price_min == null ? null : Number(r.price_min);
    const max = r.price_max == null ? null : Number(r.price_max);
    const priceUnit = String(r.price_unit ?? "kg").trim() || "kg";
    const price = min == null && max == null
      ? null
      : min != null && max != null && max > min
        ? `${TR_QTY(min)}–${TR_QTY(max)} ₺/${priceUnit}`
        : `${TR_QTY((min ?? max)!)} ₺/${priceUnit}`;
    return {
      slug: String(r.slug),
      title: tidyName(String(r.title ?? r.product_name ?? "")),
      productName: tidyName(String(r.master_name ?? r.product_name ?? "")),
      productSlug: r.product_slug ? String(r.product_slug) : null,
      imageUrl: r.image_url ? String(r.image_url) : null,
      kind: String(r.listing_type) === "alim" ? "alim" : "satis",
      cityName: String(r.city_slug ?? "").replace(/-/g, " ").replace(/(^|\s)(\p{L})/gu, (_m, pre: string, ch: string) => pre + ch.toLocaleUpperCase("tr-TR")),
      quantity: qty != null && qty > 0 ? `${TR_QTY(qty)} ${unit || "kg"}` : null,
      price,
    };
  });

  const dates = (rows ?? []).map((r) => iso(r.published_date)).filter(Boolean).sort();
  return { items, date: dates.at(-1) ?? new Date().toISOString().slice(0, 10) };
}
