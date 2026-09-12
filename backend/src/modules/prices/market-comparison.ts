/**
 * Hal x Turkiye kiyasi — /hal/<slug> sayfasinin ayirt edici blogu.
 *
 * Neden: "<sehir> hal fiyatlari" sorgularinin tamaminda 1. sirada o sehrin
 * BELEDIYESI var (ankara.bel.tr, konya.bel.tr, mersin.bel.tr...). Birincil kaynagi
 * kendi listesini tekrar ederek gecmek mumkun degil. Belediyenin yapamadigi tek sey
 * baska hallerle kiyas: "Konya'da limon 33,33 TL — 17 halin en ucuz 2.'si".
 * Bu blok o kiyasi tasir; ayni zamanda AI/alinti yuzeyi icin cumleye cevrilebilir.
 */
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/client";
import { FAMILY_CTE, VALID_PRICE, citySlugTr } from "./city-product";

type Row = RowDataPacket & Record<string, unknown>;

const TTL_MS = 30 * 60_000;
const MAX_PRODUCTS = 14;
/** Medyan altinda/ustunde demek icin en az bu kadar baska hal lazim. */
const MIN_PEER_MARKETS = 5;

export interface MarketComparisonItem {
  productSlug: string;
  productName: string;
  unit: string;
  ourPrice: number;
  recordedDate: string;
  peerCount: number;
  nationalMedian: number;
  diffPct: number;
  /** 1 = Turkiye'nin en ucuz hali. */
  rank: number;
  cheapest: { citySlug: string; cityName: string; price: number };
  priciest: { citySlug: string; cityName: string; price: number };
}

export interface MarketComparison {
  marketSlug: string;
  items: MarketComparisonItem[];
  cheaperCount: number;
  pricierCount: number;
}

const cache = new Map<string, { at: number; value: MarketComparison }>();

const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};

const isoDate = (v: unknown): string =>
  v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "").slice(0, 10);

/**
 * Hedef haldeki en yuksek aramali urunler icin, ayni urunun diger hallerdeki
 * son 7 gun icindeki en guncel fiyatini getirir. Satir = (urun, diger hal).
 */
async function fetchRows(marketSlug: string): Promise<Row[]> {
  const [rows] = await pool.query<Row[]>(
    `WITH ${FAMILY_CTE},
     mkt AS (
       SELECT f.master_id, MAX(ph.recorded_date) AS rd, MAX(master.search_volume) AS sv
       FROM hf_price_history ph JOIN fam f ON f.pid = ph.product_id
       JOIN hf_markets m ON m.id = ph.market_id AND m.slug = ?
       JOIN hf_products master ON master.id = f.master_id AND master.unit = ph.unit AND master.seo_index = 1
       WHERE ${VALID_PRICE} AND ph.recorded_date >= CURDATE() - INTERVAL 7 DAY
       GROUP BY f.master_id ORDER BY sv DESC LIMIT ${MAX_PRODUCTS}
     ),
     ours AS (
       SELECT k.master_id, k.rd, AVG(ph.avg_price) AS price
       FROM mkt k JOIN fam f ON f.master_id = k.master_id
       JOIN hf_price_history ph ON ph.product_id = f.pid AND ph.recorded_date = k.rd
       JOIN hf_markets m ON m.id = ph.market_id AND m.slug = ?
       JOIN hf_products master ON master.id = k.master_id AND master.unit = ph.unit
       WHERE ${VALID_PRICE} GROUP BY k.master_id, k.rd
     ),
     peer_latest AS (
       SELECT f.master_id, ph.market_id, MAX(ph.recorded_date) AS rd
       FROM hf_price_history ph JOIN fam f ON f.pid = ph.product_id JOIN mkt k ON k.master_id = f.master_id
       JOIN hf_markets m ON m.id = ph.market_id AND m.is_active = 1 AND m.market_type = 'hal' AND m.city_name <> 'Türkiye'
       JOIN hf_products master ON master.id = f.master_id AND master.unit = ph.unit
       WHERE ${VALID_PRICE} AND ph.recorded_date >= CURDATE() - INTERVAL 7 DAY
       GROUP BY f.master_id, ph.market_id
     ),
     peers AS (
       SELECT pl.master_id, m.slug AS market_slug, m.city_name, AVG(ph.avg_price) AS price
       FROM peer_latest pl JOIN fam f ON f.master_id = pl.master_id
       JOIN hf_price_history ph ON ph.product_id = f.pid AND ph.market_id = pl.market_id AND ph.recorded_date = pl.rd
       JOIN hf_markets m ON m.id = pl.market_id
       JOIN hf_products master ON master.id = pl.master_id AND master.unit = ph.unit
       WHERE ${VALID_PRICE} GROUP BY pl.master_id, m.slug, m.city_name
     )
     SELECT p.slug AS product_slug, COALESCE(p.display_name, p.name_tr) AS product_name, p.unit,
            p.search_volume, o.price AS our_price, o.rd AS recorded_date,
            pr.city_name, pr.price AS peer_price
     FROM ours o JOIN hf_products p ON p.id = o.master_id
     JOIN peers pr ON pr.master_id = o.master_id
     ORDER BY p.search_volume DESC, p.slug, pr.price`,
    [marketSlug, marketSlug],
  );
  return rows ?? [];
}

export async function getMarketComparison(marketSlug: string): Promise<MarketComparison> {
  const hit = cache.get(marketSlug);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  const rows = await fetchRows(marketSlug);
  const grouped = new Map<string, { row: Row; peers: Array<{ cityName: string; price: number }> }>();
  for (const r of rows) {
    const slug = String(r.product_slug);
    const g = grouped.get(slug) ?? { row: r, peers: [] };
    g.peers.push({ cityName: String(r.city_name), price: Number(r.peer_price) });
    grouped.set(slug, g);
  }

  const items: MarketComparisonItem[] = [];
  for (const [productSlug, g] of grouped) {
    // Hedef hal de listede: Turkiye medyani tum halleri kapsar, sira da oyle kurulur
    // ("17 halin en ucuz 2.'si"). Kendi fiyati kendinden kucuk olmadigi icin sirayi sismez.
    const ourPrice = Number(g.row.our_price);
    const all = g.peers;
    if (all.length < MIN_PEER_MARKETS) continue;
    const nationalMedian = median(all.map((p) => p.price));
    if (!(nationalMedian > 0)) continue;
    const sorted = [...all].sort((a, b) => a.price - b.price);
    const cheapest = sorted[0]!;
    const priciest = sorted[sorted.length - 1]!;
    items.push({
      productSlug,
      productName: String(g.row.product_name),
      unit: String(g.row.unit),
      ourPrice,
      recordedDate: isoDate(g.row.recorded_date),
      peerCount: all.length,
      nationalMedian,
      diffPct: (ourPrice / nationalMedian - 1) * 100,
      rank: all.filter((p) => p.price < ourPrice).length + 1,
      cheapest: { citySlug: citySlugTr(cheapest.cityName), cityName: cheapest.cityName, price: cheapest.price },
      priciest: { citySlug: citySlugTr(priciest.cityName), cityName: priciest.cityName, price: priciest.price },
    });
  }

  const value: MarketComparison = {
    marketSlug,
    items,
    cheaperCount: items.filter((i) => i.diffPct < 0).length,
    pricierCount: items.filter((i) => i.diffPct > 0).length,
  };
  cache.set(marketSlug, { at: Date.now(), value });
  return value;
}
