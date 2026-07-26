const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function schemaDateRange(
  values: Array<string | null | undefined>,
): { earliest: string; latest: string; temporalCoverage: string } | null {
  const dates = values
    .filter((value): value is string => typeof value === "string" && isValidIsoDate(value))
    .sort();

  const earliest = dates[0];
  const latest = dates.at(-1);
  if (!earliest || !latest) return null;

  return {
    earliest,
    latest,
    temporalCoverage: earliest === latest ? earliest : `${earliest}/${latest}`,
  };
}
