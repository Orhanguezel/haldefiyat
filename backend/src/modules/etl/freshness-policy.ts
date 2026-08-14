export const MIN_STALE_DAYS = 4;
export const BASELINE_MARGIN = 2;

export function isStaleAgainstOwnBaseline(currentDays: number, baselineDays: number): boolean {
  const threshold = Math.max(MIN_STALE_DAYS, baselineDays + BASELINE_MARGIN);
  return currentDays >= threshold;
}
