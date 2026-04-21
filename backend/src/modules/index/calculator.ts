import { and, avg, between, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfIndexSnapshots, hfPriceHistory, hfProducts } from "@/db/schema";
import { resolveWeekRange } from "@/modules/prices/iso-week";

/**
 * HaldeFiyat Endeksi v1 sepeti — temel sebze ve meyveler.
 * ETL ürünleri otomatik kaydeder; buradaki slug'lar DB'deki slug'larla eşleşmeli.
 * Eşleşmeyen slug'lar sessizce atlanır (products_count bu durumu yansıtır).
 */
export const INDEX_BASKET_SLUGS = [
  "domates",
  "biber",
  "patlican",
  "salatalik",
  "patates",
  "sogan",
  "havuc",
  "marul",
  "kabak",
  "brokoli",
  "elma",
  "portakal",
  "limon",
  "uzum",
  "muz",
];

export type IndexSnapshot = {
  indexWeek:     string;
  indexValue:    number;
  baseWeek:      string;
  basketAvg:     number;
  productsCount: number;
  weekStart:     string;
  weekEnd:       string;
};

export async function calculateWeeklyIndex(week?: string): Promise<IndexSnapshot | null> {
  const { weekStart, weekEnd, isoWeek } = resolveWeekRange(week);

  const productIds = await resolveBasketProductIds();
  if (!productIds.length) return null;

  const basketAvg = await computeBasketAvg(productIds, weekStart, weekEnd);
  if (basketAvg === null || basketAvg.avg === 0) return null;

  const baseWeek = await getOrSetBaseWeek(isoWeek, weekStart, weekEnd, basketAvg.avg, basketAvg.count);
  const baseAvg  = await getBaseAvg(baseWeek);
  if (!baseAvg) return null;

  const indexValue = (basketAvg.avg / baseAvg) * 100;

  await db
    .insert(hfIndexSnapshots)
    .values({
      indexWeek:     isoWeek,
      indexValue:    String(Math.round(indexValue * 10000) / 10000),
      baseWeek,
      basketAvg:     String(Math.round(basketAvg.avg * 10000) / 10000),
      productsCount: basketAvg.count,
      weekStart:     new Date(weekStart),
      weekEnd:       new Date(weekEnd),
    })
    .onDuplicateKeyUpdate({
      set: {
        indexValue:    sql`VALUES(index_value)`,
        basketAvg:     sql`VALUES(basket_avg)`,
        productsCount: sql`VALUES(products_count)`,
        updatedAt:     sql`CURRENT_TIMESTAMP(3)`,
      },
    });

  return {
    indexWeek: isoWeek,
    indexValue: Math.round(indexValue * 100) / 100,
    baseWeek,
    basketAvg: Math.round(basketAvg.avg * 100) / 100,
    productsCount: basketAvg.count,
    weekStart,
    weekEnd,
  };
}

async function resolveBasketProductIds(): Promise<number[]> {
  const rows = await db
    .select({ id: hfProducts.id })
    .from(hfProducts)
    .where(and(inArray(hfProducts.slug, INDEX_BASKET_SLUGS), eq(hfProducts.isActive, 1)));
  return rows.map((r) => r.id);
}

async function computeBasketAvg(
  productIds: number[],
  weekStart: string,
  weekEnd: string,
): Promise<{ avg: number; count: number } | null> {
  // Pazar bazında fiyat al — her (ürün, pazar) çifti için haftalık ortalama
  const rows = await db
    .select({
      productId: hfPriceHistory.productId,
      marketId:  hfPriceHistory.marketId,
      avg:       avg(hfPriceHistory.avgPrice).as("avg"),
    })
    .from(hfPriceHistory)
    .where(
      and(
        inArray(hfPriceHistory.productId, productIds),
        between(hfPriceHistory.recordedDate, sql`${weekStart}`, sql`${weekEnd}`),
      ),
    )
    .groupBy(hfPriceHistory.productId, hfPriceHistory.marketId);

  // Ürün başına pazar fiyatlarını topla
  const byProduct = new Map<number, number[]>();
  for (const r of rows) {
    const p = parseFloat(String(r.avg));
    if (!Number.isFinite(p) || p <= 0) continue;
    if (!byProduct.has(r.productId)) byProduct.set(r.productId, []);
    byProduct.get(r.productId)!.push(p);
  }

  // Her ürün için outlier pazarları çıkar, ardından ortalama al
  const productAvgs: number[] = [];
  for (const prices of byProduct.values()) {
    const filtered = iqrFilter(prices);
    if (filtered.length > 0) {
      productAvgs.push(filtered.reduce((s, p) => s + p, 0) / filtered.length);
    }
  }

  if (!productAvgs.length) return null;
  const mean = productAvgs.reduce((s, p) => s + p, 0) / productAvgs.length;
  return { avg: mean, count: productAvgs.length };
}

/** IQR yöntemiyle aşırı uç değerleri filtreler (az veri varsa dokunmaz). */
function iqrFilter(prices: number[]): number[] {
  if (prices.length < 4) return prices;
  const s = [...prices].sort((a, b) => a - b);
  const q1 = s[Math.floor(s.length * 0.25)]!;
  const q3 = s[Math.floor(s.length * 0.75)]!;
  const iqr = q3 - q1;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return prices.filter((p) => p >= lo && p <= hi);
}

async function getOrSetBaseWeek(
  isoWeek: string,
  weekStart: string,
  weekEnd: string,
  basketAvg: number,
  count: number,
): Promise<string> {
  const [first] = await db
    .select({ indexWeek: hfIndexSnapshots.indexWeek })
    .from(hfIndexSnapshots)
    .orderBy(hfIndexSnapshots.indexWeek)
    .limit(1);

  if (first) return first.indexWeek;

  // Bu ilk hafta → baz hafta olarak kaydet (index_value = 100)
  await db
    .insert(hfIndexSnapshots)
    .values({
      indexWeek:     isoWeek,
      indexValue:    "100.0000",
      baseWeek:      isoWeek,
      basketAvg:     String(Math.round(basketAvg * 10000) / 10000),
      productsCount: count,
      weekStart:     new Date(weekStart),
      weekEnd:       new Date(weekEnd),
    })
    .onDuplicateKeyUpdate({ set: { updatedAt: sql`CURRENT_TIMESTAMP(3)` } });

  return isoWeek;
}

async function getBaseAvg(baseWeek: string): Promise<number | null> {
  const [row] = await db
    .select({ basketAvg: hfIndexSnapshots.basketAvg })
    .from(hfIndexSnapshots)
    .where(eq(hfIndexSnapshots.indexWeek, baseWeek))
    .limit(1);
  if (!row) return null;
  const v = parseFloat(String(row.basketAvg));
  return Number.isFinite(v) && v > 0 ? v : null;
}
