/**
 * Public YoY figures stay disabled until a full, comparable year exists after the
 * Bursa/Denizli/Eskisehir frozen-series incident ended. Good continuous coverage
 * starts in May 2026; the first conservative public comparison window is May 2027.
 */
export const PUBLIC_YOY_RELIABLE_FROM = "2027-05-01";
export const PUBLIC_YOY_MIN_MATCHED_PAIRS = 5;

export type PublicYoyStatus = "available" | "insufficient_history" | "insufficient_pairs";

export function publicYoyStatus(
  latestDate: string | null | undefined,
  matchedPairs?: number | null,
): PublicYoyStatus {
  const iso = latestDate ? String(latestDate).slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || iso < PUBLIC_YOY_RELIABLE_FROM) {
    return "insufficient_history";
  }
  if (matchedPairs != null && matchedPairs < PUBLIC_YOY_MIN_MATCHED_PAIRS) {
    return "insufficient_pairs";
  }
  return "available";
}

export function canPublishYoy(
  latestDate: string | null | undefined,
  matchedPairs?: number | null,
): boolean {
  return publicYoyStatus(latestDate, matchedPairs) === "available";
}
