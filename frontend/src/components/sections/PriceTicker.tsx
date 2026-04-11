"use client";

import type { TrendingItem } from "@/lib/api";
import { getEmoji } from "@/lib/emoji";

interface Props {
  items: TrendingItem[];
}

function formatPrice(value: number): string {
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function TickerEntry({ item, index }: { item: TrendingItem; index: number }) {
  const slug = item.product?.slug ?? "";
  const name = item.product?.nameTr ?? "—";
  const change = Number.isFinite(item.changePct) ? item.changePct : 0;
  const isUp = change > 0;
  const isDown = change < 0;
  const arrow = isUp ? "▲" : isDown ? "▼" : "■";
  const sign = isUp ? "+" : "";

  return (
    <>
      <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
        <span className="text-[18px]" aria-hidden>
          {getEmoji(slug)}
        </span>
        <span className="text-[13px] font-semibold text-(--color-foreground)">
          {name}
        </span>
        <span className="font-(family-name:--font-mono) text-[13px] font-semibold text-(--color-foreground)">
          ₺{formatPrice(item.latest)}
        </span>
        <span
          className={
            "rounded-[4px] px-2 py-0.5 font-(family-name:--font-mono) text-[12px] font-semibold " +
            (isUp
              ? "bg-green-500/10 text-green-400"
              : isDown
              ? "bg-red-500/10 text-red-400"
              : "bg-blue-500/10 text-blue-400")
          }
        >
          {arrow} {sign}
          {change.toFixed(2)}%
        </span>
      </div>
      {index < 999 && (
        <span
          aria-hidden
          className="h-4 w-px shrink-0 bg-(--color-border)"
        />
      )}
    </>
  );
}

export default function PriceTicker({ items }: Props) {
  if (!items || items.length === 0) {
    return null;
  }

  // Sonsuz scroll icin items 2x cogaltilir — translateX(-50%) ile seamless loop
  const doubled = [...items, ...items];

  return (
    <section
      id="canli-fiyat-akisi"
      className="relative z-10 px-8 pb-20"
      aria-label="Canli fiyat akisi"
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-6 overflow-hidden rounded-[20px] border border-(--color-border) bg-(--color-surface) px-7 py-5">
        <div className="flex shrink-0 items-center gap-1.5 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap text-(--color-brand)">
          <span className="live-dot-sm" aria-hidden />
          CANLI
        </div>
        <div className="ticker-mask flex-1 overflow-hidden">
          <div className="ticker-track flex w-max gap-8">
            {doubled.map((item, idx) => (
              <TickerEntry
                key={`${item.productId}-${item.marketId}-${idx}`}
                item={item}
                index={idx}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
