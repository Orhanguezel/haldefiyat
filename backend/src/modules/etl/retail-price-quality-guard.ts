export type RetailQualityReason = "INVALID_RETAIL_PRICE" | "WHOLESALE_MARKUP_LIMIT" | "RETAIL_PEER_DEVIATION";

export interface RetailQualityDecision {
  publish: boolean;
  reason: RetailQualityReason | null;
  confidence: number;
  wholesaleMedian: number | null;
  retailMedian: number | null;
  markupPct: number | null;
  deviationRatio: number | null;
}

function median(values: readonly number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (!clean.length) return null;
  const m = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[m]! : (clean[m - 1]! + clean[m]!) / 2;
}

export function assessRetailPriceQuality(input: {
  price: number;
  wholesalePeers?: readonly number[];
  retailPeers?: readonly number[];
}): RetailQualityDecision {
  const wholesale = (input.wholesalePeers?.length ?? 0) >= 5 ? median(input.wholesalePeers ?? []) : null;
  const retail = (input.retailPeers?.length ?? 0) >= 5 ? median(input.retailPeers ?? []) : null;
  const markupPct = wholesale ? ((input.price - wholesale) / wholesale) * 100 : null;
  const deviationRatio = retail ? input.price / retail : null;
  const blocked = (reason: RetailQualityReason, confidence: number): RetailQualityDecision => ({
    publish: false, reason, confidence, wholesaleMedian: wholesale, retailMedian: retail, markupPct, deviationRatio,
  });
  if (!Number.isFinite(input.price) || input.price <= 0) return blocked("INVALID_RETAIL_PRICE", 1);
  // Canlı örneklemde olağan raf fiyatları %200'ü sık aşabildiği için bu bir iş kuralı
  // değildir. Yalnız 11 katı aşan (%1000+) sert türev/anlam eşleme hataları karantinaya gider.
  if (markupPct != null && markupPct > 1_000) return blocked("WHOLESALE_MARKUP_LIMIT", 0.99);
  if (deviationRatio != null && (deviationRatio > 4 || deviationRatio < 0.25)) return blocked("RETAIL_PEER_DEVIATION", 0.9);
  return { publish: true, reason: null, confidence: 1, wholesaleMedian: wholesale, retailMedian: retail, markupPct, deviationRatio };
}
