"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  type TooltipProps,
} from "recharts";
import type { PriceHistoryRow } from "@/lib/api";
import { predictNextDays } from "@/lib/trend";

interface PriceChartProps {
  history: PriceHistoryRow[];
  productName: string;
}

type RangeKey = "7d" | "30d" | "90d";

interface RangeOption { key: RangeKey; label: string; days: number; }

const RANGES: ReadonlyArray<RangeOption> = [
  { key: "7d", label: "7G", days: 7 }, { key: "30d", label: "30G", days: 30 }, { key: "90d", label: "90G", days: 90 },
] as const;

interface ChartPoint { date: string; rawDate: string; avg?: number; min?: number; max?: number; predicted?: number; isForecast?: boolean; }

function toNumber(value: string | null | undefined): number {
  if (value == null) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function formatLongDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;

  const hasAvg = typeof point.avg === "number";
  const hasForecast = typeof point.predicted === "number";

  return (
    <div className="rounded-[10px] border border-(--color-brand) bg-(--color-navy)/95 px-3 py-2 backdrop-blur-md">
      <div className="mb-1 font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.1em] text-(--color-brand)">
        {formatLongDate(point.rawDate)} {point.isForecast ? "· Tahmin" : ""}
      </div>
      {hasAvg ? (
        <div className="font-(family-name:--font-mono) text-[14px] font-bold text-(--color-foreground)">
          ₺{(point.avg ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
        </div>
      ) : null}
      {hasForecast ? (
        <div className="font-(family-name:--font-mono) text-[13px] font-semibold text-(--color-brand)/80">
          tahmin ₺{(point.predicted ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
        </div>
      ) : null}
      {hasAvg && typeof point.min === "number" && typeof point.max === "number" ? (
        <div className="mt-1 flex gap-3 font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
          <span>min ₺{point.min.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
          <span>max ₺{point.max.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function PriceChart({ history, productName }: PriceChartProps) {
  const [range, setRange] = useState<RangeKey>("30d");

  const { data, hasForecast } = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)?.days ?? 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    const sorted = [...history].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
    const filtered = sorted.filter((row) => {
      const t = new Date(row.recordedDate).getTime();
      return Number.isFinite(t) && t >= cutoff;
    });

    const real: ChartPoint[] = filtered.map((row) => ({
      rawDate: row.recordedDate,
      date: formatShortDate(row.recordedDate),
      avg: toNumber(row.avgPrice),
      min: toNumber(row.minPrice),
      max: toNumber(row.maxPrice),
    }));

    if (real.length < 5) {
      return { data: real, hasForecast: false };
    }

    const forecasts = predictNextDays(filtered, 7);
    const forecastPoints: ChartPoint[] = forecasts.map((p) => ({
      rawDate: p.date,
      date: formatShortDate(p.date),
      predicted: p.predicted,
      isForecast: true,
    }));

    // Seamless join: son gercek noktaya predicted degerini de ekle
    if (real.length > 0 && forecastPoints.length > 0) {
      real[real.length - 1] = { ...real[real.length - 1]!, predicted: real[real.length - 1]!.avg };
    }

    return { data: [...real, ...forecastPoints], hasForecast: forecastPoints.length > 0 };
  }, [history, range]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Fiyat Trendi
            {hasForecast ? (
              <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-(--color-brand)/40 bg-(--color-brand)/5 px-2 py-0.5 text-[10px] font-semibold text-(--color-brand)/80">
                <span className="h-[2px] w-3 border-t border-dashed border-(--color-brand)/70" aria-hidden />
                Tahmin 7G
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 font-(family-name:--font-display) text-[18px] font-bold text-(--color-foreground)">
            {productName}
          </h3>
        </div>
        <div className="flex items-center gap-1 rounded-[10px] bg-(--color-bg-alt) p-1">
          {RANGES.map((r) => {
            const active = range === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={
                  "rounded-[7px] px-3 py-1.5 font-(family-name:--font-mono) text-[12px] font-semibold transition-colors " +
                  (active ? "bg-(--color-brand) text-(--color-navy)" : "text-(--color-muted) hover:text-(--color-foreground)")
                }
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[280px] items-center justify-center text-[13px] text-(--color-muted)">
          Bu aralık için geçmiş veri yok.
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="halBrandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(102 85% 57%)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(102 85% 57%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `₺${value}`} width={50} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(102 85% 57%)", strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Area type="monotone" dataKey="avg" stroke="hsl(102 85% 57%)" strokeWidth={2.5} fill="url(#halBrandFill)" connectNulls />
              {hasForecast ? (
                <Line type="monotone" dataKey="predicted" stroke="hsl(102 85% 57% / 0.45)" strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />
              ) : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
