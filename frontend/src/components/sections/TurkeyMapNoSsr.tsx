"use client";

import dynamic from "next/dynamic";
import type { CityPriceMapItem, Market } from "@/lib/api";

const TurkeyMapClient = dynamic(() => import("./TurkeyMapClient"), {
  ssr: false,
  loading: () => (
    <div
      className="min-h-[620px] animate-pulse rounded-[18px] border border-(--color-border) bg-(--color-surface)"
      role="status"
      aria-label="Türkiye fiyat haritası yükleniyor"
    />
  ),
});

export default function TurkeyMapNoSsr({
  markets,
  cityPrices,
}: {
  markets: Market[];
  cityPrices: CityPriceMapItem[];
}) {
  return <TurkeyMapClient markets={markets} cityPrices={cityPrices} />;
}
