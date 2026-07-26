const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

export function isRecentNewsDate(date: string, now = new Date()): boolean {
  if (!ISO_DATE.test(date)) return false;

  const published = new Date(`${date}T12:00:00Z`);
  if (
    Number.isNaN(published.getTime()) ||
    published.toISOString().slice(0, 10) !== date ||
    date > now.toISOString().slice(0, 10)
  ) {
    return false;
  }

  return now.getTime() - published.getTime() <= NEWS_WINDOW_MS;
}
