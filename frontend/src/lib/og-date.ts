const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function formatOgDate(value?: string | null): string | null {
  if (!value || !ISO_DATE.test(value.slice(0, 10))) return null;
  const iso = value.slice(0, 10);
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) return null;

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
