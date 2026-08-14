import Link from "next/link";
import type { PriceRow } from "@/lib/api";
import ProductImage from "@/components/ui/ProductImage";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { productHref } from "@/lib/product-links";
import { formatDateTr } from "@/lib/date-format";
import { ContentCard } from "@/components/ui/ContentCard";

interface PriceCardProps {
  row: PriceRow;
  changePct?: number;
}

type Trend = "up" | "down" | "stable";

function trendOf(changePct: number | undefined): Trend {
  if (changePct === undefined || changePct === 0 || Number.isNaN(changePct)) {
    return "stable";
  }
  return changePct > 0 ? "up" : "down";
}

function fmt(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const BADGE_CLASS: Record<Trend, string> = {
  up:     "bg-(--trend-bg) text-(--trend-up)",
  down:   "bg-(--trend-bg) text-(--trend-down)",
  stable: "bg-(--color-info-bg) text-(--color-foreground)",
};

const BADGE_LABEL: Record<Trend, string> = {
  up:     "▲ Yükseliş",
  down:   "▼ Düşüş",
  stable: "■ Sabit",
};

const CHANGE_CLASS: Record<Trend, string> = {
  up:     "text-(--trend-up)",
  down:   "text-(--trend-down)",
  stable: "text-(--color-muted)",
};

export default function PriceCard({ row, changePct }: PriceCardProps) {
  const trend = trendOf(changePct);
  const sign = changePct !== undefined && changePct > 0 ? "+" : "";

  return (
    <ContentCard as="div" kind="data" className="group relative overflow-hidden rounded-[16px] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-(--color-brand)/30">

      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[16px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(135deg, transparent 40%, var(--brand-light))",
        }}
      />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ProductImage
              slug={row.productSlug}
              name={row.productName}
              categorySlug={row.categorySlug}
              imageUrl={row.imageUrl}
              size={40}
            />
            <div className="min-w-0">
              <Link href={productHref(row)} className="block truncate text-[15px] font-bold text-(--color-foreground) hover:text-(--color-brand) transition-colors">
                {row.productName}
              </Link>
              <div className="mt-px truncate text-[11px] text-(--color-muted)">
                <Link href={`/hal/${row.marketSlug}`} className="hover:text-(--color-brand) transition-colors font-medium">
                  {row.marketName}
                </Link>
                <span className="mx-1">·</span>
                <span className="font-semibold text-(--color-brand)/80">{row.cityName}</span>
              </div>
            </div>
          </div>
          <span
            className={
              "rounded-[5px] px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.05em] " +
              BADGE_CLASS[trend]
            }
          >
            {BADGE_LABEL[trend]}
          </span>
        </div>

        <div className="mb-1.5 flex items-baseline gap-2">
          <span className="font-(family-name:--font-mono) text-[30px] font-bold tracking-[-0.02em] text-(--color-foreground)">
            ₺{fmt(row.avgPrice)}
          </span>
          <span className="font-(family-name:--font-mono) text-[13px] text-(--color-muted)">
            /{row.unit || "kg"}
          </span>
        </div>

        {row.isSynthetic || row.avgPriceMethod === "midpoint" ? (
          <p className="mb-3 text-[11px] text-(--color-muted)" title="Kaynak yalnız minimum ve maksimum fiyat yayımladığı için orta nokta hesaplandı.">
            Min–maks orta noktası · hacim ağırlıklı değildir
          </p>
        ) : null}

        {changePct !== undefined && changePct !== 0 ? (
          <div
            className={
              "mb-4 font-(family-name:--font-mono) text-[13px] font-semibold " +
              CHANGE_CLASS[trend]
            }
          >
            {trend === "up" ? "▲ " : "▼ "}
            {sign}
            {changePct.toFixed(2)}%
          </div>
        ) : (
          <div className="mb-4 h-[19px]" aria-hidden />
        )}

        <div className="rounded-md border border-(--color-border-soft) bg-(--color-bg-alt) px-3 py-2 text-[11px] text-(--color-muted)">
          <span className="font-semibold text-(--color-foreground)">{formatDateTr(row.recordedDate) ?? "Tarih bilinmiyor"}</span>
          <span aria-hidden> · </span>
          <span>{row.sourceName || "Kaynak bilgisi mevcut"}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-(--color-muted)">
          {(fmt(row.minPrice) !== "—" || fmt(row.maxPrice) !== "—") ? (
            <span className="truncate">
              min ₺{fmt(row.minPrice)} · max ₺{fmt(row.maxPrice)}
            </span>
          ) : (
            <span className="truncate text-(--color-muted)/40">yalnızca ort. fiyat mevcut</span>
          )}
          <div className="relative z-20 shrink-0">
            <FavoriteButton
              slug={row.productSlug}
              productName={row.productName}
              variant="icon"
            />
          </div>
        </div>
      </div>
    </ContentCard>
  );
}
