"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  type TooltipProps,
} from "recharts";
import type { PriceHistoryRow } from "@/lib/api";

interface SeasonCompareChartProps {
  history: PriceHistoryRow[];
  productName: string;
}

interface YearGroup {
  year: number;
  color: string;
  /** Gün → (o gün için tüm market ortalamalarının tek ortalaması) */
  data: Map<number, number>;
}

/** 7 günlük hareketli ortalama ile gürültüyü azalt. Giriş: doy → value */
function smoothDaily(raw: Map<number, number>, window = 7): Map<number, number> {
  if (raw.size === 0) return raw;
  const entries = [...raw.entries()].sort(([a], [b]) => a - b);
  const half = Math.floor(window / 2);
  const out = new Map<number, number>();
  for (let i = 0; i < entries.length; i++) {
    const center = entries[i]![0];
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(entries.length - 1, i + half); j++) {
      sum += entries[j]![1];
      count++;
    }
    out.set(center, sum / count);
  }
  return out;
}

interface ChartRow {
  doy: number;
  label: string;
  [year: string]: number | string;
}

const MONTH_STARTS: ReadonlyArray<{ doy: number; label: string }> = [
  { doy: 1, label: "Oca" },
  { doy: 32, label: "Şub" },
  { doy: 60, label: "Mar" },
  { doy: 91, label: "Nis" },
  { doy: 121, label: "May" },
  { doy: 152, label: "Haz" },
  { doy: 182, label: "Tem" },
  { doy: 213, label: "Ağu" },
  { doy: 244, label: "Eyl" },
  { doy: 274, label: "Eki" },
  { doy: 305, label: "Kas" },
  { doy: 335, label: "Ara" },
] as const;

function dayOfYear(iso: string): number {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return 0;
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function toNumber(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Her yıl için ayırt edilebilir renk. Tonlar 500-600 serisi, hem dark
 * hem light arka planda yeterli kontrast verir (WCAG AA tasarımı).
 * En yeni yıl brand rengiyle ayrıca vurgulanır.
 */
const YEAR_PALETTE: ReadonlyArray<string> = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#a855f7", // purple-500
  "#f97316", // orange-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#eab308", // yellow-500
  "#14b8a6", // teal-500
  "#8b5cf6", // violet-500
  "#f43f5e", // rose-500
] as const;

function colorForIndex(index: number, totalYears: number): string {
  // En yeni yıl: brand (marka rengi — dikkat çeker)
  if (index === totalYears - 1) return "var(--color-brand, #22c55e)";
  // Geçmiş yıllar: sabit palette, en eskiden başlar — aynı yıl her zaman
  // aynı renkle gelsin (kullanıcı alışkanlığı için)
  return YEAR_PALETTE[index % YEAR_PALETTE.length]!;
}

/** En yeni yıl çizgisi daha kalın — gözün ilk odaklandığı hat */
function strokeWidthForIndex(index: number, totalYears: number): number {
  return index === totalYears - 1 ? 3 : 1.8;
}

function formatDoyTick(doy: number): string {
  const slot = [...MONTH_STARTS].reverse().find((m) => doy >= m.doy);
  return slot?.label ?? "";
}

function SeasonTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const doy = typeof label === "number" ? label : Number(label);
  const date = new Date(2024, 0, doy);
  const pretty = date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long" });
  return (
    <div className="rounded-[10px] border border-(--color-brand) bg-(--color-header) px-3 py-2 backdrop-blur-md">
      <div className="mb-1 font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.1em] text-(--color-brand)">
        {pretty}
      </div>
      {payload.map((entry) => (
        <div
          key={String(entry.dataKey)}
          className="font-(family-name:--font-mono) text-[12px] font-semibold"
          style={{ color: entry.color }}
        >
          {String(entry.dataKey)}: ₺
          {Number(entry.value ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
        </div>
      ))}
    </div>
  );
}

export default function SeasonCompareChart({ history, productName }: SeasonCompareChartProps) {
  const { chartData, years } = useMemo(() => {
    // 1) Yıl + gün başına — tüm marketlerin değerlerini topla (son değerle
    //    overwrite etmek yerine ortalama al). Farklı haller farklı günde
    //    veri açıkladığı için gün bazlı ortalama "diş tarağı" gürültüsünü yok eder.
    const buckets = new Map<number, Map<number, number[]>>();
    for (const row of history) {
      const d = new Date(row.recordedDate);
      if (!Number.isFinite(d.getTime())) continue;
      const year = d.getFullYear();
      const doy = dayOfYear(row.recordedDate);
      if (doy <= 0) continue;
      const val = toNumber(row.avgPrice);
      if (val <= 0) continue;
      if (!buckets.has(year)) buckets.set(year, new Map<number, number[]>());
      const yearMap = buckets.get(year)!;
      if (!yearMap.has(doy)) yearMap.set(doy, []);
      yearMap.get(doy)!.push(val);
    }

    // 2) Her (yıl, gün) için ortalama + 7 günlük hareketli ortalama smoothing
    const groups = new Map<number, YearGroup>();
    for (const [year, yearMap] of buckets) {
      const dailyMean = new Map<number, number>();
      for (const [doy, values] of yearMap) {
        dailyMean.set(doy, values.reduce((s, v) => s + v, 0) / values.length);
      }
      groups.set(year, { year, color: "", data: smoothDaily(dailyMean, 7) });
    }

    const sortedYears = [...groups.values()].sort((a, b) => a.year - b.year);
    sortedYears.forEach((g, idx) => {
      g.color = colorForIndex(idx, sortedYears.length);
    });

    const rows: ChartRow[] = [];
    for (let doy = 1; doy <= 366; doy += 1) {
      const row: ChartRow = { doy, label: formatDoyTick(doy) };
      for (const g of sortedYears) {
        const val = g.data.get(doy);
        if (val != null) row[String(g.year)] = Math.round(val * 100) / 100;
      }
      rows.push(row);
    }
    return { chartData: rows, years: sortedYears };
  }, [history]);

  if (years.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-[13px] text-(--color-muted)">
        Sezon karşılaştırması için veri yok.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full" aria-label={`${productName} yıllık sezon karşılaştırması`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="doy"
            type="number"
            domain={[1, 366]}
            ticks={MONTH_STARTS.map((m) => m.doy)}
            tickFormatter={(d: number) => formatDoyTick(d)}
            stroke="var(--muted)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="var(--muted)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `₺${v}`}
            width={50}
          />
          <Tooltip content={<SeasonTooltip />} cursor={{ stroke: "var(--brand)", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
          {years.map((g, idx) => (
            <Line
              key={g.year}
              type="monotone"
              dataKey={String(g.year)}
              stroke={g.color}
              strokeWidth={strokeWidthForIndex(idx, years.length)}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
