"use client";

import type { Market, Product } from "@/lib/api";
import { RANGES, MAX_PRODUCTS, type RangeKey } from "./types";

interface ComparisonControlsProps {
  products: Product[];
  markets: Market[];
  selectedProductSlugs: string[];
  onAddProduct: (slug: string) => void;
  selectedMarketSlug: string | null;
  onChangeMarket: (slug: string | null) => void;
  range: RangeKey;
  onChangeRange: (range: RangeKey) => void;
  onClearAll: () => void;
}

export default function ComparisonControls({
  products,
  markets,
  selectedProductSlugs,
  onAddProduct,
  selectedMarketSlug,
  onChangeMarket,
  range,
  onChangeRange,
  onClearAll,
}: ComparisonControlsProps) {
  const limitReached = selectedProductSlugs.length >= MAX_PRODUCTS;
  const availableProducts = products.filter((p) => !selectedProductSlugs.includes(p.slug));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-(--color-border) bg-(--color-surface) p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <select
          value=""
          disabled={limitReached || availableProducts.length === 0}
          onChange={(e) => {
            const slug = e.target.value;
            if (slug) onAddProduct(slug);
            e.currentTarget.value = "";
          }}
          className="h-10 rounded-lg border border-(--color-border) bg-(--color-bg-alt) px-3 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/30 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Ürün ekle"
        >
          <option value="">
            {limitReached ? `Maksimum ${MAX_PRODUCTS} ürün` : "Ürün ekle..."}
          </option>
          {availableProducts.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.nameTr}
            </option>
          ))}
        </select>

        <select
          value={selectedMarketSlug ?? ""}
          onChange={(e) => onChangeMarket(e.target.value || null)}
          className="h-10 rounded-lg border border-(--color-border) bg-(--color-bg-alt) px-3 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none focus:ring-2 focus:ring-(--color-brand)/30"
          aria-label="Hal filtresi"
        >
          <option value="">Tüm Haller</option>
          {markets.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.name} ({m.cityName})
            </option>
          ))}
        </select>

        <div className="inline-flex items-center gap-1 rounded-lg bg-(--color-bg-alt) p-1">
          {RANGES.map((r) => {
            const active = r.key === range;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => onChangeRange(r.key)}
                className={
                  "rounded-md px-3 py-1.5 font-(family-name:--font-mono) text-[12px] font-semibold transition-colors " +
                  (active
                    ? "bg-(--color-brand) text-(--color-navy)"
                    : "text-(--color-muted) hover:text-(--color-foreground)")
                }
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {selectedProductSlugs.length > 0 ? (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex h-10 items-center rounded-lg border border-(--color-border) px-3 text-[12px] font-medium text-(--color-muted) transition-colors hover:bg-(--color-bg-alt) hover:text-(--color-foreground)"
        >
          Tümünü Temizle
        </button>
      ) : null}
    </div>
  );
}
