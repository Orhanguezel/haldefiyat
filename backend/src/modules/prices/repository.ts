import type { SQL } from "drizzle-orm";
import { and, asc, desc, eq, gte, lte, sql, or, like, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { hfMarkets, hfPriceHistory, hfProducts } from "@/db/schema";

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

/**
 * En son fiyat kaydının tarihi. DB boşsa null.
 * Frontend'in "son veri X gün öncesine ait" mesajı için de kullanılır.
 */
export async function latestRecordedDate(): Promise<string | null> {
  const rows = await db
    .select({ d: sql<string | Date | null>`MAX(${hfPriceHistory.recordedDate})` })
    .from(hfPriceHistory);
  const raw: unknown = rows[0]?.d;
  if (!raw) return null;
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  return String(raw).slice(0, 10);
}

function likeSafe(raw: string): string {
  return raw.replace(/[%_\\]/g, "");
}

export async function listPriceRows(params: {
  product?: string;
  q?: string;
  city?: string;
  market?: string;
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
  if (params.market) {
    const mRows = await db
      .select({ d: sql<string | null>`MAX(${hfPriceHistory.recordedDate})` })
      .from(hfPriceHistory)
      .innerJoin(hfMarkets, eq(hfPriceHistory.marketId, hfMarkets.id))
      .where(eq(hfMarkets.slug, params.market));
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

  const conds: SQL[] = [...windowConds];
  if (params.product)  conds.push(eq(hfProducts.slug, params.product));
  if (params.market)   conds.push(eq(hfMarkets.slug, params.market));
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

    return db
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
        productSlug:  hfProducts.slug,
        productName:  hfProducts.nameTr,
        categorySlug: hfProducts.categorySlug,
        marketSlug:   hfMarkets.slug,
        marketName:   hfMarkets.name,
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
  }

  return db
    .select({
      id:           hfPriceHistory.id,
      minPrice:     hfPriceHistory.minPrice,
      maxPrice:     hfPriceHistory.maxPrice,
      avgPrice:     hfPriceHistory.avgPrice,
      currency:     hfPriceHistory.currency,
      unit:         hfPriceHistory.unit,
      recordedDate: hfPriceHistory.recordedDate,
      sourceApi:    hfPriceHistory.sourceApi,
      productSlug:  hfProducts.slug,
      productName:  hfProducts.nameTr,
      categorySlug: hfProducts.categorySlug,
      marketSlug:   hfMarkets.slug,
      marketName:   hfMarkets.name,
      cityName:     hfMarkets.cityName,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .innerJoin(hfMarkets, eq(hfMarkets.id, hfPriceHistory.marketId))
    .where(and(...conds))
    .orderBy(desc(hfPriceHistory.recordedDate), hfProducts.displayOrder)
    .limit(limit);
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
  category?: string;
  range?: string;
}) {
  const days = parseRangeToDays(params.range);

  let anchor: string | null;
  if (params.market) {
    const mRows = await db
      .select({ d: sql<string | null>`MAX(${hfPriceHistory.recordedDate})` })
      .from(hfPriceHistory)
      .innerJoin(hfMarkets, eq(hfPriceHistory.marketId, hfMarkets.id))
      .where(eq(hfMarkets.slug, params.market));
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
  const conds: SQL[] = [...windowConds];
  if (params.product)  conds.push(eq(hfProducts.slug, params.product));
  if (params.market)   conds.push(eq(hfMarkets.slug, params.market));
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
  productSlug:  hfProducts.slug,
  productName:  hfProducts.nameTr,
  categorySlug: hfProducts.categorySlug,
  marketSlug:   hfMarkets.slug,
  marketName:   hfMarkets.name,
  cityName:     hfMarkets.cityName,
};

export async function listPriceRowsPage(params: {
  product?: string;
  q?: string;
  city?: string;
  market?: string;
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
  // latestOnly=false fetches all historical rows — cap at 365d to prevent full-table timeout.
  const cappedParams = !latestOnly
    ? { ...params, range: capRange(params.range, 365) }
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
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
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
  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function listProducts(q?: string, category?: string) {
  const conds: SQL[] = [eq(hfProducts.isActive, 1)];
  if (category?.trim()) conds.push(eq(hfProducts.categorySlug, category));
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
    })
    .from(hfProducts)
    .where(and(...conds))
    .orderBy(hfProducts.displayOrder, hfProducts.nameTr);
}

export async function getProductBySlug(slug: string) {
  const rows = await db
    .select()
    .from(hfProducts)
    .where(and(eq(hfProducts.slug, slug), eq(hfProducts.isActive, 1)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listMarkets(city?: string) {
  const conds: SQL[] = [eq(hfMarkets.isActive, 1)];
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
    })
    .from(hfMarkets)
    .where(and(...conds))
    .orderBy(hfMarkets.displayOrder);
}

// Son 7 günde en çok değişen ürün/hal çiftleri
type Obs = { productId: number; marketId: number; avgPrice: string; recordedDate: string };
// Outlier guard: ETL parse hatası veya mevsim verisi ilk günde %300+ sapma üretebilir.
// Widget dışa verdiğimiz için daha sıkı tutuyoruz (150%).
const TREND_MAX_ABS_CHANGE_PCT = 150;
const WIDGET_MAX_ABS_CHANGE_PCT = 150;

export async function trendingChanges(limit = 10) {
  const rows = await db
    .select({
      productId:    hfPriceHistory.productId,
      marketId:     hfPriceHistory.marketId,
      avgPrice:     hfPriceHistory.avgPrice,
      recordedDate: hfPriceHistory.recordedDate,
    })
    .from(hfPriceHistory)
    .where(gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL 14 DAY)`));

  const byKey = new Map<string, Obs[]>();
  for (const r of rows) {
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

    // Veri düzeltme olaylarını filtrele: fiyat 5x+ değişmişse gerçek piyasa hareketi değil
    if (lp / pp > 5 || pp / lp > 5) continue;

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
  // prev veya latest değeri diğer marketlerin median'ından 5x+ sapıyorsa veri hatasıdır
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
    return s.previous >= median / 5 && s.previous <= median * 5;
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
      productName:  hfProducts.nameTr,
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

  const prevMap = new Map(prevRows.map((r) => [r.productSlug, Number(r.avgPrice)]));

  return latestRows.map((r) => {
    const latest = Number(r.avgPrice);
    const prev = prevMap.get(r.productSlug);
    const rawPct = prev && prev > 0 ? Math.round((10000 * (latest - prev)) / prev) / 100 : null;
    const changePct = rawPct !== null && Math.abs(rawPct) <= WIDGET_MAX_ABS_CHANGE_PCT ? rawPct : null;
    return {
      productSlug:  r.productSlug,
      productName:  r.productName,
      categorySlug: r.categorySlug,
      avgPrice:     latest,
      unit:         r.unit ?? "kg",
      changePct,
    };
  });
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
}) {
  await db
    .insert(hfPriceHistory)
    .values({
      productId:    input.productId,
      marketId:     input.marketId,
      minPrice:     input.minPrice ?? null,
      maxPrice:     input.maxPrice ?? null,
      avgPrice:     input.avgPrice,
      currency:     "TRY",
      unit:         "kg",
      recordedDate: new Date(`${input.recordedDate}T12:00:00`),
      sourceApi:    input.sourceApi,
    })
    .onDuplicateKeyUpdate({
      set: {
        minPrice:  input.minPrice ?? null,
        maxPrice:  input.maxPrice ?? null,
        avgPrice:  input.avgPrice,
        sourceApi: input.sourceApi,
      },
    });
}
