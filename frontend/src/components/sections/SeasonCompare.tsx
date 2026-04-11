"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { PriceHistoryRow } from "@/lib/api";

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
              const isCurrent = idx === uniqueYears.length - 1;
              const isPrev = idx === uniqueYears.length - 2;
              const dotClass = isCurrent
                ? "bg-(--color-brand)"
                : isPrev
                  ? "bg-slate-400"
                  : "bg-slate-600";
              return (
                <span key={year} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
                  {year}
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
