"use client";

import dynamic from "next/dynamic";
import type { PriceHistoryRow } from "@/lib/api";

/**
 * PriceChart (recharts) lazy yüklenir — ağır chart lib'i ürün sayfasının ilk bundle'ından
 * çıkar. Fiyat verisi tablo + schema'da zaten SSR; chart client-side hydrate olur (SEO etkisi yok).
 */
const PriceChart = dynamic(() => import("./PriceChart"), {
  ssr: false,
  loading: () => (
    <div className="h-[360px] animate-pulse rounded-2xl border border-(--color-border) bg-(--color-surface)" />
  ),
});

export default function PriceChartLazy(props: { history: PriceHistoryRow[]; productName: string }) {
  return <PriceChart {...props} />;
}
