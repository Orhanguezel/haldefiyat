// Basit lineer regresyon tabanlı fiyat tahmini
// n < 2 olduğunda regresyon yapılamaz; bu durumda düz ekstrapolasyon döner.
// Negatif tahminler 0'a clamp'lenir. Güven seviyesi veri sayısına göre hesaplanır.

export type ForecastInput = { day: number; price: number };
export type ForecastPoint = { date: string; predicted: number };
export type ForecastConfidence = "low" | "medium" | "high";

export type ForecastResult = {
  predictions: ForecastPoint[];
  confidence:  ForecastConfidence;
  slope:       number;
  intercept:   number;
  sampleSize:  number;
};

function linearRegression(points: ForecastInput[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) {
    const only = points[0]?.price ?? 0;
    return { slope: 0, intercept: only };
  }
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX  += p.day;
    sumY  += p.price;
    sumXY += p.day * p.price;
    sumXX += p.day * p.day;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function confidenceFromSize(n: number): ForecastConfidence {
  if (n < 5)  return "low";
  if (n < 10) return "medium";
  return "high";
}

function addDaysIso(baseIso: string, offset: number): string {
  const d = new Date(`${baseIso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function buildForecast(
  series: { date: string; avgPrice: number }[],
  lastDateIso: string,
  horizonDays: number,
): ForecastResult {
  const sample = series.slice(-14);
  const points: ForecastInput[] = sample.map((s, idx) => ({ day: idx, price: s.avgPrice }));
  const { slope, intercept } = linearRegression(points);
  const n = points.length;

  const predictions: ForecastPoint[] = [];
  for (let i = 1; i <= horizonDays; i++) {
    const raw = slope * (n - 1 + i) + intercept;
    const predicted = Math.max(0, Math.round(raw * 100) / 100);
    predictions.push({ date: addDaysIso(lastDateIso, i), predicted });
  }

  return {
    predictions,
    confidence: confidenceFromSize(n),
    slope:      Math.round(slope * 10000) / 10000,
    intercept:  Math.round(intercept * 100) / 100,
    sampleSize: n,
  };
}

// Günlük seri: aynı güne ait kayıtları (farklı marketler) ortalama alarak tek noktaya indirger.
export function aggregateByDay(
  rows: { recordedDate: Date | string; avgPrice: string }[],
): { date: string; avgPrice: number }[] {
  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const iso = r.recordedDate instanceof Date
      ? r.recordedDate.toISOString().slice(0, 10)
      : String(r.recordedDate).slice(0, 10);
    const price = parseFloat(r.avgPrice);
    if (!Number.isFinite(price)) continue;
    const b = buckets.get(iso) ?? { sum: 0, count: 0 };
    b.sum += price;
    b.count += 1;
    buckets.set(iso, b);
  }
  return [...buckets.entries()]
    .map(([date, v]) => ({ date, avgPrice: Math.round((v.sum / v.count) * 100) / 100 }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}
