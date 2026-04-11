/**
 * ISO 8601 hafta yardimci fonksiyonlari.
 * Hafta Pazartesi baslar, Pazar biter.
 */

export function resolveWeekRange(week?: string): { weekStart: string; weekEnd: string; isoWeek: string } {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let monday: Date;
  if (week && /^\d{4}-\d{1,2}$/.test(week.trim())) {
    const [yStr, wStr] = week.split("-");
    monday = isoWeekStart(parseInt(yStr, 10), parseInt(wStr, 10));
  } else {
    const todayDow = today.getUTCDay();
    const daysSinceMonday = (todayDow + 6) % 7;
    monday = new Date(today);
    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday - 7);
  }

  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  return {
    weekStart: monday.toISOString().slice(0, 10),
    weekEnd:   sunday.toISOString().slice(0, 10),
    isoWeek:   formatIsoWeek(monday),
  };
}

export function toIsoWeekOfRange(weekStart: string): string {
  return formatIsoWeek(new Date(`${weekStart}T00:00:00Z`));
}

function isoWeekStart(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = (jan4.getUTCDay() + 6) % 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(mondayWeek1.getUTCDate() - jan4Dow);
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

function formatIsoWeek(monday: Date): string {
  const d = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(
    ((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
  );
  return `${d.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}
