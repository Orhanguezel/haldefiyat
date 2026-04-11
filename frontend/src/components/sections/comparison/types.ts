import type { PriceHistoryRow, Product } from "@/lib/api";

export const PRODUCT_COLORS: ReadonlyArray<string> = [
  "hsl(102 85% 57%)",
  "hsl(210 80% 60%)",
  "hsl(40 85% 60%)",
  "hsl(0 75% 60%)",
] as const;

export const MAX_PRODUCTS = 4;

export type RangeKey = "7d" | "30d" | "90d";

export interface RangeOption {
  key: RangeKey;
  label: string;
  days: number;
}

export const RANGES: ReadonlyArray<RangeOption> = [
  { key: "7d", label: "7G", days: 7 },
  { key: "30d", label: "30G", days: 30 },
  { key: "90d", label: "90G", days: 90 },
] as const;

export interface ChartPoint {
  date: string;
  rawDate: string;
  [slug: string]: string | number;
}

export interface SummaryRow {
  product: Product;
  latest: number;
  min: number;
  max: number;
  avg: number;
  changePct: number;
  color: string;
}

export function toNumber(v: string | null | undefined): number {
  if (v == null) return 0;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatLongDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function buildChartPoints(
  selectedProducts: Product[],
  historiesMap: Map<string, PriceHistoryRow[]>,
  selectedMarket: string | null,
  rangeDays: number,
): ChartPoint[] {
  const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
  const byDate = new Map<string, ChartPoint>();

  for (const product of selectedProducts) {
    const rows = historiesMap.get(product.slug) ?? [];
    const filtered = rows.filter((r) => {
      const t = new Date(r.recordedDate).getTime();
      if (!Number.isFinite(t) || t < cutoff) return false;
      if (selectedMarket && r.marketSlug !== selectedMarket) return false;
      return true;
    });

    // Average per day (if multiple markets)
    const perDay = new Map<string, { sum: number; count: number }>();
    for (const r of filtered) {
      const cur = perDay.get(r.recordedDate) ?? { sum: 0, count: 0 };
      cur.sum += toNumber(r.avgPrice);
      cur.count += 1;
      perDay.set(r.recordedDate, cur);
    }

    for (const [date, agg] of perDay) {
      const point = byDate.get(date) ?? { rawDate: date, date: formatShortDate(date) };
      point[product.slug] = agg.count > 0 ? agg.sum / agg.count : 0;
      byDate.set(date, point);
    }
  }

  return Array.from(byDate.values()).sort((a, b) =>
    a.rawDate.localeCompare(b.rawDate),
  );
}

export function buildSummary(
  selectedProducts: Product[],
  historiesMap: Map<string, PriceHistoryRow[]>,
  selectedMarket: string | null,
  rangeDays: number,
): SummaryRow[] {
  const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
  return selectedProducts.map((product, idx) => {
    const rows = (historiesMap.get(product.slug) ?? []).filter((r) => {
      const t = new Date(r.recordedDate).getTime();
      if (!Number.isFinite(t) || t < cutoff) return false;
      if (selectedMarket && r.marketSlug !== selectedMarket) return false;
      return true;
    });
    const sorted = [...rows].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
    const values = sorted.map((r) => toNumber(r.avgPrice));
    const latest = values.length > 0 ? values[values.length - 1]! : 0;
    const first = values.length > 0 ? values[0]! : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const avg =
      values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const changePct = first > 0 ? ((latest - first) / first) * 100 : 0;
    return {
      product,
      latest,
      min,
      max,
      avg,
      changePct,
      color: PRODUCT_COLORS[idx % PRODUCT_COLORS.length] ?? PRODUCT_COLORS[0]!,
    };
  });
}

export function unwrapHistoryArray(json: unknown): PriceHistoryRow[] {
  if (Array.isArray(json)) return json as PriceHistoryRow[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as PriceHistoryRow[];
    if (Array.isArray(obj.data)) return obj.data as PriceHistoryRow[];
  }
  return [];
}
