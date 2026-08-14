const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const isDateOnly = DATE_ONLY_PATTERN.test(value);
  const normalized = isDateOnly ? `${value}T12:00:00Z` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;
  // JS, 2026-02-31 gibi imkânsız tarihleri Mart ayına taşır. Kaynağın verdiği
  // takvim günü değişiyorsa bunu geçerli tarih sayma.
  if (isDateOnly && date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

export function formatDateTr(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string | null {
  const date = parseIsoDate(value);
  return date ? date.toLocaleDateString("tr-TR", { ...options, timeZone: "UTC" }) : null;
}
