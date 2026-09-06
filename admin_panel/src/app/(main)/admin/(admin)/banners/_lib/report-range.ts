export type ReportPreset = 'current_month' | 'previous_month' | 'last_30_days' | 'custom';

export type ReportRange = { from: string; to: string };

function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function atNoon(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function reportPresetRange(preset: Exclude<ReportPreset, 'custom'>, now = new Date()): ReportRange {
  if (preset === 'current_month') {
    return {
      from: localIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: localIsoDate(now),
    };
  }
  if (preset === 'previous_month') {
    return {
      from: localIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: localIsoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  from.setDate(from.getDate() - 29);
  return { from: localIsoDate(from), to: localIsoDate(now) };
}

export function previousComparableRange(range: ReportRange): ReportRange {
  const from = atNoon(range.from);
  const to = atNoon(range.to);
  const dayCount = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1);
  const previousTo = new Date(from);
  previousTo.setDate(previousTo.getDate() - 1);
  const previousFrom = new Date(previousTo);
  previousFrom.setDate(previousFrom.getDate() - dayCount + 1);
  return { from: localIsoDate(previousFrom), to: localIsoDate(previousTo) };
}

export function isValidReportRange(range: ReportRange): boolean {
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(range.from) || !pattern.test(range.to)) return false;
  const from = atNoon(range.from);
  const to = atNoon(range.to);
  return !Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from <= to;
}

export function reportPeriodLabel(range: ReportRange): string {
  const formatter = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  return `${formatter.format(atNoon(range.from))} – ${formatter.format(atNoon(range.to))}`;
}
