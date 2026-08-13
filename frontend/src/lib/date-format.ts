const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const normalized = DATE_ONLY_PATTERN.test(value) ? `${value}T12:00:00Z` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTr(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string | null {
  const date = parseIsoDate(value);
  return date ? date.toLocaleDateString("tr-TR", { ...options, timeZone: "UTC" }) : null;
}
