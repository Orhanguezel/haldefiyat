import { and, eq, sql } from "drizzle-orm";
import { siteSettings } from "@agro/shared-backend/modules/siteSettings/schema";
import { db } from "@/db/client";
import { hfPriceHistory } from "@/db/schema";
import { blackoutFilter } from "./blackouts";
import { latestRecordedDate } from "./repository";

/**
 * Ana sayfa hero kartinin urunu. Eskiden `/prices?range=1d&limit=1` ile
 * seciliyordu: siralama `recorded_date DESC, display_order` idi ve display_order
 * tum urunlerde 0 oldugu icin kart pratikte rastgele bir satir gosteriyordu
 * (2026-09-01'de Tamarillo — arama hacmi 0, seo_index 0). Secim artik aramasi
 * olan, cok halde dogrulanan urunler havuzundan gunluk donusumle yapilir.
 */
export type FeaturedPrice = {
  productSlug: string;
  canonicalProduct: string;
  productName: string;
  categorySlug: string;
  unit: string;
  currency: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  recordedDate: string;
  marketCount: number;
  cityCount: number;
  changePct: number | null;
  pinned: boolean;
};

const PIN_KEY = "home_featured_product";
/** Kart "guncel" demeli: anchor gunu + kaynaklarin 2 gunluk yayin gecikmesi. */
const WINDOW_DAYS = 2;
/** Tek halin fiyati Turkiye ortalamasi diye sunulamaz. */
const MIN_MARKETS = 3;
/** Kimsenin aramadigi egzotik urun hero'ya cikmasin. */
const MIN_SEARCH_VOLUME = 1000;
const POOL_SIZE = 24;
/** Haftalik degisim: bu esigin ustu veri hatasidir, gosterme. */
const MAX_CHANGE_PCT = 80;

type CandidateRow = {
  productSlug: string;
  canonicalProduct: string;
  productName: string;
  categorySlug: string;
  unit: string;
  currency: string | null;
  avgPrice: string | number;
  minPrice: string | number;
  maxPrice: string | number;
  recordedDate: string | Date;
  marketCount: number | string;
  cityCount: number | string;
};

