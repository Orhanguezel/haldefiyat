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
  data: Map<number, number>;
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

function colorForIndex(index: number, totalYears: number): string {
  if (index === totalYears - 1) return "hsl(102 85% 57%)";
  if (index === totalYears - 2) return "rgb(148 163 184)";
  return "rgb(71 85 105)";
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
    <div className="rounded-[10px] border border-(--color-brand) bg-(--color-navy)/95 px-3 py-2 backdrop-blur-md">
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
    const groups = new Map<number, YearGroup>();
    for (const row of history) {
      const d = new Date(row.recordedDate);
      if (!Number.isFinite(d.getTime())) continue;
      const year = d.getFullYear();
      const doy = dayOfYear(row.recordedDate);
      if (doy <= 0) continue;
      if (!groups.has(year)) {
        groups.set(year, { year, color: "", data: new Map<number, number>() });
      }
      groups.get(year)!.data.set(doy, toNumber(row.avgPrice));
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
        if (val != null) row[String(g.year)] = val;
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
          <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="doy"
            type="number"
            domain={[1, 366]}
            ticks={MONTH_STARTS.map((m) => m.doy)}
            tickFormatter={(d: number) => formatDoyTick(d)}
            stroke="rgba(255,255,255,0.4)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `₺${v}`}
            width={50}
          />
          <Tooltip content={<SeasonTooltip />} cursor={{ stroke: "hsl(102 85% 57%)", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Legend wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11 }} />
          {years.map((g) => (
            <Line
              key={g.year}
              type="monotone"
              dataKey={String(g.year)}
              stroke={g.color}
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
