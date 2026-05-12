"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { LayoutGrid, Map } from "lucide-react";
import type { Market } from "@/lib/api";

const TurkeyMapClient = dynamic(
  () => import("@/components/sections/TurkeyMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-surface) text-[13px] text-(--color-muted)">
        Harita yükleniyor…
      </div>
    ),
  },
);

interface Props {
  markets: Market[];
  locale: string;
  majorCities: string[];
}

const SKELETON_COUNT = 6;

export default function CitySelectorClient({ markets, locale, majorCities }: Props) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div>
      {/* Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <div className="inline-flex items-center rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) p-1 gap-1">
          <button
            onClick={() => setView("list")}
            className={
              "flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-all " +
              (view === "list"
                ? "bg-(--color-surface) text-(--color-foreground) shadow-sm"
                : "text-(--color-muted) hover:text-(--color-foreground)")
            }
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Liste
          </button>
          <button
            onClick={() => setView("map")}
            className={
              "flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-all " +
              (view === "map"
                ? "bg-(--color-surface) text-(--color-foreground) shadow-sm"
                : "text-(--color-muted) hover:text-(--color-foreground)")
            }
          >
            <Map className="h-3.5 w-3.5" />
            Haritada Gör
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div className="h-[500px] sm:h-[600px]">
          <TurkeyMapClient markets={markets} />
        </div>
      ) : markets.length === 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-[100px] animate-pulse rounded-2xl border border-(--color-border-soft) bg-(--color-bg-alt)/50"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {markets.map((market: Market) => {
            const isMajor = majorCities.includes(market.slug);
            return (
              <Link
                key={market.id}
                href={`/${locale}/hal/${market.slug}`}
                className={`group relative flex flex-col justify-center rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isMajor
                    ? "border-(--color-brand)/20 bg-(--color-brand)/[0.02] hover:border-(--color-brand) hover:shadow-(--color-brand)/5"
                    : "border-(--color-border-soft) bg-(--color-surface) hover:border-(--color-brand)/40 hover:bg-(--color-bg-alt)/30"
                }`}
              >
                {isMajor && (
                  <span className="absolute right-3 top-3 rounded-md bg-(--color-brand) px-1.5 py-0.5 font-(family-name:--font-mono) text-[9px] font-bold uppercase tracking-wider text-(--color-brand-fg)">
                    Popüler
                  </span>
                )}
                <div className="font-(family-name:--font-display) text-[16px] font-bold tracking-tight text-(--color-foreground) group-hover:text-(--color-brand)">
                  {market.cityName}
                </div>
                <div className="mt-1 line-clamp-1 text-[11px] font-medium text-(--color-muted)">
                  {market.name}
                </div>
                <div className="mt-4 flex items-center justify-between opacity-0 transition-all group-hover:opacity-100">
                  <span className="text-[10px] font-bold uppercase text-(--color-brand)">
                    Fiyatları Gör
                  </span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-(--color-brand)">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
