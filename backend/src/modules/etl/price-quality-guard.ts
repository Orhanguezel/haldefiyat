export type PriceQualityReason =
  | "NON_POSITIVE_PRICE"
  | "MIN_GREATER_THAN_MAX"
  | "AVG_OUTSIDE_RANGE"
  | "ABSOLUTE_LIMIT"
  | "PEER_MEDIAN_DEVIATION"
  | "PREVIOUS_PRICE_JUMP"
  | "SOURCE_MEDIAN_DEVIATION"
  | "STALE_SOURCE_RECORD"
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
  previousPrice?: number | null;
  sourcePeerPrices?: readonly number[];
  sourceRecordAgeDays?: number | null;
  /**
   * Bu (hal x urun) serisinin akranlarina gore ALISILMIS konumu: gecmis pencerede
   * "kendi ortalamasi / diger hallerin ortalamasi". Bilinmiyorsa null.
   */
  habitualPeerRatio?: number | null;
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

/**
 * Bir halin akranlarindan KALICI olarak ucuz ya da pahali olmasi sinyal DEGILDIR:
 * uretim bolgesi hali dogal olarak ucuzdur. Demre salkim domatesi 33 gunluk
 * gecmiste akran ortalamasinin %15,6'si; karantinaya dusen degerlerin orani da
 * %13-15 — yani hicbir sey degismemisti ama sapma kurali her gun tetikleniyordu
 * (2026-09-02: bekleyen 285 SOURCE_MEDIAN_DEVIATION kaydinin buyuk kismi buydu).
 *
 * Anlamli sinyal oranin KAYMASIDIR — freshness.ts/detectPriceJumps ayni ilkeyi
 * kullanir. Alisilmis konumun iki kati / yarisi icinde kalan degerler yayinlanir.
 */
function matchesHabitualPosition(currentRatio: number, habitual: number | null | undefined): boolean {
  if (habitual == null || !Number.isFinite(habitual) || habitual <= 0) return false;
  const shift = currentRatio / habitual;
  return shift >= 0.5 && shift <= 2;
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
  const sourcePeers = input.sourcePeerPrices ?? [];
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
  if (input.sourceRecordAgeDays != null && input.sourceRecordAgeDays > 400) {
    return decision("STALE_SOURCE_RECORD", "warning", Math.min(0.99, 0.8 + input.sourceRecordAgeDays / 10_000));
  }
  if (input.previousPrice != null && input.previousPrice > 0) {
    const previousRatio = input.avg / input.previousPrice;
    if (previousRatio > 5 || previousRatio < 0.2) return decision("PREVIOUS_PRICE_JUMP", "warning", 0.95);
  }
  const sourceMedian = sourcePeers.length >= 3 ? median(sourcePeers) : null;
  if (sourceMedian) {
    const sourceRatio = input.avg / sourceMedian;
    if ((sourceRatio > 4 || sourceRatio < 0.25) && !matchesHabitualPosition(sourceRatio, input.habitualPeerRatio)) {
      return decision("SOURCE_MEDIAN_DEVIATION", "warning", Math.min(0.99, 0.8 + sourcePeers.length / 100));
    }
  }

  // En az 5 tarih-yakın emsal olmadan medyan kararı verilmez. Dört kat üstü veya
  // dörtte bir altı sapma karantinaya gider; mevsimsel hareketlere geniş marj bırakır.
  if (deviationRatio != null && (deviationRatio > 4 || deviationRatio < 0.25)
      && !matchesHabitualPosition(deviationRatio, input.habitualPeerRatio)) {
    return decision("PEER_MEDIAN_DEVIATION", "warning", Math.min(0.99, 0.75 + peers.length / 100));
  }

  return { publish: true, reason: null, severity: "none", confidence: 1, peerMedian, deviationRatio, absoluteLimit: limit };
}