function rows<T>(result: unknown): T[] {
  return (Array.isArray(result) ? result[0] : result) as unknown as T[];
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDateStr(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

/** Istanbul takvimine gore gun indeksi — rotasyon gece yarisi doner. */
function istanbulDayIndex(): number {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
  return Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Havuz alfabetik siralanir ama gunluk adim 1 degil: `dayIndex % n` ardisik
 * gunlerde kavun -> kayisi -> kekik gibi alfabetik yuruyus uretiyordu. Havuz
 * boyutuyla aralarinda asal bir adim tum havuzu gezer, komsuluk kurmaz.
 */
function rotationIndex(day: number, size: number): number {
  if (size < 3) return day % size;
  let stride = Math.max(2, Math.round(size * 0.618));
  while (gcd(stride, size) !== 1) stride += 1;
  return (day * stride) % size;
}

async function readPin(): Promise<string | null> {
  const found = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(and(eq(siteSettings.key, PIN_KEY), eq(siteSettings.locale, "*")))
    .limit(1);
  const slug = found[0]?.value?.trim();
  return slug ? slug : null;
}

async function candidates(anchor: string, onlySlug?: string, poolSize = POOL_SIZE): Promise<CandidateRow[]> {
  const notBlackouted = await blackoutFilter(
    hfPriceHistory.recordedDate,
    hfPriceHistory.marketId,
    hfPriceHistory.sourceApi,
  );
  const blackout = notBlackouted ? sql` AND ${notBlackouted}` : sql``;
  // Pin edilmis urun havuz esiklerini (arama hacmi / seo / hal sayisi) atlar:
  // editoryal secim algoritmayi ezer, aksi halde pin sessizce yok sayilirdi.
  const pool = onlySlug
    ? sql`AND p.slug = ${onlySlug}`
    : sql`AND p.seo_index = 1 AND p.search_volume >= ${MIN_SEARCH_VOLUME}`;
  const floor = onlySlug ? sql`HAVING marketCount >= 1` : sql`HAVING marketCount >= ${MIN_MARKETS}`;

  const result = await db.execute(sql`
    WITH latest_pair AS (
      SELECT
        hf_price_history.product_id AS product_id,
        hf_price_history.market_id AS market_id,
        MAX(hf_price_history.recorded_date) AS rd
      FROM hf_price_history
      WHERE hf_price_history.recorded_date
              BETWEEN DATE_SUB(${anchor}, INTERVAL ${sql.raw(String(WINDOW_DAYS))} DAY) AND ${anchor}${blackout}
      GROUP BY hf_price_history.product_id, hf_price_history.market_id
    )
    SELECT
      p.slug AS productSlug,
      COALESCE(NULLIF(p.canonical_slug, ''), p.slug) AS canonicalProduct,
      COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS productName,
      p.category_slug AS categorySlug,
      p.unit AS unit,
      MAX(hf_price_history.currency) AS currency,
      AVG(hf_price_history.avg_price) AS avgPrice,
      MIN(hf_price_history.avg_price) AS minPrice,
      MAX(hf_price_history.avg_price) AS maxPrice,
      MAX(hf_price_history.recorded_date) AS recordedDate,
      COUNT(DISTINCT hf_price_history.market_id) AS marketCount,
      COUNT(DISTINCT m.city_name) AS cityCount
    FROM hf_price_history
    INNER JOIN latest_pair lp
      ON lp.product_id = hf_price_history.product_id
     AND lp.market_id = hf_price_history.market_id
     AND lp.rd = hf_price_history.recorded_date
    INNER JOIN hf_products p ON p.id = hf_price_history.product_id
    INNER JOIN hf_markets m ON m.id = hf_price_history.market_id
    WHERE p.is_active = 1
      AND hf_price_history.unit = p.unit
      AND hf_price_history.avg_price > 0${blackout}
      ${pool}
    GROUP BY p.id
    ${floor}
    ORDER BY p.search_volume DESC
    LIMIT ${sql.raw(String(Math.max(1, Math.trunc(poolSize))))}
  `);
  return rows<CandidateRow>(result);
}

/**
 * Ayni hallerin bir hafta onceki fiyatina gore degisim. Ortak hal yoksa null.
 *
 * Toplu calisir: sekiz kartlik izgara icin urun basina ayri sorgu acmak sekiz
 * gidis-donus demekti. Tek sorgu, JS'te slug'a gore ayristirma.
 */
async function weeklyChangePctMany(
  productSlugs: string[],
  anchor: string,
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  const slugs = [...new Set(productSlugs)].filter(Boolean);
  for (const slug of slugs) out.set(slug, null);
  if (!slugs.length) return out;

  const notBlackouted = await blackoutFilter(
    hfPriceHistory.recordedDate,
    hfPriceHistory.marketId,
    hfPriceHistory.sourceApi,
  );
  const blackout = notBlackouted ? sql` AND ${notBlackouted}` : sql``;
  const result = await db.execute(sql`
    SELECT
      p.slug AS productSlug,
      hf_price_history.market_id AS marketId,
      hf_price_history.recorded_date AS recordedDate,
      hf_price_history.avg_price AS avgPrice
    FROM hf_price_history
    INNER JOIN hf_products p ON p.id = hf_price_history.product_id
    WHERE p.slug IN (${sql.join(slugs.map((s) => sql`${s}`), sql`, `)})
      AND hf_price_history.unit = p.unit
      AND hf_price_history.avg_price > 0
      AND hf_price_history.recorded_date
            BETWEEN DATE_SUB(${anchor}, INTERVAL 9 DAY) AND ${anchor}${blackout}
    ORDER BY hf_price_history.recorded_date ASC
  `);
  const list = rows<{
    productSlug: string; marketId: number; recordedDate: string | Date; avgPrice: string | number;
  }>(result);
  if (!list.length) return out;

  const anchorMs = Date.parse(`${anchor}T00:00:00Z`);
  const dayGap = (value: string | Date) => Math.round((anchorMs - Date.parse(`${toDateStr(value)}T00:00:00Z`)) / 86_400_000);

  const bySlug = new Map<string, { current: Map<number, number>; previous: Map<number, number> }>();
  for (const row of list) {
    const price = toNumber(row.avgPrice);
    if (price <= 0) continue;
    const gap = dayGap(row.recordedDate);
    let bucket = bySlug.get(row.productSlug);
    if (!bucket) {
      bucket = { current: new Map(), previous: new Map() };
      bySlug.set(row.productSlug, bucket);
    }
    if (gap <= WINDOW_DAYS) bucket.current.set(row.marketId, price);
    else if (gap >= 7 && gap <= 9) bucket.previous.set(row.marketId, price);
  }

  for (const [slug, { current, previous }] of bySlug) {
    // Esitlenmis sepet: yalniz IKI donemde de fiyat veren hallerin ortalamasi
    // kiyaslanir. Aksi halde bir halin o gun yayin yapmamasi "fiyat degisimi"
    // gibi gorunurdu.
    const shared = [...current.keys()].filter((marketId) => previous.has(marketId));
    if (shared.length < MIN_MARKETS) continue;
    const mean = (source: Map<number, number>) =>
      shared.reduce((sum, marketId) => sum + source.get(marketId)!, 0) / shared.length;
    const before = mean(previous);
    if (before <= 0) continue;
    const pct = ((mean(current) - before) / before) * 100;
    if (!Number.isFinite(pct) || Math.abs(pct) > MAX_CHANGE_PCT) continue;
    out.set(slug, Math.round(pct * 10) / 10);
  }
  return out;
}

async function weeklyChangePct(productSlug: string, anchor: string): Promise<number | null> {
  return (await weeklyChangePctMany([productSlug], anchor)).get(productSlug) ?? null;
}

function toFeatured(row: CandidateRow, pinned: boolean, changePct: number | null): FeaturedPrice {
  return {
    productSlug: row.productSlug,
    canonicalProduct: row.canonicalProduct,
    productName: row.productName,
    categorySlug: row.categorySlug,
    unit: row.unit,
    currency: row.currency ?? "TRY",
    avgPrice: Math.round(toNumber(row.avgPrice) * 100) / 100,
    minPrice: Math.round(toNumber(row.minPrice) * 100) / 100,
    maxPrice: Math.round(toNumber(row.maxPrice) * 100) / 100,
    recordedDate: toDateStr(row.recordedDate),
    marketCount: toNumber(row.marketCount),
    cityCount: toNumber(row.cityCount),
    changePct,
    pinned,
  };
}

export async function featuredPrice(): Promise<FeaturedPrice | null> {
  const anchor = await latestRecordedDate();
  if (!anchor) return null;

  const pin = await readPin();
  if (pin) {
    const [row] = await candidates(anchor, pin);
    if (row) return toFeatured(row, true, await weeklyChangePct(row.productSlug, anchor));
  }

  const pool = await candidates(anchor);
  if (!pool.length) return null;

  // Havuz uyeligi gunden gune degisebildigi icin rotasyon slug sirasi uzerinden
  // yapilir: ayni gun icinde her istek ayni urunu doner (ISR/CDN ile uyumlu).
  const ordered = [...pool].sort((a, b) => a.productSlug.localeCompare(b.productSlug, "tr"));
  const picked = ordered[rotationIndex(istanbulDayIndex(), ordered.length)]!;
  return toFeatured(picked, false, await weeklyChangePct(picked.productSlug, anchor));
}

/**
 * Ana sayfa izgarasi. Onceki hali `/prices?range=1d&limit=8` idi: siralama
 * `recorded_date DESC, search_volume DESC` oldugu icin EN COK ARANAN URUN once
 * TUM hallerini doldurup izgarayi bitiriyordu — 2026-09-03'te sekiz kartin
 * dordu Limon, dordu Sogan'di. Kart basina bir URUN gosterilir; fiyat hero ile
 * ayni sekilde haller arasi ortalamadir (tek halin fiyati Turkiye fiyati diye
 * sunulamaz; Limon o gun Istanbul'da 42,50 iken Yalova'da 90,00'di).
 */
export async function featuredList(limit: number, excludeSlug?: string): Promise<FeaturedPrice[]> {
  const anchor = await latestRecordedDate();
  if (!anchor) return [];

  const want = Math.min(24, Math.max(1, Math.trunc(limit) || 1));
  // Hero urunu disarida biraktigimiz icin bir fazla cekilir.
  const pool = await candidates(anchor, undefined, want + 1);
  const picked = pool.filter((row) => row.productSlug !== excludeSlug).slice(0, want);
  if (!picked.length) return [];

  const changes = await weeklyChangePctMany(picked.map((row) => row.productSlug), anchor);
  return picked.map((row) => toFeatured(row, false, changes.get(row.productSlug) ?? null));
}
