"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { PriceHistoryRow } from "@/lib/api";

/** Chart ile eşleşen palette — legend dot'ları aynı renkte olsun */
const YEAR_PALETTE: ReadonlyArray<string> = [
  "#3b82f6", "#ef4444", "#a855f7", "#f97316", "#06b6d4",
  "#ec4899", "#eab308", "#14b8a6", "#8b5cf6", "#f43f5e",
];

function colorForYearIndex(index: number, total: number): string {
  if (index === total - 1) return "var(--color-brand, #22c55e)";
  return YEAR_PALETTE[index % YEAR_PALETTE.length]!;
}

interface SeasonCompareProps {
  history: PriceHistoryRow[];
  productName: string;
}

const SeasonCompareChart = dynamic(() => import("./SeasonCompareChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] animate-pulse rounded-[12px] border border-(--color-border) bg-(--color-bg-alt)" />
  ),
});

/**
 * Yillik sezon karsilastirma kartı.
 *
 * NEDEN ayri dosya: Chart'in kendisi recharts'a bagli ve yalniz tarayicida
 * render edilir; wrapper "tek yil" durumunu SSR'da render edip layout shift
 * yaratmadan bilgi verir.
 */
export default function SeasonCompare({ history, productName }: SeasonCompareProps) {
  const uniqueYears = useMemo(() => {
    const set = new Set<number>();
    for (const row of history) {
      const d = new Date(row.recordedDate);
      if (Number.isFinite(d.getTime())) set.add(d.getFullYear());
    }
    return [...set].sort((a, b) => a - b);
  }, [history]);

  const hasMultipleYears = uniqueYears.length >= 2;

  return (
    <section className="mt-8 rounded-[16px] border border-(--color-border) bg-(--color-surface) p-6">
      <header className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Sezon Karşılaştırması
          </div>
          <h3 className="mt-1 font-(family-name:--font-display) text-[18px] font-bold text-(--color-foreground)">
            Yıllık Karşılaştırma
          </h3>
          <p className="mt-1 text-[12px] text-(--color-muted)">
            {productName} — aynı takvim günlerinde geçmiş yıllarla karşılaştırın.
          </p>
        </div>
        {hasMultipleYears && (
          <div className="flex flex-wrap items-center gap-3 font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
            {uniqueYears.map((year, idx) => {
              const color = colorForYearIndex(idx, uniqueYears.length);
              const isCurrent = idx === uniqueYears.length - 1;
              return (
                <span key={year} className="inline-flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className={`rounded-full ${isCurrent ? "h-2.5 w-2.5 ring-2 ring-current/30" : "h-2 w-2"}`}
                    style={{ backgroundColor: color }}
                  />
                  <span className={isCurrent ? "font-semibold text-(--color-foreground)" : ""}>
                    {year}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </header>

      {hasMultipleYears ? (
        <SeasonCompareChart history={history} productName={productName} />
      ) : (
        <div className="flex h-[180px] items-center justify-center rounded-[12px] border border-dashed border-(--color-border-soft) bg-(--color-bg-alt) px-6 text-center text-[13px] text-(--color-muted)">
          Geçen yıl verisi henüz yok. Sezon karşılaştırması için en az iki yıllık fiyat geçmişi gerekir.
        </div>
      )}
    </section>
  );
}
