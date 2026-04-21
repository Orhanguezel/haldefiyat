"use client";

import { getEmoji } from "@/lib/emoji";
import type { Product } from "@/lib/api";
import { PRODUCT_COLORS } from "./types";

interface ComparisonChipsProps {
  selectedProducts: Product[];
  onRemove: (slug: string) => void;
}

export default function ComparisonChips({ selectedProducts, onRemove }: ComparisonChipsProps) {
  if (selectedProducts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {selectedProducts.map((p, i) => {
        const color = PRODUCT_COLORS[i % PRODUCT_COLORS.length];
        return (
          <div
            key={p.slug}
            className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) py-1.5 pl-2 pr-1"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <span className="text-base">{getEmoji(p.slug, p.categorySlug)}</span>
            <span className="text-[13px] font-medium text-(--color-foreground)">
              {p.nameTr}
            </span>
            <button
              type="button"
              onClick={() => onRemove(p.slug)}
              aria-label={`${p.nameTr} kaldır`}
              className="flex h-6 w-6 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-alt) hover:text-(--color-foreground)"
            >
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
