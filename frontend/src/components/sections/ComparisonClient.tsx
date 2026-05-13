"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Market, PriceHistoryRow, Product } from "@/lib/api";
import ComparisonControls from "./comparison/ComparisonControls";
import ComparisonChips from "./comparison/ComparisonChips";
import ComparisonSummary from "./comparison/ComparisonSummary";
import {
  MAX_PRODUCTS,
  RANGES,
  buildChartPoints,
  buildSummary,
  unwrapHistoryArray,
  type RangeKey,
} from "./comparison/types";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8088").replace(/\/$/, "") + "/api/v1";

const ComparisonChart = dynamic(() => import("./comparison/ComparisonChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] animate-pulse rounded-2xl border border-(--color-border) bg-(--color-surface)" />
  ),
});

interface ComparisonClientProps {
  products: Product[];
  markets: Market[];
}

export default function ComparisonClient({ products, markets }: ComparisonClientProps) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");
  const [historiesMap, setHistoriesMap] = useState<Map<string, PriceHistoryRow[]>>(new Map());

  const productsBySlug = useMemo(
    () => new Map(products.map((p) => [p.slug, p])),
    [products],
  );

  const selectedProducts = useMemo(
    () =>
      selectedSlugs
        .map((slug) => productsBySlug.get(slug))
        .filter((p): p is Product => Boolean(p)),
    [selectedSlugs, productsBySlug],
  );

  // Fetch 90d history for newly selected products.
  // `historiesMap`'i dependency'e koymayız: kendi içinde güncellediğimiz için
  // effect re-trigger → cleanup → ctrl.abort() yarış durumu yaratıyor (StrictMode
  // çift-mount). selectedSlugs tek source-of-truth; eksik slug'ları stale closure
  // ile değil setHistoriesMap callback'inde anlık olarak filtreliyoruz.
  useEffect(() => {
    if (selectedSlugs.length === 0) return;

    let cancelled = false;
    (async () => {
      const slugsToFetch = selectedSlugs.filter((s) => !historiesMap.has(s));
      if (slugsToFetch.length === 0) return;

      const results = await Promise.all(
        slugsToFetch.map(async (slug) => {
          try {
            const res = await fetch(
              `${API_BASE}/prices/history/${encodeURIComponent(slug)}?range=90d`,
            );
            const json: unknown = await res.json();
            return [slug, unwrapHistoryArray(json)] as const;
          } catch {
            return [slug, [] as PriceHistoryRow[]] as const;
          }
        }),
      );

      if (cancelled) return;
      setHistoriesMap((prev) => {
        const next = new Map(prev);
        for (const [slug, rows] of results) {
          if (!next.has(slug)) next.set(slug, rows);
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlugs]);

  const loadingSlugs = useMemo(
    () => selectedSlugs.filter((s) => !historiesMap.has(s)),
    [selectedSlugs, historiesMap],
  );

  const rangeDays = RANGES.find((r) => r.key === range)?.days ?? 30;

  const chartData = useMemo(
    () => buildChartPoints(selectedProducts, historiesMap, selectedMarket, rangeDays),
    [selectedProducts, historiesMap, selectedMarket, rangeDays],
  );

  const summary = useMemo(
    () => buildSummary(selectedProducts, historiesMap, selectedMarket, rangeDays),
    [selectedProducts, historiesMap, selectedMarket, rangeDays],
  );

  const handleAddProduct = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) || prev.length >= MAX_PRODUCTS ? prev : [...prev, slug],
    );
  };

  const handleRemoveProduct = (slug: string) => {
    setSelectedSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const handleClearAll = () => setSelectedSlugs([]);

  const isLoading = loadingSlugs.length > 0;

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-6 py-10 md:px-8 md:py-14">
      <header className="mb-8">
        <nav aria-label="Breadcrumb" className="mb-4 font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
          <Link href="/" className="transition-colors hover:text-(--color-brand)">
            Ana Sayfa
          </Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-(--color-foreground)">Fiyat Karşılaştırma</span>
        </nav>
        <div className="mb-2 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          Karşılaştır
        </div>
        <h1 className="font-(family-name:--font-display) text-[32px] font-extrabold tracking-[-0.03em] text-(--color-foreground) md:text-[40px]">
          Fiyat Karşılaştırma
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] text-(--color-muted) md:text-[15px]">
          Aynı grafikte birden fazla ürünün fiyat trendini karşılaştır (maksimum {MAX_PRODUCTS} ürün).
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <ComparisonControls
          products={products}
          markets={markets}
          selectedProductSlugs={selectedSlugs}
          onAddProduct={handleAddProduct}
          selectedMarketSlug={selectedMarket}
          onChangeMarket={setSelectedMarket}
          range={range}
          onChangeRange={setRange}
          onClearAll={handleClearAll}
        />

        <ComparisonChips
          selectedProducts={selectedProducts}
          onRemove={handleRemoveProduct}
        />

        {isLoading ? (
          <div className="h-[360px] animate-pulse rounded-2xl border border-(--color-border) bg-(--color-surface)" />
        ) : (
          <ComparisonChart data={chartData} selectedProducts={selectedProducts} />
        )}

        <ComparisonSummary summary={summary} />
      </div>
    </main>
  );
}
