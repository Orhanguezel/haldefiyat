import type { SQL } from "drizzle-orm";
import { and, desc, eq, gte, sql, or, like, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { hfMarkets, hfPriceHistory, hfProducts } from "@/db/schema";

export function parseRangeToDays(range?: string): number {
  if (!range) return 7;
  const m = /^(\d+)d$/.exec(range.trim());
  if (m) return Math.min(365, Math.max(1, parseInt(m[1], 10)));
  return 7;
}

function likeSafe(raw: string): string {
  return raw.replace(/[%_\\]/g, "");
}

export async function listPriceRows(params: {
  product?: string;
  city?: string;
  market?: string;
  category?: string;
  range?: string;
  limit?: number;
}) {
  const days = parseRangeToDays(params.range);
  const limit = Math.min(500, Math.max(1, params.limit ?? 100));

  const conds: SQL[] = [
    gte(hfPriceHistory.recordedDate, sql`DATE_SUB(CURDATE(), INTERVAL ${sql.raw(String(days))} DAY)`),
  ];

  if (params.product) conds.push(eq(hfProducts.slug, params.product));
  if (params.market)  conds.push(eq(hfMarkets.slug, params.market));
  if (params.category) conds.push(eq(hfProducts.categorySlug, params.category));
  if (params.city) {
    const c = likeSafe(params.city.trim());
    if (c) conds.push(or(like(hfMarkets.cityName, `%${c}%`), like(hfMarkets.slug, `%${c}%`))!);
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

  for (const [, list] of byKey) {
    list.sort((a, b) => (a.recordedDate < b.recordedDate ? 1 : -1));
    if (list.length < 2) continue;
    const latest = list[0]!;
    const anchor = new Date(`${latest.recordedDate}T12:00:00`);
    anchor.setDate(anchor.getDate() - 7);
    const target = anchor.toISOString().slice(0, 10);
    const prev = list.find((x) => x.recordedDate <= target) ?? list[list.length - 1]!;
    if (prev.recordedDate === latest.recordedDate) continue;
    const lp = parseFloat(latest.avgPrice);
    const pp = parseFloat(prev.avgPrice);
    if (!pp) continue;
    scored.push({
      productId: latest.productId,
      marketId:  latest.marketId,
      changePct: Math.round((10000 * (lp - pp)) / pp) / 100,
      latest:    lp,
      previous:  pp,
    });
  }

  scored.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const top = scored.slice(0, limit);
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
