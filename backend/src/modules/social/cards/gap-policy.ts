import { isVerifiedRetail, type RetailObservation } from "@/modules/prices/retail-observations";

export interface GapCandidate extends RetailObservation {
  productName: string; canonicalSlug: string | null; imageUrl: string | null;
  halPrice: number; markets: number; searchVolume: number;
}

/** One common date across the entire card. Selection is independent of spread. */
export function chooseGapCandidates(rows: GapCandidate[], limit: number): (GapCandidate & { chains: number })[] {
  const valid = rows.filter(row => isVerifiedRetail(row) && row.unit === "kg"
    && row.markets >= 3 && Number.isFinite(Number(row.halPrice)) && Number(row.halPrice) > 0);
  const dates = [...new Set(valid.map(row => row.recordedDate))].sort().reverse();
  for (const date of dates) {
    const products = new Map<string, GapCandidate[]>();
    for (const row of valid.filter(row => row.recordedDate === date)) {
      const group = products.get(row.productSlug) ?? [];
      group.push(row);
      products.set(row.productSlug, group);
    }
    if (products.size < 3) continue;
    return [...products.values()].map(group => {
      group.sort((a, b) => Number(a.price) - Number(b.price) || a.chainSlug.localeCompare(b.chainSlug));
      return { ...group[0]!, chains: new Set(group.map(row => row.chainSlug)).size };
    }).sort((a, b) => b.searchVolume - a.searchVolume || a.productSlug.localeCompare(b.productSlug))
      .slice(0, Math.max(3, Math.min(limit, 8)));
  }
  return [];
}
