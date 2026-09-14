import type { PriceHistoryRow } from "@/lib/api";
import { REHBER_LIST } from "@/lib/rehber";

/** Exact basket membership; only broad tomato/pepper pages expand to their varieties. */
export function guidesForProduct(slug: string) {
  return REHBER_LIST.filter((guide) => guide.basket.some((item) =>
    item.slug === slug || (["domates", "biber"].includes(slug) && item.slug.startsWith(`${slug}-`)),
  )).sort((a, b) => Number(b.slug === "salca-konserve") - Number(a.slug === "salca-konserve")).slice(0, 2);
}

/** Same day and unit, one variety average per market. Never mix dates into a 'current' median. */
export function latestGuidePrice(rows: PriceHistoryRow[], now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const valid = rows.filter((r) => {
    const value = Number(r.avgPrice);
    const age = now.getTime() - Date.parse(r.recordedDate);
    return Number.isFinite(value) && value > 0 && r.recordedDate.slice(0, 10) <= today && age <= 7 * 86400000;
  });
  const date = valid.map((r) => r.recordedDate.slice(0, 10)).sort().at(-1);
  if (!date) return null;
  const sameDay = valid.filter((r) => r.recordedDate.slice(0, 10) === date);
  const units = new Set(sameDay.map((r) => r.unit));
  if (units.size !== 1) return null;
  const markets = new Map<string, number[]>();
  for (const row of sameDay) markets.set(row.marketSlug, [...(markets.get(row.marketSlug) ?? []), Number(row.avgPrice)]);
  const prices = [...markets.values()].map((values) => values.reduce((sum, value) => sum + value, 0) / values.length).sort((a, b) => a - b);
  const middle = Math.floor(prices.length / 2);
  const price = prices.length % 2 ? prices[middle] : (prices[middle - 1] + prices[middle]) / 2;
  return { date, price, unit: sameDay[0].unit, marketCount: prices.length };
}
