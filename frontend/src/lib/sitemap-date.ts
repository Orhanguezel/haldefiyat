const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

export function validSitemapDate(
  value?: string | Date | null,
  now = new Date(),
): Date | undefined {
  if (!value) return undefined;

  const sourceDate = value instanceof Date ? null : value.match(ISO_DATE_PREFIX)?.[0] ?? null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (
    Number.isNaN(date.getTime()) ||
    (sourceDate !== null && date.toISOString().slice(0, 10) !== sourceDate)
  ) {
    return undefined;
  }

  const endOfTodayUtc = Date.parse(`${now.toISOString().slice(0, 10)}T23:59:59.999Z`);
  return date.getTime() <= endOfTodayUtc ? date : undefined;
}

export function latestSitemapDate(
  values: Array<string | Date | null | undefined>,
  now = new Date(),
): Date | undefined {
  return values.reduce<Date | undefined>((latest, value) => {
    const date = validSitemapDate(value, now);
    return date && (!latest || date > latest) ? date : latest;
  }, undefined);
}
