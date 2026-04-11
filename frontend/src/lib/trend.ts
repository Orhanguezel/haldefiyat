/**
 * Linear regression tabanli fiyat tahmini.
 *
 * NEDEN saf fonksiyon: Hem chart bileseninden hem de ileride cron/edge
 * job'larindan cagrilabilmek icin React'e bagli olmasin. Tek degisken
 * (zaman) uzerinde en kucuk kareler — 5+ veri noktasi ile anlamli sonuc.
 */

export interface TrendPoint {
  date: string;
  predicted: number;
}

interface HistoryInput {
  recordedDate: string | Date;
  avgPrice: string | null | undefined;
}

interface Pair {
  x: number;
  y: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toIsoDate(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parsePrice(value: string | null | undefined): number {
  if (value == null) return NaN;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : NaN;
}

function buildPairs(history: HistoryInput[]): { pairs: Pair[]; lastDate: Date | null } {
  const cleaned = history
    .map((row) => ({ iso: toIsoDate(row.recordedDate), y: parsePrice(row.avgPrice) }))
    .filter((r) => Number.isFinite(r.y) && r.iso.length === 10)
    .sort((a, b) => a.iso.localeCompare(b.iso));

  if (cleaned.length === 0) return { pairs: [], lastDate: null };

  const baseDate = new Date(`${cleaned[0]!.iso}T12:00:00Z`);
  const baseMs = baseDate.getTime();
  const pairs: Pair[] = cleaned.map((row) => {
    const t = new Date(`${row.iso}T12:00:00Z`).getTime();
    const x = Math.round((t - baseMs) / MS_PER_DAY);
    return { x, y: row.y };
  });
  const lastDate = new Date(`${cleaned[cleaned.length - 1]!.iso}T12:00:00Z`);
  return { pairs, lastDate };
}

function regression(pairs: Pair[]): { slope: number; intercept: number } {
  const n = pairs.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (const { x, y } of pairs) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function predictNextDays(history: HistoryInput[], days = 7): TrendPoint[] {
  const { pairs, lastDate } = buildPairs(history);
  if (pairs.length < 2 || !lastDate) return [];

  const { slope, intercept } = regression(pairs);
  const lastX = pairs[pairs.length - 1]!.x;
  const out: TrendPoint[] = [];

  for (let i = 1; i <= days; i++) {
    const x = lastX + i;
    const y = Math.max(0, slope * x + intercept);
    const forecastDate = new Date(lastDate.getTime() + i * MS_PER_DAY);
    out.push({
      date: forecastDate.toISOString().slice(0, 10),
      predicted: Math.round(y * 100) / 100,
    });
  }
  return out;
}
