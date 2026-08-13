export type PriceQualityReason =
  | "NON_POSITIVE_PRICE"
  | "MIN_GREATER_THAN_MAX"
  | "AVG_OUTSIDE_RANGE"
  | "ABSOLUTE_LIMIT"
  | "PEER_MEDIAN_DEVIATION"
  | "PRODUCT_UNIT_MISMATCH"
  | "UNKNOWN_PRODUCT_UNIT";

export interface PriceQualityInput {
  avg: number;
  min?: number | null;
  max?: number | null;
  unit: string;
  expectedUnit?: string | null;
  categorySlug?: string | null;
  peerPrices?: readonly number[];
}

export interface PriceQualityDecision {
  publish: boolean;
  reason: PriceQualityReason | null;
  severity: "none" | "warning" | "critical";
  confidence: number;
  peerMedian: number | null;
  deviationRatio: number | null;
  absoluteLimit: number;
}

function median(values: readonly number[]): number | null {
  const clean = values.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  if (clean.length === 0) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 === 0 ? (clean[middle - 1]! + clean[middle]!) / 2 : clean[middle]!;
}

function absoluteLimit(input: Pick<PriceQualityInput, "unit" | "categorySlug">): number {
  const unit = input.unit.toLocaleLowerCase("tr-TR");
  if (["kasa", "koli"].includes(unit)) return 15_000;
  if ((input.categorySlug ?? "").includes("balik")) return 12_000;
  return 1_500;
}

export function assessPriceQuality(input: PriceQualityInput): PriceQualityDecision {
  const limit = absoluteLimit(input);
  const peers = input.peerPrices ?? [];
  const peerMedian = peers.length >= 5 ? median(peers) : null;
  const deviationRatio = peerMedian && peerMedian > 0 ? input.avg / peerMedian : null;
  const decision = (reason: PriceQualityReason, severity: "warning" | "critical", confidence: number): PriceQualityDecision => ({
    publish: false,
    reason,
    severity,
    confidence,
    peerMedian,
    deviationRatio,
    absoluteLimit: limit,
  });

  const values = [input.avg, input.min, input.max].filter((value): value is number => value != null);
  if (!input.expectedUnit) return decision("UNKNOWN_PRODUCT_UNIT", "critical", 1);
  if (input.unit !== input.expectedUnit) return decision("PRODUCT_UNIT_MISMATCH", "critical", 1);
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) return decision("NON_POSITIVE_PRICE", "critical", 1);
  if (input.min != null && input.max != null && input.min > input.max) return decision("MIN_GREATER_THAN_MAX", "critical", 1);
  if ((input.min != null && input.avg < input.min) || (input.max != null && input.avg > input.max)) return decision("AVG_OUTSIDE_RANGE", "critical", 1);
  if (values.some((value) => value > limit)) return decision("ABSOLUTE_LIMIT", "critical", 0.99);

  // En az 5 tarih-yakın emsal olmadan medyan kararı verilmez. Dört kat üstü veya
  // dörtte bir altı sapma karantinaya gider; mevsimsel hareketlere geniş marj bırakır.
  if (deviationRatio != null && (deviationRatio > 4 || deviationRatio < 0.25)) {
    return decision("PEER_MEDIAN_DEVIATION", "warning", Math.min(0.99, 0.75 + peers.length / 100));
  }

  return { publish: true, reason: null, severity: "none", confidence: 1, peerMedian, deviationRatio, absoluteLimit: limit };
}
