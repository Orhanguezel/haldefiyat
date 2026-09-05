/**
 * Sehir x urun sayfalari (/fiyat/<sehir>/<urun>) veri katmani.
 *
 * Neden: GSC'de "adana limon fiyatlari" gibi sehir+urun sorgulari gosterimin %18'i;
 * rakipler (harmanapps, tarimziraat) sehir sayfasiyla 1-3. sirada, biz ulusal urun
 * sayfasiyla 6-9. Her sayfa TEK halin tek urun serisidir; ince icerik riskine karsi
 * yalniz kapi kosulunu gecen ciftler sitemap'e girer ve index alir (gate).
 */
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "@/db/client";

type Row = RowDataPacket & Record<string, unknown>;

export const GATE = { minDays90: 45, minSearchVolume: 5000, maxStaleDays: 14 } as const;
const INDEX_TTL_MS = 30 * 60_000;

export function citySlugTr(value: string): string {
  return value.toLocaleLowerCase("tr")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export interface CityProductPair {
  citySlug: string; cityName: string; productSlug: string; productName: string; unit: string;
  marketSlug: string; marketName: string; days90: number; lastDate: string; searchVolume: number; eligible: boolean;
}

// Urun ailesi: master + canonical_slug ile ona bagli varyantlar (kg birimi esit).
const FAMILY_CTE = `fam AS (
  SELECT id AS pid, id AS master_id FROM hf_products WHERE is_active = 1 AND canonical_slug IS NULL
  UNION ALL
  SELECT v.id, m.id FROM hf_products v JOIN hf_products m ON m.slug = v.canonical_slug WHERE v.is_active = 1
)`;

let indexCache: { at: number; items: CityProductPair[] } | null = null;

/** Tum (sehir, urun) ciftleri — 90 gunluk veri ile; eligible bayragi kapi kosulunu tasir. */
export async function listCityProductPairs(): Promise<CityProductPair[]> {
  if (indexCache && Date.now() - indexCache.at < INDEX_TTL_MS) return indexCache.items;
  const [rows] = await pool.query<Row[]>(
    `WITH ${FAMILY_CTE},
     agg AS (
       SELECT f.master_id, ph.market_id, COUNT(DISTINCT ph.recorded_date) AS days90, MAX(ph.recorded_date) AS last_date
       FROM hf_price_history ph JOIN fam f ON f.pid = ph.product_id
       JOIN hf_markets mk ON mk.id = ph.market_id AND mk.is_active = 1 AND mk.market_type = 'hal' AND mk.city_name <> 'Türkiye'
       WHERE ph.recorded_date >= CURDATE() - INTERVAL 90 DAY
       GROUP BY f.master_id, ph.market_id
     )
     SELECT mk.city_name, mk.slug AS market_slug, mk.name AS market_name, p.slug AS product_slug,
            COALESCE(p.display_name, p.name_tr) AS product_name, p.unit, p.search_volume, p.seo_index,
            a.days90, a.last_date
     FROM agg a JOIN hf_markets mk ON mk.id = a.market_id JOIN hf_products p ON p.id = a.master_id
     WHERE a.days90 >= 10
     ORDER BY p.search_volume DESC, a.days90 DESC`,
  );
  const seen = new Set<string>();
  const items: CityProductPair[] = [];
  for (const r of rows ?? []) {
    const citySlug = citySlugTr(String(r.city_name));
    const key = `${citySlug}/${r.product_slug}`;
    if (seen.has(key)) continue; // ayni sehirde ikinci hal: en cok gunlu (siralama) kazanir
    seen.add(key);
    const lastDate = isoDate(r.last_date);
    const staleDays = Math.round((Date.now() - new Date(`${lastDate}T00:00:00Z`).getTime()) / 86_400_000);
    const eligible = Number(r.seo_index) === 1 && Number(r.days90) >= GATE.minDays90
      && Number(r.search_volume) >= GATE.minSearchVolume && staleDays <= GATE.maxStaleDays;
    items.push({
      citySlug, cityName: String(r.city_name), productSlug: String(r.product_slug), productName: String(r.product_name), unit: String(r.unit),
      marketSlug: String(r.market_slug), marketName: String(r.market_name), days90: Number(r.days90), lastDate, searchVolume: Number(r.search_volume), eligible,
    });
  }
  indexCache = { at: Date.now(), items };
  return items;
}

export interface CityProductDetail {
  pair: CityProductPair;
  latest: { recordedDate: string; avgPrice: number; minPrice: number | null; maxPrice: number | null } | null;
  weekAgoAvg: number | null;
  history: Array<{ recordedDate: string; avgPrice: number; minPrice: number | null; maxPrice: number | null; unit: string; marketSlug: string; marketName: string; cityName: string }>;
  cities: Array<{ citySlug: string; cityName: string; marketSlug: string; avgPrice: number; recordedDate: string; eligible: boolean }>;
  nationalMedian: number | null;
  rank: number | null;
  movers: Array<{ productSlug: string; productName: string; avgPrice: number; prevPrice: number; changePct: number; citySlug: string; eligible: boolean }>;
}

const num = (v: unknown) => (v == null ? null : Number(v));
/** mysql2 DATE kolonunu JS Date olarak verir; String() ile kesmek gecersiz tarih uretir. */
function isoDate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v ?? "");
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : new Date(s).toISOString().slice(0, 10);
}
const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export async function getCityProductDetail(citySlug: string, productSlug: string): Promise<CityProductDetail | null> {
  const pairs = await listCityProductPairs();
  const pair = pairs.find((p) => p.citySlug === citySlug && p.productSlug === productSlug);
  if (!pair) return null;
  const eligibleKeys = new Set(pairs.filter((p) => p.eligible).map((p) => `${p.citySlug}/${p.productSlug}`));

  const [hist] = await pool.query<Row[]>(
    `WITH ${FAMILY_CTE}
     SELECT ph.recorded_date, AVG(ph.avg_price) AS avg_price, MIN(ph.min_price) AS min_price, MAX(ph.max_price) AS max_price
     FROM hf_price_history ph JOIN fam f ON f.pid = ph.product_id JOIN hf_markets mk ON mk.id = ph.market_id
     JOIN hf_products p ON p.id = f.master_id
     WHERE p.slug = ? AND mk.slug = ? AND ph.unit = p.unit AND ph.recorded_date >= CURDATE() - INTERVAL 90 DAY
     GROUP BY ph.recorded_date ORDER BY ph.recorded_date`,
    [productSlug, pair.marketSlug],
  );
  const history = (hist ?? []).map((r) => ({
    recordedDate: isoDate(r.recorded_date), avgPrice: Number(r.avg_price), minPrice: num(r.min_price), maxPrice: num(r.max_price),
    unit: pair.unit, marketSlug: pair.marketSlug, marketName: pair.marketName, cityName: pair.cityName,
  }));
  const latestRow = history.at(-1) ?? null;
  const latest = latestRow ? { recordedDate: latestRow.recordedDate, avgPrice: latestRow.avgPrice, minPrice: latestRow.minPrice, maxPrice: latestRow.maxPrice } : null;
  const weekAgo = latestRow ? history.filter((h) => h.recordedDate <= shiftDays(latestRow.recordedDate, -7)).at(-1) : null;

  // Diger sehirler: ayni urun, son 7 gun, hal basina en guncel satir → sehir medyani.
  const [cityRows] = await pool.query<Row[]>(
    `WITH ${FAMILY_CTE},
     latest AS (
       SELECT ph.market_id, MAX(ph.recorded_date) AS rd FROM hf_price_history ph JOIN fam f ON f.pid = ph.product_id
       JOIN hf_products p ON p.id = f.master_id WHERE p.slug = ? AND ph.recorded_date >= CURDATE() - INTERVAL 7 DAY GROUP BY ph.market_id
     )
     SELECT mk.city_name, mk.slug AS market_slug, l.rd, AVG(ph.avg_price) AS avg_price
     FROM latest l JOIN hf_markets mk ON mk.id = l.market_id AND mk.is_active = 1 AND mk.market_type = 'hal' AND mk.city_name <> 'Türkiye'
     JOIN hf_price_history ph ON ph.market_id = l.market_id AND ph.recorded_date = l.rd
     JOIN fam f ON f.pid = ph.product_id JOIN hf_products p ON p.id = f.master_id AND p.slug = ? AND ph.unit = p.unit
     GROUP BY mk.city_name, mk.slug, l.rd ORDER BY avg_price`,
    [productSlug, productSlug],
  );
  const cities = (cityRows ?? []).map((r) => {
    const cs = citySlugTr(String(r.city_name));
    return { citySlug: cs, cityName: String(r.city_name), marketSlug: String(r.market_slug), avgPrice: Number(r.avg_price), recordedDate: isoDate(r.rd), eligible: eligibleKeys.has(`${cs}/${productSlug}`) };
  });
  const nationalMedian = median(cities.map((c) => c.avgPrice));
  const rank = latest ? cities.findIndex((c) => c.citySlug === citySlug) + 1 || null : null;

  // Ayni halde ayni gun en cok degisen urunler (onceki kayda gore), ic link icin.
  const [moverRows] = await pool.query<Row[]>(
    `WITH ${FAMILY_CTE},
     cur AS (
       SELECT f.master_id, AVG(ph.avg_price) AS price FROM hf_price_history ph JOIN fam f ON f.pid = ph.product_id
       JOIN hf_markets mk ON mk.id = ph.market_id WHERE mk.slug = ? AND ph.recorded_date = ? GROUP BY f.master_id
     ),
     prev AS (
       SELECT f.master_id, MAX(ph.recorded_date) AS rd FROM hf_price_history ph JOIN fam f ON f.pid = ph.product_id
       JOIN hf_markets mk ON mk.id = ph.market_id WHERE mk.slug = ? AND ph.recorded_date < ? AND ph.recorded_date >= ? - INTERVAL 14 DAY GROUP BY f.master_id
     ),
     prevp AS (
       SELECT pr.master_id, AVG(ph.avg_price) AS price FROM prev pr JOIN fam f ON f.master_id = pr.master_id
       JOIN hf_price_history ph ON ph.product_id = f.pid AND ph.recorded_date = pr.rd JOIN hf_markets mk ON mk.id = ph.market_id AND mk.slug = ?
       GROUP BY pr.master_id
     )
     SELECT p.slug, COALESCE(p.display_name, p.name_tr) AS name, c.price, pp.price AS prev_price
     FROM cur c JOIN prevp pp ON pp.master_id = c.master_id JOIN hf_products p ON p.id = c.master_id
     WHERE p.seo_index = 1 AND pp.price > 0 AND c.price > 0 AND p.slug <> ?
     ORDER BY ABS(c.price / pp.price - 1) DESC LIMIT 5`,
    latest ? [pair.marketSlug, latest.recordedDate, pair.marketSlug, latest.recordedDate, latest.recordedDate, pair.marketSlug, productSlug] : ["", "1970-01-01", "", "1970-01-01", "1970-01-01", "", productSlug],
  );
  const movers = (moverRows ?? []).map((r) => ({
    productSlug: String(r.slug), productName: String(r.name), avgPrice: Number(r.price), prevPrice: Number(r.prev_price),
    changePct: (Number(r.price) / Number(r.prev_price) - 1) * 100, citySlug, eligible: eligibleKeys.has(`${citySlug}/${r.slug}`),
  }));

  return { pair, latest, weekAgoAvg: weekAgo?.avgPrice ?? null, history, cities, nationalMedian, rank, movers };
}

function shiftDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
