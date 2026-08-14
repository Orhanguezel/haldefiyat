/** MySQL DATE values may arrive as Date objects; String(date).slice(0, 10)
 * yields e.g. "Fri Apr 21" and silently disables every BETWEEN condition. */
export function normalizeMysqlDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const value = String(raw ?? "");
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) {
    throw new Error(`Gecersiz blackout tarihi: ${value || "bos"}`);
  }
  return parsed.toISOString().slice(0, 10);
}

export const normalizeBlackoutDate = normalizeMysqlDate;
