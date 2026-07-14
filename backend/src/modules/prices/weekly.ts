import { between, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfPriceHistory, hfProducts } from "@/db/schema";
import { toIsoWeekOfRange } from "./iso-week";

// Haftalık hareket metodolojisi (yayınlanan raporlarla birebir aynı):
// - Ürün AİLESİ (kanonik master) düzeyinde — aynı ürünün farklı hal yazımları tek başlıkta.
// - Hafta başı (ilk 2 gün) vs hafta sonu (son 2 gün) HAL ORTALAMASI kıyaslanır.
// - En az MIN_MARKETS ayrı halde gözlem şartı → tek halin glitch'i "haftanın hareketi" olmaz.
// - Fiyatı kg cinsinden olmayan ve fiyat düzeyi kıyaslanamayan kategoriler (balık/et/hububat)
//   hareket listesinden çıkarılır; kategori ortalaması tablosunda yine görünürler.
const MIN_MARKETS = 6;
const MOVER_EXCLUDED_CATEGORIES = new Set([
  "balik-deniz", "balik-ithal", "balik-kultur", "et", "canli-hayvan", "hububat", "bakliyat",
]);

type Row = {
  productId:    number;
  marketId:     number;
  avgPrice:     string;
  unit:         string;
  recordedDate: Date | string;
  categorySlug: string;
  masterSlug:   string;
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
  masterSlug:  string;
  marketCount: number;
  changePct:   number;
  latest:      number;
  previous:    number;
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
      unit:         hfPriceHistory.unit,
      recordedDate: hfPriceHistory.recordedDate,
      categorySlug: hfProducts.categorySlug,
      masterSlug:   sql<string>`COALESCE(${hfProducts.canonicalSlug}, ${hfProducts.slug})`,
    })
    .from(hfPriceHistory)
    .innerJoin(hfProducts, eq(hfProducts.id, hfPriceHistory.productId))
    .where(between(hfPriceHistory.recordedDate, sql`${weekStart}`, sql`${weekEnd}`));
  return rows as Row[];
}

function scoreMovements(rows: Row[]): Scored[] {
  const usable = rows.filter(
    (r) => r.unit === "kg" && !MOVER_EXCLUDED_CATEGORIES.has(r.categorySlug || ""),
  );
  const dates = [...new Set(usable.map((r) => toDateStr(r.recordedDate)))].sort();
  if (dates.length < 2) return [];
  // 4+ günlük haftada ilk/son 2 gün; kısa haftada tek gün — pencerelerin çakışmaması şart.
  const span = dates.length >= 4 ? 2 : 1;
  const startDates = new Set(dates.slice(0, span));
  const endDates   = new Set(dates.slice(-span));

  // (master, hal) → pencere içi ortalama. Ulusal fiyat bunların MEDYANI olur: bazı kaynaklar
  // (hal.gov.tr agregatörü) ara sıra çöp basıyor (turp 507 TL/kg gibi); düz ortalama zehirlenir,
  // medyan tek bozuk kaynaktan etkilenmez.
  const agg = new Map<string, { start: Map<number, number[]>; end: Map<number, number[]> }>();
  const push = (m: Map<number, number[]>, marketId: number, p: number) => {
    const arr = m.get(marketId);
    if (arr) arr.push(p);
    else m.set(marketId, [p]);
  };

  for (const r of usable) {
    const p = parseFloat(r.avgPrice);
    if (!Number.isFinite(p) || p <= 0) continue;
    const d = toDateStr(r.recordedDate);
    const isStart = startDates.has(d);
    const isEnd   = endDates.has(d);
    if (!isStart && !isEnd) continue;
    let a = agg.get(r.masterSlug);
    if (!a) {
      a = { start: new Map(), end: new Map() };
      agg.set(r.masterSlug, a);
    }
    push(isStart ? a.start : a.end, r.marketId, p);
  }

  const medianOfHalls = (m: Map<number, number[]>): number => {
    const perHall = [...m.values()].map((xs) => xs.reduce((s, x) => s + x, 0) / xs.length).sort((x, y) => x - y);
    const mid = Math.floor(perHall.length / 2);
    return perHall.length % 2 ? perHall[mid]! : (perHall[mid - 1]! + perHall[mid]!) / 2;
  };

  const scored: Scored[] = [];
  for (const [masterSlug, a] of agg) {
    if (a.start.size < MIN_MARKETS || a.end.size < MIN_MARKETS) continue;
    const pp = medianOfHalls(a.start);
    const lp = medianOfHalls(a.end);
    if (!pp || !Number.isFinite(pp) || !Number.isFinite(lp)) continue;
    const pct = Math.round((10000 * (lp - pp)) / pp) / 100;
    // Hal ortalaması + çok-hal şartı anomalilerin çoğunu zaten eler; bu son emniyet kemeri.
    if (Math.abs(pct) > 80) continue;
    scored.push({
      masterSlug,
      marketCount: Math.min(a.start.size, a.end.size),
      changePct:   pct,
      latest:      lp,
      previous:    pp,
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
  const slugs = [...new Set(top.map((t) => t.masterSlug))];

  const products = await db
    .select({
      slug: hfProducts.slug,
      name: sql<string>`COALESCE(NULLIF(${hfProducts.displayName}, ''), ${hfProducts.nameTr})`,
    })
    .from(hfProducts)
    .where(inArray(hfProducts.slug, slugs));

  const pMap = new Map(products.map((p) => [p.slug, p.name]));

  return top.map((t) => ({
    productSlug: t.masterSlug,
    productName: pMap.get(t.masterSlug) ?? t.masterSlug,
    // Hareket artık tek hal değil, ulusal ortalama — kaç halde gözlendiği güveni gösterir.
    marketName:  `${t.marketCount} hal ortalaması`,
    changePct:   t.changePct,
    latestAvg:   t.latest,
    previousAvg: t.previous,
  }));
}
