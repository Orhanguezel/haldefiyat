import type { SQL } from "drizzle-orm";
import { and, asc, desc, eq, gte, lte, sql, or, like, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { hfEtlRuns, hfMarkets, hfPriceHistory, hfProductEditorial, hfProducts, hfRetailPrices } from "@/db/schema";
import { activeSources } from "@/config/etl-sources";
import { sourceInfoFor, sourceTypeFromMarketType } from "@/config/source-urls";
import { INDEX_BASKET_SLUGS } from "@/modules/index/calculator";

export function parseRangeToDays(range?: string): number {
  if (!range) return 7;
  const m = /^(\d+)d$/.exec(range.trim());
  // Max 10 yıl: yıllık sezon karşılaştırması için çoklu yıl geçmişi lazım.
  if (m) return Math.min(3650, Math.max(1, parseInt(m[1], 10)));
  return 7;
}

function capRange(range: string | undefined, maxDays: number): string {
  const days = parseRangeToDays(range);
  return `${Math.min(days, maxDays)}d`;
}

const LATEST_RECORDED_DATE_CACHE_MS = 5_000;
let latestRecordedDateCache: { value: string | null; expiresAt: number } | null = null;
let latestRecordedDateInFlight: Promise<string | null> | null = null;

async function queryLatestRecordedDate(): Promise<string | null> {
  const rows = await db
    .select({ d: sql<string | Date | null>`MAX(${hfPriceHistory.recordedDate})` })
    .from(hfPriceHistory);
  const raw: unknown = rows[0]?.d;
  if (!raw) return null;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
}

/**
 * En son fiyat kaydının tarihi. DB boşsa null.
 * Frontend'in "son veri X gün öncesine ait" mesajı için de kullanılır.
 */
export async function latestRecordedDate(): Promise<string | null> {
  const now = Date.now();
  if (latestRecordedDateCache && latestRecordedDateCache.expiresAt > now) {
    return latestRecordedDateCache.value;
  }

  if (latestRecordedDateInFlight) {
    return latestRecordedDateInFlight;
  }

  latestRecordedDateInFlight = queryLatestRecordedDate()
    .then((value) => {
      latestRecordedDateCache = {
        value,
        expiresAt: Date.now() + LATEST_RECORDED_DATE_CACHE_MS,
      };
      return value;
    })
    .finally(() => {
      latestRecordedDateInFlight = null;
    });

  return latestRecordedDateInFlight;
}

function isoDate(raw: unknown): string | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const s = String(raw);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

function isoDateTime(raw: unknown): string | null {
  if (!raw) return null;
  if (raw instanceof Date) return raw.toISOString();
  const d = new Date(String(raw));
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function toNumber(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

function daysSinceIso(iso: string | null): number | null {
  if (!iso) return null;
  const date = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12);
  return Math.max(0, Math.floor((todayUtc - date.getTime()) / 86_400_000));
}

function staleThresholdDays(marketType: string | null): number {
  if (marketType === "borsa") return 45;
  if (marketType === "resmi") return 395;
  return 0;
}

type RawPriceRow = typeof priceColumns extends infer T ? T : never;

function enrichPriceRow<T extends Record<string, unknown>>(row: T) {
  const marketType = typeof row.marketType === "string" ? row.marketType : null;
  const sourceApi = typeof row.sourceApi === "string" ? row.sourceApi : null;
  const source = sourceInfoFor(sourceApi, marketType);
  const recordedDate = isoDate(row.recordedDate);
  const fetchedAt = isoDateTime(row.fetchedAt);
  const daysSinceRecord = daysSinceIso(recordedDate);
  const isStale = daysSinceRecord == null || daysSinceRecord > staleThresholdDays(marketType);
  return {
    ...row,
    minPrice: toNumber(row.minPrice),
    maxPrice: toNumber(row.maxPrice),
    avgPrice: toNumber(row.avgPrice) ?? 0,
    recordedDate: recordedDate ?? String(row.recordedDate ?? ""),
    fetchedAt,
    publishedAt: recordedDate,
    sourceName: source?.name || (typeof row.marketName === "string" ? row.marketName : sourceApi),
    sourceUrl: source?.url || null,
    sourceType: source?.type ?? sourceTypeFromMarketType(marketType),
    isStale,
    isFresh: !isStale,
    isOfficialSource: source?.official ?? (marketType === "hal" || marketType === "resmi"),
    qualityFlags: isStale ? ["STALE_DATA"] : [],
    recordCount: 1,
    rawProductName: row.productName,
    canonicalProduct: row.canonicalProduct ?? row.productSlug,
    varietySlug: row.productSlug,
  };
}

function enrichPriceRows<T extends Record<string, unknown>>(rows: T[]) {
  return rows.map(enrichPriceRow);
}

/** Topbar/anasayfa için gerçek özet: kapsam + son veri tarihi (hard-code yerine). */
export async function overviewStats(): Promise<{
  activeCities: number;
  activeMarkets: number;
  targetCoverage: string;
  trackedProducts: number;
  lastSourceDate: string | null;
  latestRecordedDate: string | null;
  lastEtlRunAt: string | null;
}> {
  const [products, cities, markets, etl] = await Promise.all([
    db.select({ c: sql<number>`COUNT(*)` }).from(hfProducts).where(eq(hfProducts.isActive, 1)),
    db
      .select({ c: sql<number>`COUNT(DISTINCT ${hfMarkets.cityName})` })
      .from(hfPriceHistory)
      .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
      .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
      .where(and(
        eq(hfMarkets.isActive, 1),
        eq(hfProducts.isActive, 1),
        gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 30 DAY)`),
      )),
    db.select({ c: sql<number>`COUNT(*)` }).from(hfMarkets).where(eq(hfMarkets.isActive, 1)),
    db
      .select({ d: sql<string | Date | null>`MAX(${hfEtlRuns.createdAt})` })
      .from(hfEtlRuns)
      .where(eq(hfEtlRuns.status, "ok")),
  ]);
  const latest = await latestRecordedDate();
  return {
    activeCities: Number(cities[0]?.c ?? 0),
    activeMarkets: Number(markets[0]?.c ?? 0),
    targetCoverage: "81 il hedef",
    trackedProducts: Number(products[0]?.c ?? 0),
    lastSourceDate: latest,
    latestRecordedDate: latest,
    lastEtlRunAt: isoDateTime(etl[0]?.d),
  };
}

function likeSafe(raw: string): string {
  return raw.replace(/[%_\\]/g, "");
}

type MarketType = "hal" | "borsa" | "resmi" | "kooperatif";

function marketTypeCondition(marketType: MarketType): SQL {
  return eq(hfMarkets.marketType, marketType);
}

const marketTypeSql = sql<MarketType>`${hfMarkets.marketType}`;

export async function listPriceRows(params: {
  product?: string;
  q?: string;
  city?: string;
  market?: string;
  marketType?: MarketType;
  category?: string;
  range?: string;
  limit?: number;
  /**
   * true ise her (product_id, market_id) çifti için yalnızca en güncel
   * tarihteki satır döner. /fiyatlar gibi "güncel tablo" görünümleri için
   * varsayılan. false → tüm range içindeki geçmiş satırlar (grafik vb.).
   */
  latestOnly?: boolean;
}) {
  const days = parseRangeToDays(params.range);
  const limit = Math.min(2000, Math.max(1, params.limit ?? 500));
  const latestOnly = params.latestOnly !== false;

  // Market bazlı anchor: belirli bir hal seçiliyse o halin son tarihi kullanılır.
  // Global anchor kullansaydık, en yeni güncellenen hal tüm pencerenin referansı
  // olurdu — güncel olmayan haller boş görünürdü.
  let anchor: string | null;
  if (params.market || params.marketType) {
    const marketConds: SQL[] = [];
    if (params.market) marketConds.push(eq(hfMarkets.slug, params.market));
    if (params.marketType) marketConds.push(marketTypeCondition(params.marketType));
    const mRows = await db
      .select({ d: sql<string | null>`MAX(${hfPriceHistory.recordedDate})` })
      .from(hfPriceHistory)
      .innerJoin(hfMarkets, eq(hfPriceHistory.marketId, hfMarkets.id))
      .where(and(...marketConds));
    const raw: unknown = mRows[0]?.d;
    anchor = raw ? (raw instanceof Date ? (raw as Date).toISOString().slice(0, 10) : String(raw).slice(0, 10)) : null;
  } else {
    anchor = await latestRecordedDate();
  }
  const anchorSql = anchor
    ? sql`${anchor}`
    : sql`CURDATE()`;

  const windowConds: SQL[] = [
    gte(hfPriceHistory.recordedDate, sql`DATE_SUB(${anchorSql}, INTERVAL ${sql.raw(String(days))} DAY)`),
    lte(hfPriceHistory.recordedDate, anchorSql),
  ];

  // Pasif urunler (is_active=0) public fiyat sorgularindan gizlenir: aksi halde
  // /fiyatlar linki uretir ama /urun/[slug] (listProducts is_active=1 filtreli)
  // urunu bulamaz -> 404. windowConds CTE'sinde hfProducts join'i olmadigi icin
  // filtre yalnizca conds'a eklenir.
  const conds: SQL[] = [...windowConds];
  conds.push(eq(hfProducts.isActive, 1));
  if (params.product)  conds.push(eq(hfProducts.slug, params.product));
  if (params.market)   conds.push(eq(hfMarkets.slug, params.market));
  if (params.marketType) conds.push(marketTypeCondition(params.marketType));
  if (params.category) conds.push(eq(hfProducts.categorySlug, params.category));
  if (params.q?.trim()) {
    const q = likeSafe(params.q.trim());
    if (q) conds.push(or(like(hfProducts.nameTr, `%${q}%`), like(hfProducts.slug, `%${q}%`))!);
  }
  if (params.city) {
    const c = likeSafe(params.city.trim());
    if (c) conds.push(or(like(hfMarkets.cityName, `%${c}%`), like(hfMarkets.slug, `%${c}%`))!);
  }

  if (latestOnly) {
    // (product_id, market_id) başına en yeni recorded_date'i subquery ile
    // bulup ana tabloya inner join yap. Böylece aynı çift için tek satır
    // döner, tablo ETL biriktikçe şişmez.
    const latest = db.$with("latest_pair_dates").as(
      db
        .select({
          productId: hfPriceHistory.productId,
          marketId:  hfPriceHistory.marketId,
          rd:        sql<string>`MAX(${hfPriceHistory.recordedDate})`.as("rd"),
        })
        .from(hfPriceHistory)
        .where(and(...windowConds))
        .groupBy(hfPriceHistory.productId, hfPriceHistory.marketId),
    );

    const rows = await db
      .with(latest)
      .select({
        id:           hfPriceHistory.id,
        minPrice:     hfPriceHistory.minPrice,
        maxPrice:     hfPriceHistory.maxPrice,
        avgPrice:     hfPriceHistory.avgPrice,
        currency:     hfPriceHistory.currency,
        unit:         hfPriceHistory.unit,
        recordedDate: hfPriceHistory.recordedDate,
        sourceApi:    hfPriceHistory.sourceApi,
        fetchedAt:    hfPriceHistory.createdAt,
        productSlug:  hfProducts.slug,
        productName:  sql<string>`COALESCE(NULLIF(${hfProducts.displayName}, ''), ${hfProducts.nameTr})`,
        canonicalProduct: sql<string | null>`COALESCE(${hfProducts.canonicalSlug}, ${hfProducts.slug})`,
        categorySlug: hfProducts.categorySlug,
        marketSlug:   hfMarkets.slug,
        marketName:   hfMarkets.name,
        marketType:   marketTypeSql,
        cityName:     hfMarkets.cityName,
      })
      .from(hfPriceHistory)
      .innerJoin(
        latest,
        and(
          eq(latest.productId, hfPriceHistory.productId),
          eq(latest.marketId, hfPriceHistory.marketId),
          eq(latest.rd, hfPriceHistory.recordedDate),
        ),
      )
      .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
      .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
      .where(and(...conds))
      .orderBy(desc(hfPriceHistory.recordedDate), hfProducts.displayOrder)
      .limit(limit);
    return enrichPriceRows(rows);
  }

  const rows = await db
    .select({
      id:           hfPriceHistory.id,
      minPrice:     hfPriceHistory.minPrice,
      maxPrice:     hfPriceHistory.maxPrice,
      avgPrice:     hfPriceHistory.avgPrice,
      currency:     hfPriceHistory.currency,
      unit:         hfPriceHistory.unit,
      recordedDate: hfPriceHistory.recordedDate,
      sourceApi:    hfPriceHistory.sourceApi,
      fetchedAt:    hfPriceHistory.createdAt,
      productSlug:  hfProducts.slug,
      productName:  sql<string>`COALESCE(NULLIF(${hfProducts.displayName}, ''), ${hfProducts.nameTr})`,
      canonicalProduct: sql<string | null>`COALESCE(${hfProducts.canonicalSlug}, ${hfProducts.slug})`,
      categorySlug: hfProducts.categorySlug,
      marketSlug:   hfMarkets.slug,
      marketName:   hfMarkets.name,
      marketType:   marketTypeSql,
      cityName:     hfMarkets.cityName,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(...conds))
    .orderBy(desc(hfPriceHistory.recordedDate), hfProducts.displayOrder)
    .limit(limit);
  return enrichPriceRows(rows);
}

type PriceSortKey = "avg-desc" | "avg-asc" | "name-asc" | "date-desc";

function priceOrder(sort?: PriceSortKey) {
  switch (sort) {
    case "avg-asc":
      return [asc(hfPriceHistory.avgPrice), hfProducts.displayOrder, hfProducts.nameTr] as const;
    case "avg-desc":
      return [desc(hfPriceHistory.avgPrice), hfProducts.displayOrder, hfProducts.nameTr] as const;
    case "name-asc":
      return [hfProducts.nameTr, hfMarkets.name] as const;
    case "date-desc":
    default:
      return [desc(hfPriceHistory.recordedDate), hfProducts.displayOrder] as const;
  }
}

async function priceQueryContext(params: {
  product?: string;
  q?: string;
  city?: string;
  market?: string;
  marketType?: MarketType;
  category?: string;
  range?: string;
}) {
  const days = parseRangeToDays(params.range);

  let anchor: string | null;
  if (params.market || params.marketType) {
    const marketConds: SQL[] = [];
    if (params.market) marketConds.push(eq(hfMarkets.slug, params.market));
    if (params.marketType) marketConds.push(marketTypeCondition(params.marketType));
    const mRows = await db
      .select({ d: sql<string | null>`MAX(${hfPriceHistory.recordedDate})` })
      .from(hfPriceHistory)
      .innerJoin(hfMarkets, eq(hfPriceHistory.marketId, hfMarkets.id))
      .where(and(...marketConds));
    const raw: unknown = mRows[0]?.d;
    anchor = raw ? (raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10)) : null;
  } else {
    anchor = await latestRecordedDate();
  }

  const anchorSql = anchor ? sql`${anchor}` : sql`CURDATE()`;
  const windowConds: SQL[] = [
    gte(hfPriceHistory.recordedDate, sql`DATE_SUB(${anchorSql}, INTERVAL ${sql.raw(String(days))} DAY)`),
    lte(hfPriceHistory.recordedDate, anchorSql),
  ];
  // Pasif urunler (is_active=0) public fiyat sorgularindan gizlenir: aksi halde
  // /fiyatlar linki uretir ama /urun/[slug] (listProducts is_active=1 filtreli)
  // urunu bulamaz -> 404. windowConds CTE'sinde hfProducts join'i olmadigi icin
  // filtre yalnizca conds'a eklenir.
  const conds: SQL[] = [...windowConds];
  conds.push(eq(hfProducts.isActive, 1));
  if (params.product)  conds.push(eq(hfProducts.slug, params.product));
  if (params.market)   conds.push(eq(hfMarkets.slug, params.market));
  if (params.marketType) conds.push(marketTypeCondition(params.marketType));
  if (params.category) conds.push(eq(hfProducts.categorySlug, params.category));
  if (params.q?.trim()) {
    const q = likeSafe(params.q.trim());
    if (q) conds.push(or(like(hfProducts.nameTr, `%${q}%`), like(hfProducts.slug, `%${q}%`))!);
  }
  if (params.city) {
    const c = likeSafe(params.city.trim());
    if (c) conds.push(or(like(hfMarkets.cityName, `%${c}%`), like(hfMarkets.slug, `%${c}%`))!);
  }

  return { days, windowConds, conds };
}

const priceColumns = {
  id:           hfPriceHistory.id,
  minPrice:     hfPriceHistory.minPrice,
  maxPrice:     hfPriceHistory.maxPrice,
  avgPrice:     hfPriceHistory.avgPrice,
  currency:     hfPriceHistory.currency,
  unit:         hfPriceHistory.unit,
  recordedDate: hfPriceHistory.recordedDate,
  sourceApi:    hfPriceHistory.sourceApi,
  fetchedAt:    hfPriceHistory.createdAt,
  productSlug:  hfProducts.slug,
  productName:  sql<string>`COALESCE(NULLIF(${hfProducts.displayName}, ''), ${hfProducts.nameTr})`,
  canonicalProduct: sql<string | null>`COALESCE(${hfProducts.canonicalSlug}, ${hfProducts.slug})`,
  categorySlug: hfProducts.categorySlug,
  marketSlug:   hfMarkets.slug,
  marketName:   hfMarkets.name,
  marketType:   marketTypeSql,
  cityName:     hfMarkets.cityName,
};

// Admin fiyat filtresi için dinamik kategori listesi (aktif ürünlerin distinct
// kategorileri + ürün sayısı). Dropdown'u beslemek için kullanılır.
export async function listPriceCategories(): Promise<{ slug: string; count: number }[]> {
  const rows = await db
    .select({ slug: hfProducts.categorySlug, count: sql<number>`COUNT(*)` })
    .from(hfProducts)
    .where(eq(hfProducts.isActive, 1))
    .groupBy(hfProducts.categorySlug)
    .orderBy(hfProducts.categorySlug);
  return rows
    .filter((r) => r.slug)
    .map((r) => ({ slug: r.slug as string, count: Number(r.count) }));
}

export async function listPriceRowsPage(params: {
  product?: string;
  q?: string;
  city?: string;
  market?: string;
  marketType?: MarketType;
  category?: string;
  range?: string;
  limit?: number;
  page?: number;
  latestOnly?: boolean;
  sort?: PriceSortKey;
}) {
  const limit = Math.min(250, Math.max(1, params.limit ?? 100));
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * limit;
  const latestOnly = params.latestOnly !== false;
  // latestOnly=false fetches all historical rows. Keep broad hal queries capped,
  // but allow borsa archives to expose the 5-year public history requested by
  // /borsa without opening the full hal table.
  const historyMaxDays = params.marketType === "borsa" ? 1825 : 365;
  const cappedParams = !latestOnly
    ? { ...params, range: capRange(params.range, historyMaxDays) }
    : params;
  const { windowConds, conds } = await priceQueryContext(cappedParams);
  const order = priceOrder(params.sort);

  if (latestOnly) {
    const latest = db.$with("latest_pair_dates").as(
      db
        .select({
          productId: hfPriceHistory.productId,
          marketId:  hfPriceHistory.marketId,
          rd:        sql<string>`MAX(${hfPriceHistory.recordedDate})`.as("rd"),
        })
        .from(hfPriceHistory)
        .where(and(...windowConds))
        .groupBy(hfPriceHistory.productId, hfPriceHistory.marketId),
    );

    const totalRows = await db
      .with(latest)
      .select({ total: sql<number>`COUNT(*)` })
      .from(hfPriceHistory)
      .innerJoin(
        latest,
        and(
          eq(latest.productId, hfPriceHistory.productId),
          eq(latest.marketId, hfPriceHistory.marketId),
          eq(latest.rd, hfPriceHistory.recordedDate),
        ),
      )
      .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
      .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
      .where(and(...conds));

    const items = await db
      .with(latest)
      .select(priceColumns)
      .from(hfPriceHistory)
      .innerJoin(
        latest,
        and(
          eq(latest.productId, hfPriceHistory.productId),
          eq(latest.marketId, hfPriceHistory.marketId),
          eq(latest.rd, hfPriceHistory.recordedDate),
        ),
      )
      .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
      .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
      .where(and(...conds))
      .orderBy(...order)
      .limit(limit)
      .offset(offset);

    const total = Number(totalRows[0]?.total ?? 0);
    return { items: enrichPriceRows(items), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  const totalRows = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(...conds));

  const items = await db
    .select(priceColumns)
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(...conds))
    .orderBy(...order)
    .limit(limit)
    .offset(offset);

  const total = Number(totalRows[0]?.total ?? 0);
  return { items: enrichPriceRows(items), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function latestPrice(params: { city?: string; product?: string; market?: string }) {
  const conds: SQL[] = [eq(hfProducts.isActive, 1), eq(hfMarkets.isActive, 1)];
  if (params.product?.trim()) {
    const p = likeSafe(params.product.trim());
    conds.push(or(eq(hfProducts.slug, p), like(hfProducts.nameTr, `%${p}%`), like(hfProducts.slug, `%${p}%`))!);
  }
  if (params.city?.trim()) {
    const c = likeSafe(params.city.trim());
    conds.push(or(like(hfMarkets.cityName, `%${c}%`), like(hfMarkets.slug, `%${c}%`))!);
  }
  if (params.market?.trim()) conds.push(eq(hfMarkets.slug, params.market.trim()));

  const [latest] = await db
    .select({ d: sql<string | Date | null>`MAX(${hfPriceHistory.recordedDate})` })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(...conds));
  const latestDate = isoDate(latest?.d);
  if (!latestDate) return null;
  const latestDaysOld = daysSinceIso(latestDate);
  const latestIsStale = (latestDaysOld ?? Infinity) > staleThresholdDays(null);
  const staleMessage = `${params.city ?? "Bu sorgu"} için bugünün verisi yok; en son ${latestDate} tarihli veri gösteriliyor.`;

  const rows = await db
    .select(priceColumns)
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(...conds, eq(hfPriceHistory.recordedDate, sql`${latestDate}`)))
    .orderBy(hfProducts.displayOrder, hfMarkets.displayOrder)
    .limit(100);

  return {
    items: enrichPriceRows(rows),
    latestRecordedDate: latestDate,
    warnings: latestIsStale
      ? [{
          code: "STALE_DATA",
          message: staleMessage,
          asOf: latestDate,
        }]
      : [],
  };
}

export async function productAliases(slug: string) {
  const rows = await db
    .select({
      slug: hfProducts.slug,
      nameTr: hfProducts.nameTr,
      aliases: hfProducts.aliases,
      canonicalSlug: hfProducts.canonicalSlug,
      displayName: hfProducts.displayName,
    })
    .from(hfProducts)
    .where(and(eq(hfProducts.slug, slug), eq(hfProducts.isActive, 1)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    slug: row.slug,
    nameTr: row.nameTr,
    displayName: row.displayName,
    aliases: Array.isArray(row.aliases) ? row.aliases : [],
    canonicalSlug: row.canonicalSlug,
    canonicalProduct: row.canonicalSlug ?? row.slug,
  };
}

export async function sourceStatusRows() {
  const sources = activeSources();
  const sourceKeys = sources.map((s) => s.key);
  const [runRows, priceRows, marketRows] = await Promise.all([
    db.execute(sql`
      SELECT r.source_api AS sourceApi, r.run_date AS runDate, r.rows_inserted AS rowsInserted,
             r.rows_fetched AS rowsFetched, r.rows_skipped AS rowsSkipped, r.status,
             r.error_msg AS errorMsg, r.created_at AS lastRunAt
      FROM hf_etl_runs r
      INNER JOIN (
        SELECT source_api, MAX(id) AS id
        FROM hf_etl_runs
        GROUP BY source_api
      ) latest ON latest.id = r.id
    `),
    db
      .select({
        sourceApi: hfPriceHistory.sourceApi,
        lastSourceDate: sql<string | Date>`MAX(${hfPriceHistory.recordedDate})`,
      })
      .from(hfPriceHistory)
      .groupBy(hfPriceHistory.sourceApi),
    db
      .select({
        sourceKey: hfMarkets.sourceKey,
        city: hfMarkets.cityName,
        marketName: hfMarkets.name,
        marketType: marketTypeSql,
      })
      .from(hfMarkets)
      .where(eq(hfMarkets.isActive, 1)),
  ]);

  const runs = (Array.isArray(runRows) ? runRows[0] : runRows) as unknown as Array<Record<string, unknown>>;
  const runMap = new Map(runs.map((r) => [String(r.sourceApi), r]));
  const priceMap = new Map(priceRows.map((r) => [r.sourceApi, isoDate(r.lastSourceDate)]));
  const marketMap = new Map<string, typeof marketRows[number]>();
  for (const market of marketRows) {
    if (market.sourceKey && !marketMap.has(market.sourceKey)) marketMap.set(market.sourceKey, market);
  }

  const staleCutoff = new Date();
  staleCutoff.setDate(staleCutoff.getDate() - 2);
  const staleIso = staleCutoff.toISOString().slice(0, 10);

  return sourceKeys.map((sourceKey) => {
    const source = sources.find((s) => s.key === sourceKey)!;
    const run = runMap.get(sourceKey);
    const market = marketMap.get(sourceKey);
    const lastSourceDate = priceMap.get(sourceKey) ?? null;
    const runStatus = typeof run?.status === "string" ? run.status : null;
    const status = runStatus === "error"
      ? "error"
      : runStatus === "partial"
        ? "partial"
        : lastSourceDate && lastSourceDate < staleIso
          ? "stale"
          : "ok";
    const info = sourceInfoFor(sourceKey, market?.marketType);
    return {
      sourceApi: sourceKey,
      sourceName: info?.name ?? sourceKey,
      sourceUrl: info?.url || null,
      sourceType: info?.type ?? sourceTypeFromMarketType(market?.marketType),
      city: market?.city ?? null,
      marketName: market?.marketName ?? source.marketSlug,
      status,
      lastSourceDate,
      lastRunAt: isoDateTime(run?.lastRunAt),
      rowsInserted: Number(run?.rowsInserted ?? 0),
      rowsFetched: Number(run?.rowsFetched ?? 0),
      rowsSkipped: Number(run?.rowsSkipped ?? 0),
      errorMsg: typeof run?.errorMsg === "string" ? run.errorMsg : null,
    };
  });
}

export async function listProducts(q?: string, category?: string, seoIndex?: boolean, marketType?: MarketType) {
  const conds: SQL[] = [eq(hfProducts.isActive, 1)];
  if (category?.trim()) conds.push(eq(hfProducts.categorySlug, category));
  if (seoIndex != null) conds.push(eq(hfProducts.seoIndex, seoIndex ? 1 : 0));
  if (marketType) {
    conds.push(sql`EXISTS (
      SELECT 1
      FROM hf_price_history ph
      INNER JOIN hf_markets m ON m.id = ph.market_id
      WHERE ph.product_id = ${hfProducts.id}
        AND m.is_active = 1
        AND m.market_type = ${marketType}
    )`);
  }
  if (q?.trim()) {
    const s = likeSafe(q.trim());
    if (s) conds.push(or(like(hfProducts.nameTr, `%${s}%`), like(hfProducts.slug, `%${s}%`))!);
  }
  return db
    .select({
      id:           hfProducts.id,
      slug:         hfProducts.slug,
      nameTr:       hfProducts.nameTr,
      categorySlug: hfProducts.categorySlug,
      unit:         hfProducts.unit,
      displayName:  hfProducts.displayName,
      canonicalSlug: hfProducts.canonicalSlug,
      familySlug:   hfProducts.familySlug,
      seoIndex:     hfProducts.seoIndex,
      dataQuality:  hfProducts.dataQuality,
      searchVolume: hfProducts.searchVolume,
    })
    .from(hfProducts)
    .where(and(...conds))
    .orderBy(hfProducts.displayOrder, hfProducts.nameTr);
}

export async function getPublishedProductEditorial(slug: string) {
  const rows = await db
    .select({
      productSlug: hfProductEditorial.productSlug,
      about: hfProductEditorial.aboutMd,
      priceFactors: hfProductEditorial.priceFactorsMd,
      season: hfProductEditorial.seasonMd,
      productionRegion: hfProductEditorial.productionRegionMd,
      qualityIndicators: hfProductEditorial.qualityIndicatorsMd,
      culinaryUses: hfProductEditorial.culinaryUsesMd,
      relatedSlugs: hfProductEditorial.relatedSlugs,
      publishedAt: hfProductEditorial.publishedAt,
    })
    .from(hfProductEditorial)
    .where(and(
      eq(hfProductEditorial.productSlug, slug),
      isNotNull(hfProductEditorial.publishedAt),
    ))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    relatedSlugs: Array.isArray(row.relatedSlugs) ? row.relatedSlugs : [],
    publishedAt: row.publishedAt instanceof Date ? row.publishedAt.toISOString() : String(row.publishedAt),
  };
}

export async function variantPricesByMaster(masterSlug: string, range = "7d") {
  const days = Math.min(30, parseRangeToDays(range));
  const result = await db.execute(sql`
    SELECT
      p.slug AS slug,
      COALESCE(NULLIF(p.display_name, ''), p.name_tr) AS displayName,
      p.category_slug AS categorySlug,
      p.unit AS unit,
      AVG(ph.avg_price) AS avgPrice,
      COUNT(DISTINCT ph.market_id) AS marketCount,
      COUNT(*) AS observationCount,
      MAX(ph.recorded_date) AS latestRecordedDate,
      (
        SELECT AVG(ph2.avg_price)
        FROM hf_price_history ph2
        WHERE ph2.product_id = p.id
          AND ph2.recorded_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 372 DAY)
                                    AND DATE_SUB(CURDATE(), INTERVAL 358 DAY)
      ) AS avgYoy
    FROM hf_products p
    INNER JOIN hf_price_history ph ON ph.product_id = p.id
    WHERE p.is_active = 1
      AND p.canonical_slug = ${masterSlug}
      AND ph.recorded_date >= DATE_SUB(CURDATE(), INTERVAL ${sql.raw(String(days))} DAY)
    GROUP BY p.id, p.slug, p.display_name, p.name_tr, p.category_slug, p.unit
    ORDER BY avgPrice DESC, displayName ASC
    LIMIT 80
  `);
  const rows = (Array.isArray(result) ? result[0] : result) as unknown as Array<{
    slug: string;
    displayName: string;
    categorySlug: string;
    unit: string;
    avgPrice: string | number;
    marketCount: string | number;
    observationCount: string | number;
    latestRecordedDate: string | Date;
    avgYoy: string | number | null;
  }>;

  return rows.map((row) => {
    const avgPrice = Number(row.avgPrice ?? 0);
    const avgYoy = row.avgYoy == null ? null : Number(row.avgYoy);
    return {
      slug: row.slug,
      displayName: row.displayName,
      categorySlug: row.categorySlug,
      unit: row.unit,
      avgPrice,
      yoyPct: avgYoy && avgYoy > 0
        ? Math.round(((avgPrice - avgYoy) / avgYoy) * 10_000) / 100
        : null,
      marketCount: Number(row.marketCount ?? 0),
      observationCount: Number(row.observationCount ?? 0),
      latestRecordedDate: row.latestRecordedDate instanceof Date
        ? row.latestRecordedDate.toISOString().slice(0, 10)
        : String(row.latestRecordedDate).slice(0, 10),
      url: `/urun/${row.slug}`,
    };
  });
}

function isSeoEligibleProductName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || /[().]/.test(trimmed)) return false;
  return trimmed !== trimmed.toLocaleUpperCase("tr");
}

export async function listSeoEligibleProducts(days: number) {
  const safeDays = Math.min(365, Math.max(1, Math.floor(days)));
  const rows = await db
    .select({
      id:           hfProducts.id,
      slug:         hfProducts.slug,
      nameTr:       hfProducts.nameTr,
      categorySlug: hfProducts.categorySlug,
      unit:         hfProducts.unit,
      updatedAt:    sql<string | Date>`MAX(${hfPriceHistory.recordedDate})`,
      marketCount:  sql<number>`COUNT(DISTINCT ${hfPriceHistory.marketId})`,
    })
    .from(hfProducts)
    .innerJoin(hfPriceHistory, eq(hfPriceHistory.productId, hfProducts.id))
    .where(and(
      eq(hfProducts.isActive, 1),
      gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL ${sql.raw(String(safeDays))} DAY)`),
    ))
    .groupBy(
      hfProducts.id,
      hfProducts.slug,
      hfProducts.nameTr,
      hfProducts.categorySlug,
      hfProducts.unit,
      hfProducts.displayOrder,
    )
    .orderBy(hfProducts.displayOrder, hfProducts.nameTr);

  return rows
    .filter((row) => Number(row.marketCount) >= 3 && isSeoEligibleProductName(row.nameTr))
    .map((row) => ({
      id:           row.id,
      slug:         row.slug,
      nameTr:       row.nameTr,
      categorySlug: row.categorySlug,
      unit:         row.unit,
      updatedAt: row.updatedAt instanceof Date
        ? row.updatedAt.toISOString().slice(0, 10)
        : String(row.updatedAt).slice(0, 10),
    }));
}

export async function getProductBySlug(slug: string) {
  const rows = await db
    .select()
    .from(hfProducts)
    .where(and(eq(hfProducts.slug, slug), eq(hfProducts.isActive, 1)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listMarkets(city?: string, seoIndex?: boolean) {
  const conds: SQL[] = [eq(hfMarkets.isActive, 1)];
  if (seoIndex != null) conds.push(eq(hfMarkets.seoIndex, seoIndex ? 1 : 0));
  if (city?.trim()) {
    const c = likeSafe(city.trim());
    if (c) conds.push(or(like(hfMarkets.cityName, `%${c}%`))!);
  }
  return db
    .select({
      id:          hfMarkets.id,
      slug:        hfMarkets.slug,
      name:        hfMarkets.name,
      cityName:    hfMarkets.cityName,
      regionSlug:  hfMarkets.regionSlug,
      sourceKey:   hfMarkets.sourceKey,
      marketType:   marketTypeSql,
      seoIndex:    hfMarkets.seoIndex,
      updatedAt:   hfMarkets.updatedAt,
    })
    .from(hfMarkets)
    .where(and(...conds))
    .orderBy(hfMarkets.displayOrder);
}

export async function cityPriceMap(params: {
  product?: string;
  category?: string;
  range?: string;
} = {}) {
  const days = Math.min(30, parseRangeToDays(params.range));
  const anchor = await latestRecordedDate();
  const anchorExpr = anchor ? sql`${anchor}` : sql`CURDATE()`;
  const productCond = params.product?.trim()
    ? sql` AND o.slug = ${params.product.trim()}`
    : sql``;
  const categoryCond = params.category?.trim()
    ? sql` AND o.category_slug = ${params.category.trim()}`
    : sql``;
  const basketList = sql.join(
    INDEX_BASKET_SLUGS.map((s) => sql`${s}`),
    sql`, `,
  );

  // NEDEN raw SQL: CTE + self-join (Drizzle builder CTE sql-alias kolonu yanlış
  // çözümlüyor). Ayrıca priceIndex: iller farklı ürün karışımı raporladığı için
  // ham ortalama karşılaştırılamaz. Çözüm — sabit endeks sepetiyle (15 ürün)
  // normalize: her ilin sepet ürünleri ulusal ortalamaya oranlanır, ortalaması
  // alınır. priceIndex 1.00 = Türkiye sepet ortalaması, <1 ucuz, >1 pahalı.
  const query = sql`
    WITH latest AS (
      SELECT product_id, market_id, MAX(recorded_date) AS rd
      FROM hf_price_history
      WHERE recorded_date >= DATE_SUB(${anchorExpr}, INTERVAL ${sql.raw(String(days))} DAY)
        AND recorded_date <= ${anchorExpr}
      GROUP BY product_id, market_id
    ),
    obs AS (
      SELECT m.id AS market_id, m.city_name, p.id AS product_id,
             p.slug, p.category_slug, ph.avg_price, ph.recorded_date,
             SUBSTRING_INDEX(p.slug, '-', 1) AS base
      FROM hf_price_history ph
      INNER JOIN latest l
        ON l.product_id = ph.product_id
       AND l.market_id  = ph.market_id
       AND l.rd         = ph.recorded_date
      INNER JOIN hf_products p ON p.id = ph.product_id AND p.is_active = 1
      INNER JOIN hf_markets  m ON m.id = ph.market_id  AND m.is_active = 1
      WHERE (m.region_slug IS NULL OR m.region_slug <> 'ulusal')
    ),
    city_prod AS (
      -- base = slug'ın ilk segmenti: "elma-golden","elma-starking" → "elma".
      -- Çeşitler tek baz ürüne toplanır → sepet kapsamı yüksek olur.
      SELECT city_name, base, AVG(avg_price) AS p
      FROM obs WHERE base IN (${basketList})
      GROUP BY city_name, base
    ),
    nat AS (
      SELECT base, AVG(p) AS np FROM city_prod GROUP BY base
    ),
    idx AS (
      SELECT cp.city_name,
             AVG(cp.p)              AS basketAvg,
             AVG(cp.p / nat.np)     AS priceIndex,
             COUNT(*)               AS basketCount
      FROM city_prod cp
      INNER JOIN nat ON nat.base = cp.base
      GROUP BY cp.city_name
    )
    SELECT
      o.city_name              AS cityName,
      AVG(o.avg_price)         AS avgPrice,
      MIN(o.avg_price)         AS minPrice,
      MAX(o.avg_price)         AS maxPrice,
      COUNT(DISTINCT o.market_id)  AS marketCount,
      COUNT(DISTINCT o.product_id) AS productCount,
      COUNT(*)                 AS observationCount,
      MAX(o.recorded_date)     AS latestRecordedDate,
      idx.basketAvg            AS basketAvg,
      idx.priceIndex           AS priceIndex,
      idx.basketCount          AS basketCount
    FROM obs o
    LEFT JOIN idx ON idx.city_name = o.city_name
    WHERE 1 = 1
      ${productCond}
      ${categoryCond}
    GROUP BY o.city_name, idx.basketAvg, idx.priceIndex, idx.basketCount
    ORDER BY o.city_name
  `;

  const result = (await db.execute(query)) as unknown;
  const rows = (Array.isArray(result) ? result[0] : result) as Array<{
    cityName: string;
    avgPrice: string | number;
    minPrice: string | number;
    maxPrice: string | number;
    marketCount: string | number;
    productCount: string | number;
    observationCount: string | number;
    latestRecordedDate: unknown;
    basketAvg: string | number | null;
    priceIndex: string | number | null;
    basketCount: string | number | null;
  }>;

  const round2 = (v: unknown) => Math.round(Number(v) * 100) / 100;
  return rows.map((r) => {
    const latestRecordedDate = r.latestRecordedDate as unknown;
    const idxRaw = r.priceIndex;
    return {
      cityName:           r.cityName,
      avgPrice:           round2(r.avgPrice),
      minPrice:           round2(r.minPrice),
      maxPrice:           round2(r.maxPrice),
      marketCount:        Number(r.marketCount ?? 0),
      productCount:       Number(r.productCount ?? 0),
      observationCount:   Number(r.observationCount ?? 0),
      latestRecordedDate: latestRecordedDate instanceof Date
        ? latestRecordedDate.toISOString().slice(0, 10)
        : String(latestRecordedDate).slice(0, 10),
      // Karşılaştırılabilir metrikler — sabit endeks sepetiyle normalize
      basketAvg:          r.basketAvg == null ? null : round2(r.basketAvg),
      priceIndex:         idxRaw == null ? null : Math.round(Number(idxRaw) * 1000) / 1000,
      basketProductCount: Number(r.basketCount ?? 0),
    };
  });
}

// Son 7 günde en çok değişen ürün/hal çiftleri
type Obs = { productId: number; marketId: number; avgPrice: string; recordedDate: string };
// Outlier guard: ETL parse hatası veya mevsim verisi ilk günde %300+ sapma üretebilir.
// Gerçek piyasa hareketleri nadiren %50-70 üstüdür; eşikler dış yayın için sıkı tutulur.
// (2026-05-14 denetimi: brokoli +143%, biber-kaliforniya +141% gibi ETL placeholder
// veri sıçramaları %150 cap altında geçiyordu — eşikler düşürüldü.)
const TREND_MAX_ABS_CHANGE_PCT = 80;
const WIDGET_MAX_ABS_CHANGE_PCT = 100;

// Ulusal/aggregate kaynaklar trending'e dahil edilmez — gün içi varyans çok yüksek
const TRENDING_EXCLUDE_SLUGS = new Set(["ulusal-hal-gov-tr"]);

export async function trendingChanges(limit = 10) {
  const rows = await db
    .select({
      productId:    hfPriceHistory.productId,
      marketId:     hfPriceHistory.marketId,
      avgPrice:     hfPriceHistory.avgPrice,
      recordedDate: hfPriceHistory.recordedDate,
      marketSlug:   hfMarkets.slug,
    })
    .from(hfPriceHistory)
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 14 DAY)`));

  const byKey = new Map<string, Obs[]>();
  for (const r of rows) {
    // Çok gürültülü aggregate kaynakları trending hesabından çıkar
    if (TRENDING_EXCLUDE_SLUGS.has(r.marketSlug)) continue;

    const k = `${r.productId}:${r.marketId}`;
    if (!byKey.has(k)) byKey.set(k, []);
    const rd = r.recordedDate instanceof Date
      ? r.recordedDate.toISOString().slice(0, 10)
      : String(r.recordedDate).slice(0, 10);
    byKey.get(k)!.push({
      productId:    r.productId,
      marketId:     r.marketId,
      avgPrice:     String(r.avgPrice),
      recordedDate: rd,
    });
  }

  const scored: { productId: number; marketId: number; changePct: number; latest: number; previous: number }[] = [];

  // Güncel analiz tarihi — "son 5 günde verisi olmayan kaynak" hesaba katılmaz
  const todayMs = Date.now();
  const FRESHNESS_MS = 5 * 24 * 60 * 60 * 1000;

  for (const [, list] of byKey) {
    list.sort((a, b) => (a.recordedDate < b.recordedDate ? 1 : -1));
    if (list.length < 2) continue;

    const latest = list[0]!;

    // Stale data filtresi: son verisi 5+ gün önceyse trending'e dahil etme
    const latestMs = new Date(`${latest.recordedDate}T12:00:00`).getTime();
    if (todayMs - latestMs > FRESHNESS_MS) continue;

    const latestDate = new Date(`${latest.recordedDate}T12:00:00`);
    // 4 günlük pencere: her 2-3 günde güncelleyen kaynaklar için yeterli veri noktası sağlar
    const latestWindowStart = shiftIsoDate(latest.recordedDate, -3);
    const prevWindowStart = shiftIsoDate(latest.recordedDate, -14);
    const prevWindowEnd = shiftIsoDate(latest.recordedDate, -7);

    const latestWindow = list.filter((x) => x.recordedDate >= latestWindowStart && x.recordedDate <= latest.recordedDate);
    const prevWindow = list.filter((x) => x.recordedDate >= prevWindowStart && x.recordedDate <= prevWindowEnd);
    const fallbackPrev = list.filter((x) => {
      const d = new Date(`${x.recordedDate}T12:00:00`);
      return d.getTime() < latestDate.getTime();
    }).slice(0, 3);

    const lp = avgObs(latestWindow);
    const pp = avgObs(prevWindow.length > 0 ? prevWindow : fallbackPrev);
    if (lp == null || pp == null || pp <= 0) continue;

    // Veri düzeltme olaylarını filtrele: fiyat 3x+ değişmişse gerçek piyasa hareketi değil,
    // büyük olasılıkla ETL parse hatası veya placeholder data sıçraması (40→125 gibi)
    if (lp / pp > 3 || pp / lp > 3) continue;

    const changePct = Math.round((10000 * (lp - pp)) / pp) / 100;
    if (Math.abs(changePct) > TREND_MAX_ABS_CHANGE_PCT) continue;

    scored.push({
      productId: latest.productId,
      marketId:  latest.marketId,
      changePct,
      latest:    lp,
      previous:  pp,
    });
  }

  // Cross-market median doğrulama: aynı ürün birden fazla markette varsa,
  // prev veya latest değeri diğer marketlerin median'ından 2x+ sapıyorsa veri hatasıdır.
  // (2x: brokoli eskisehir prev=40 vs cross-market median=70 → filtrelenir; 5x toleransla geçiyordu)
  const latestsByProduct = new Map<number, number[]>();
  for (const s of scored) {
    if (!latestsByProduct.has(s.productId)) latestsByProduct.set(s.productId, []);
    latestsByProduct.get(s.productId)!.push(s.latest);
  }
  const validated = scored.filter((s) => {
    const latests = latestsByProduct.get(s.productId)!;
    if (latests.length < 2) return true; // tek kaynak, cross-market doğrulama yok
    const sorted = [...latests].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)]!;
    if (median <= 0) return true;
    return s.previous >= median / 2 && s.previous <= median * 2;
  });

  // En çok artan top N/2 + en çok düşen top N/2 → her zaman her iki yönden veri döner
  const half = Math.ceil(limit / 2);
  const risers = validated.filter((s) => s.changePct > 0).sort((a, b) => b.changePct - a.changePct).slice(0, half);
  const fallers = validated.filter((s) => s.changePct < 0).sort((a, b) => a.changePct - b.changePct).slice(0, half);
  const top = [...risers, ...fallers];
  if (!top.length) return [];

  const prodIds = [...new Set(top.map((t) => t.productId))];
  const mktIds  = [...new Set(top.map((t) => t.marketId))];

  const [products, markets] = await Promise.all([
    db.select({ id: hfProducts.id, slug: hfProducts.slug, nameTr: hfProducts.nameTr, categorySlug: hfProducts.categorySlug })
      .from(hfProducts).where(inArray(hfProducts.id, prodIds)),
    db.select({ id: hfMarkets.id, slug: hfMarkets.slug, name: hfMarkets.name, cityName: hfMarkets.cityName })
      .from(hfMarkets).where(inArray(hfMarkets.id, mktIds)),
  ]);

  const pMap = new Map(products.map((p) => [p.id, p]));
  const mMap = new Map(markets.map((m) => [m.id, m]));

  return top.map((t) => ({ ...t, product: pMap.get(t.productId), market: mMap.get(t.marketId) }));
}

function shiftIsoDate(iso: string, deltaDays: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function avgObs(rows: Obs[]): number | null {
  const nums = rows.map((r) => parseFloat(r.avgPrice)).filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return null;
  if (nums.length === 1) return nums[0]!;
  // Pencere içi outlier temizliği: medyandan 5x+ sapan değerleri çıkar (ETL düzeltme kayıtları)
  const sorted = [...nums].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const filtered = nums.filter((n) => n >= median / 5 && n <= median * 5);
  const use = filtered.length > 0 ? filtered : nums;
  return use.reduce((sum, n) => sum + n, 0) / use.length;
}

// Tek ürünün belirli hal'deki fiyat geçmişi
export async function productPriceHistory(productSlug: string, marketSlug?: string, days = 30) {
  const conds: SQL[] = [
    eq(hfProducts.slug, productSlug),
    gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL ${sql.raw(String(days))} DAY)`),
  ];
  if (marketSlug) conds.push(eq(hfMarkets.slug, marketSlug));

  return db
    .select({
      recordedDate: hfPriceHistory.recordedDate,
      minPrice:     hfPriceHistory.minPrice,
      maxPrice:     hfPriceHistory.maxPrice,
      avgPrice:     hfPriceHistory.avgPrice,
      marketSlug:   hfMarkets.slug,
      marketName:   hfMarkets.name,
      cityName:     hfMarkets.cityName,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(...conds))
    .orderBy(hfPriceHistory.recordedDate, hfMarkets.displayOrder);
}

/**
 * Widget endpoint icin urun bazi en guncel fiyat + haftalik degisim yuzdesi.
 * Pazar ortalamalari alinir; changePct = null ise onceki veri yoktur.
 */
export async function widgetPrices(slugs?: string[], category?: string, limit = 12) {
  const productConds: SQL[] = [eq(hfProducts.isActive, 1)];
  if (slugs?.length) productConds.push(inArray(hfProducts.slug, slugs));
  if (category) productConds.push(eq(hfProducts.categorySlug, category));

  const latestRows = await db
    .select({
      productSlug:  hfProducts.slug,
      productName:  sql<string>`COALESCE(NULLIF(${hfProducts.displayName}, ''), ${hfProducts.nameTr})`,
      categorySlug: hfProducts.categorySlug,
      unit:         hfProducts.unit,
      avgPrice:     sql<string>`AVG(${hfPriceHistory.avgPrice})`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .where(and(
      gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 3 DAY)`),
      ...productConds,
    ))
    .groupBy(hfProducts.id, hfProducts.slug, hfProducts.nameTr, hfProducts.categorySlug, hfProducts.unit)
    .orderBy(hfProducts.displayOrder)
    .limit(limit);

  if (!latestRows.length) return [];

  const latestSlugs = latestRows.map((r) => r.productSlug);

  // Gecen hafta (7-14 gun once) ortalama — 7g changePct icin
  const prevRows = await db
    .select({
      productSlug: hfProducts.slug,
      avgPrice:    sql<string>`AVG(${hfPriceHistory.avgPrice})`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .where(and(
      gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 14 DAY)`),
      lte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 7 DAY)`),
      inArray(hfProducts.slug, latestSlugs),
    ))
    .groupBy(hfProducts.slug);

  // Gecen yil ayni hafta (-365 ±7 gun) ortalama — yoyChangePct icin
  // Genis pencere: 335-395 gun, sezon kaymasini absorbe etmek icin 30 gun radius
  const yoyRows = await db
    .select({
      productSlug: hfProducts.slug,
      avgPrice:    sql<string>`AVG(${hfPriceHistory.avgPrice})`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .where(and(
      gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 395 DAY)`),
      lte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 335 DAY)`),
      inArray(hfProducts.slug, latestSlugs),
    ))
    .groupBy(hfProducts.slug);

  const prevMap = new Map(prevRows.map((r) => [r.productSlug, Number(r.avgPrice)]));
  const yoyMap = new Map(yoyRows.map((r) => [r.productSlug, Number(r.avgPrice)]));

  return latestRows.map((r) => {
    const latest = Number(r.avgPrice);
    const prev = prevMap.get(r.productSlug);
    const yoy = yoyMap.get(r.productSlug);
    const rawPct = prev && prev > 0 ? Math.round((10000 * (latest - prev)) / prev) / 100 : null;
    const changePct = rawPct !== null && Math.abs(rawPct) <= WIDGET_MAX_ABS_CHANGE_PCT ? rawPct : null;
    // YoY icin daha genis tolerans — sezon kaymalari ve enflasyon nedeniyle 300% gorulebilir
    const rawYoy = yoy && yoy > 0 ? Math.round((10000 * (latest - yoy)) / yoy) / 100 : null;
    const yoyChangePct = rawYoy !== null && Math.abs(rawYoy) <= 400 ? rawYoy : null;
    return {
      productSlug:  r.productSlug,
      productName:  r.productName,
      categorySlug: r.categorySlug,
      avgPrice:     latest,
      unit:         r.unit ?? "kg",
      changePct,
      yoyChangePct,
    };
  });
}

/**
 * Ürün slug için son 3 gündeki perakende zincir fiyatları.
 * Bir zincirde birden fazla kayıt varsa ortalama alınır.
 */
export async function retailPricesByProduct(productSlug: string) {
  const product = await db
    .select({ id: hfProducts.id })
    .from(hfProducts)
    .where(and(eq(hfProducts.slug, productSlug), eq(hfProducts.isActive, 1)))
    .limit(1);

  if (!product[0]) return [];

  return db
    .select({
      chainSlug:    hfRetailPrices.chainSlug,
      price:        sql<string>`AVG(${hfRetailPrices.price})`,
      unit:         hfRetailPrices.unit,
      recordedDate: sql<string>`MAX(${hfRetailPrices.recordedDate})`,
    })
    .from(hfRetailPrices)
    .where(and(
      eq(hfRetailPrices.productId, product[0].id),
      gte(hfRetailPrices.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 3 DAY)`),
    ))
    .groupBy(hfRetailPrices.chainSlug, hfRetailPrices.unit);
}

// ETL: tek satır upsert (DUPLICATE KEY UPDATE)
export async function upsertPriceRow(input: {
  productId:   number;
  marketId:    number;
  minPrice?:   string | null;
  maxPrice?:   string | null;
  avgPrice:    string;
  recordedDate: string;
  sourceApi:   string;
  unit?:       string | null;   // koli/kasa gibi paket birimleri; verilmezse kg
}) {
  const unit = input.unit ?? "kg";
  await db
    .insert(hfPriceHistory)
    .values({
      productId:    input.productId,
      marketId:     input.marketId,
      minPrice:     input.minPrice ?? null,
      maxPrice:     input.maxPrice ?? null,
      avgPrice:     input.avgPrice,
      currency:     "TRY",
      unit,
      recordedDate: new Date(`${input.recordedDate}T12:00:00`),
      sourceApi:    input.sourceApi,
    })
    .onDuplicateKeyUpdate({
      set: {
        minPrice:  input.minPrice ?? null,
        maxPrice:  input.maxPrice ?? null,
        avgPrice:  input.avgPrice,
        unit,
        sourceApi: input.sourceApi,
      },
    });
}
