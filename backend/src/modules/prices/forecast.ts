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

export type ForecastValidation = {
  publishable: boolean;
  reasons: string[];
  validationPoints: number;
  modelMae: number | null;
  modelMape: number | null;
  baselineMae: number | null;
  baselineMape: number | null;
  driftRatio: number | null;
};

const MIN_FORECAST_POINTS = 21;
const MIN_VALIDATION_POINTS = 7;
const MAX_MAPE_PCT = 25;
const MAX_DRIFT_RATIO = 1.5;

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

function roundedMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Walk-forward kabul kapisi. Her validasyon noktasinda yalniz o tarihten onceki
 * en fazla 14 gozlem kullanilir; boylece gelecek veri egitime sizmaz. Lineer
 * model, "son fiyat aynen devam eder" baz cizgisini gecmeden public olmaz.
 */
export function validateForecastSeries(series: { date: string; avgPrice: number }[]): ForecastValidation {
  const clean = series.filter((point) => Number.isFinite(point.avgPrice) && point.avgPrice > 0);
  const reasons: string[] = [];
  if (clean.length < MIN_FORECAST_POINTS) reasons.push("insufficient_history");

  const start = Math.max(14, clean.length - MIN_VALIDATION_POINTS);
  const modelErrors: number[] = [];
  const modelPctErrors: number[] = [];
  const baselineErrors: number[] = [];
  const baselinePctErrors: number[] = [];

  for (let index = start; index < clean.length; index += 1) {
    const train = clean.slice(Math.max(0, index - 14), index);
    const actual = clean[index]!.avgPrice;
    const previous = train.at(-1);
    if (train.length < 10 || !previous) continue;
    const predicted = buildForecast(train, previous.date, 1).predictions[0]?.predicted;
    if (predicted == null || !Number.isFinite(predicted)) continue;
    const modelError = Math.abs(predicted - actual);
    const baselineError = Math.abs(previous.avgPrice - actual);
    modelErrors.push(modelError);
    baselineErrors.push(baselineError);
    modelPctErrors.push((modelError / actual) * 100);
    baselinePctErrors.push((baselineError / actual) * 100);
  }

  const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  const modelMaeRaw = mean(modelErrors);
  const modelMapeRaw = mean(modelPctErrors);
  const baselineMaeRaw = mean(baselineErrors);
  const baselineMapeRaw = mean(baselinePctErrors);
  const recentMae = mean(modelErrors.slice(-3));
  const driftRatioRaw = modelMaeRaw != null && recentMae != null
    ? modelMaeRaw === 0 ? 0 : recentMae / modelMaeRaw
    : null;

  if (modelErrors.length < MIN_VALIDATION_POINTS) reasons.push("insufficient_backtest");
  if (modelMapeRaw == null || modelMapeRaw > MAX_MAPE_PCT) reasons.push("mape_threshold");
  if (modelMaeRaw == null || baselineMaeRaw == null || modelMaeRaw > baselineMaeRaw) reasons.push("baseline_not_beaten");
  if (driftRatioRaw == null || driftRatioRaw > MAX_DRIFT_RATIO) reasons.push("recent_drift");

  return {
    publishable: reasons.length === 0,
    reasons,
    validationPoints: modelErrors.length,
    modelMae: modelMaeRaw == null ? null : roundedMetric(modelMaeRaw),
    modelMape: modelMapeRaw == null ? null : roundedMetric(modelMapeRaw),
    baselineMae: baselineMaeRaw == null ? null : roundedMetric(baselineMaeRaw),
    baselineMape: baselineMapeRaw == null ? null : roundedMetric(baselineMapeRaw),
    driftRatio: driftRatioRaw == null ? null : roundedMetric(driftRatioRaw),
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
