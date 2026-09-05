'use client';

type Point = { recordedDate: string; avgPrice: string };

/** Kucuk fiyat egrisi — kutuphane yok, dogrudan SVG. Girdi tarihe gore artan siralanir. */
type T = (key: string, params?: Record<string, string | number>) => string;

export function PriceSparkline({ points, height = 56, t }: { points: Point[]; height?: number; t: T }) {
  const series = [...points]
    .sort((a, b) => a.recordedDate.localeCompare(b.recordedDate))
    .map((point) => Number(point.avgPrice))
    .filter((value) => Number.isFinite(value));

  if (series.length < 2) {
    return <div className="text-xs text-muted-foreground">{t('curveEmpty')}</div>;
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const width = 100;
  const step = width / (series.length - 1);
  const coords = series.map((value, index) => {
    const x = index * step;
    const y = height - ((value - min) / span) * (height - 8) - 4;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const rising = series[series.length - 1] >= series[0];
  const stroke = rising ? 'var(--color-emerald-600, #059669)' : 'var(--color-rose-600, #e11d48)';

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-14 w-full">
        <polyline points={coords.join(' ')} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('curveMin', { value: min.toFixed(2) })}</span>
        <span>{t('curveCount', { count: series.length })}</span>
        <span>{t('curveMax', { value: max.toFixed(2) })}</span>
      </div>
    </div>
  );
}
