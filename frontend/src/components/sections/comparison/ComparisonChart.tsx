"use client";

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
import type { Product } from "@/lib/api";
import {
  PRODUCT_COLORS,
  formatLongDate,
  type ChartPoint,
} from "./types";
import { getEmoji } from "@/lib/emoji";

interface ComparisonChartProps {
  data: ChartPoint[];
  selectedProducts: Product[];
}

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload as ChartPoint | undefined;
  const raw = point?.rawDate ?? String(label ?? "");
  return (
    <div className="rounded-[10px] border border-(--color-brand) bg-(--color-header) px-3 py-2 backdrop-blur-md">
      <div className="mb-1.5 font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.1em] text-(--color-brand)">
        {formatLongDate(raw)}
      </div>
      <div className="flex flex-col gap-0.5">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center gap-2 font-(family-name:--font-mono) text-[12px]"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-(--color-muted)">{entry.name}:</span>
            <span className="font-semibold text-(--color-foreground)">
              ₺{Number(entry.value ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ComparisonChart({ data, selectedProducts }: ComparisonChartProps) {
  if (selectedProducts.length === 0) {
    return (
      <div className="flex h-[360px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-8 text-center">
        <div className="text-4xl opacity-40">📊</div>
        <div className="font-(family-name:--font-display) text-[18px] font-semibold text-(--color-foreground)">
          Karşılaştırmak için ürün seçin
        </div>
        <div className="max-w-xs text-[13px] text-(--color-muted)">
          Yukarıdaki menüden en fazla 4 ürün seçerek fiyat trendlerini aynı grafikte görün.
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[360px] items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-surface)/60 text-[13px] text-(--color-muted)">
        Seçili aralık ve filtre için veri yok.
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full rounded-2xl border border-(--color-border) bg-(--color-surface) p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
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
            tickFormatter={(v: number) => `₺${v.toLocaleString("tr-TR")}`}
            width={60}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--brand)", strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
            iconType="circle"
          />
          {selectedProducts.map((p, i) => (
            <Line
              key={p.slug}
              type="monotone"
              dataKey={p.slug}
              name={`${getEmoji(p.slug)} ${p.nameTr}`}
              stroke={PRODUCT_COLORS[i % PRODUCT_COLORS.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
