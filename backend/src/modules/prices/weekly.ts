import { between, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfMarkets, hfPriceHistory, hfProducts } from "@/db/schema";
import { toIsoWeekOfRange } from "./iso-week";

type Row = {
  productId:    number;
  marketId:     number;
  avgPrice:     string;
  recordedDate: Date | string;
  categorySlug: string;
};

type WeeklyMovement = {
  productSlug: string;
  productName: string;
  marketName:  string;
  changePct:   number;
  latestAvg:   number;
  previousAvg: number;
};

export type WeeklySummary = {
  week:         string;
  weekStart:    string;
  weekEnd:      string;
  topRisers:    WeeklyMovement[];
  topFallers:   WeeklyMovement[];
  avgByCategory: Record<string, number>;
  totalRecords: number;
};

type Scored = {
  productId: number;
  marketId:  number;
  changePct: number;
  latest:    number;
  previous:  number;
};

function toDateStr(d: Date | string): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export async function weeklyPriceSummary(weekStart: string, weekEnd: string): Promise<WeeklySummary> {
  const rows       = await fetchWeekRows(weekStart, weekEnd);
  const movements  = scoreMovements(rows);
  const byCategory = avgByCategoryFromRows(rows);
  const enriched   = await enrichMovements(movements);

  const risers  = enriched.filter((m) => m.changePct > 0).slice(0, 5);
  const fallers = enriched.filter((m) => m.changePct < 0).slice(0, 5);

  return {
    week:          toIsoWeekOfRange(weekStart),
    weekStart,
    weekEnd,
    topRisers:     risers,
    topFallers:    fallers,
    avgByCategory: byCategory,
    totalRecords:  rows.length,
  };
}

async function fetchWeekRows(weekStart: string, weekEnd: string): Promise<Row[]> {
  const rows = await db
    .select({
      productId:    hfPriceHistory.productId,
      marketId:     hfPriceHistory.marketId,
      avgPrice:     hfPriceHistory.avgPrice,
      recordedDate: hfPriceHistory.recordedDate,
      categorySlug: hfProducts.categorySlug,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .where(between(hfPriceHistory.recordedDate, sql`${weekStart}`, sql`${weekEnd}`));
  return rows as Row[];
}

function scoreMovements(rows: Row[]): Scored[] {
  const byKey = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.productId}:${r.marketId}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(r);
  }

  const scored: Scored[] = [];
  for (const [, list] of byKey) {
    list.sort((a, b) => (toDateStr(a.recordedDate) < toDateStr(b.recordedDate) ? -1 : 1));
    if (list.length < 2) continue;
    const first = list[0]!;
    const last  = list[list.length - 1]!;
    const pp = parseFloat(first.avgPrice);
    const lp = parseFloat(last.avgPrice);
    if (!pp || !Number.isFinite(pp) || !Number.isFinite(lp)) continue;
    scored.push({
      productId: last.productId,
      marketId:  last.marketId,
      changePct: Math.round((10000 * (lp - pp)) / pp) / 100,
      latest:    lp,
      previous:  pp,
    });
  }

  scored.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  return scored;
}

function avgByCategoryFromRows(rows: Row[]): Record<string, number> {
  const sum: Record<string, { total: number; count: number }> = {};
  for (const r of rows) {
    const cat = r.categorySlug || "diger";
    const p = parseFloat(r.avgPrice);
    if (!Number.isFinite(p)) continue;
    if (!sum[cat]) sum[cat] = { total: 0, count: 0 };
    sum[cat].total += p;
    sum[cat].count += 1;
  }
  const out: Record<string, number> = {};
  for (const [cat, v] of Object.entries(sum)) {
    out[cat] = v.count ? Math.round((v.total / v.count) * 100) / 100 : 0;
  }
  return out;
}

async function enrichMovements(scored: Scored[]): Promise<WeeklyMovement[]> {
  if (!scored.length) return [];
  const top = scored.slice(0, 20);
  const prodIds = [...new Set(top.map((t) => t.productId))];
  const mktIds  = [...new Set(top.map((t) => t.marketId))];

  const [products, markets] = await Promise.all([
    db.select({ id: hfProducts.id, slug: hfProducts.slug, nameTr: hfProducts.nameTr })
      .from(hfProducts).where(inArray(hfProducts.id, prodIds)),
    db.select({ id: hfMarkets.id, name: hfMarkets.name })
      .from(hfMarkets).where(inArray(hfMarkets.id, mktIds)),
  ]);

  const pMap = new Map(products.map((p) => [p.id, p]));
  const mMap = new Map(markets.map((m) => [m.id, m]));

  return top.map((t) => ({
    productSlug: pMap.get(t.productId)?.slug   ?? "",
    productName: pMap.get(t.productId)?.nameTr ?? "",
    marketName:  mMap.get(t.marketId)?.name    ?? "",
    changePct:   t.changePct,
    latestAvg:   t.latest,
    previousAvg: t.previous,
  }));
}
