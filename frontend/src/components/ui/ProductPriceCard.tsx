import Link from "next/link";
import type { FeaturedPrice } from "@/lib/api";
import ProductImage from "@/components/ui/ProductImage";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { productHref } from "@/lib/product-links";
import { formatDateTr } from "@/lib/date-format";
import { ContentCard } from "@/components/ui/ContentCard";

/**
 * Ana sayfa izgara karti — URUN bazli.
 *
 * PriceCard tek bir halin satirini gosterir; anasayfada bu yaniltici oluyordu:
 * ayni gun Limon Istanbul'da 42,50 iken Yalova'da 90,00 idi ve hangi halin
 * kartа dustugu siralamanin yan etkisiydi. Burada fiyat hero karti ile ayni:
 * haller arasi ortalama, yaninda gercek min-max araligi ve kac hal/il.
 */
type Trend = "up" | "down" | "stable";

function trendOf(changePct: number | null): Trend {
  if (changePct == null || Math.abs(changePct) < 0.5) return "stable";
  return changePct > 0 ? "up" : "down";
}

function fmt(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export default function ProductPriceCard({ row }: { row: FeaturedPrice }) {
  const trend = trendOf(row.changePct);
  const scope = row.cityCount > 1
    ? `${row.marketCount} hal · ${row.cityCount} il ortalaması`
    : `${row.marketCount} hal ortalaması`;

  return (
    <ContentCard as="div" kind="data" className="group relative overflow-hidden rounded-[16px] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-(--color-brand)/30">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[16px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "linear-gradient(135deg, transparent 40%, var(--brand-light))" }}
      />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <ProductImage
              slug={row.productSlug}
              name={row.productName}
              categorySlug={row.categorySlug}
              canonicalSlug={row.canonicalProduct}
              size={64}
              className="transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <div className="min-w-0">
              <Link href={productHref(row)} className="block truncate text-[15px] font-bold text-(--color-foreground) transition-colors hover:text-(--color-brand)">
                {row.productName}
              </Link>
              <div className="mt-px truncate text-[11px] text-(--color-muted)">{scope}</div>
            </div>
          </div>
          <span
            className={
              "shrink-0 rounded-[5px] px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.05em] " +
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

        {row.changePct != null && trend !== "stable" ? (
          <div className={"mb-4 font-(family-name:--font-mono) text-[13px] font-semibold " + CHANGE_CLASS[trend]}>
            {trend === "up" ? "▲ +" : "▼ "}
            {row.changePct.toFixed(1)}% <span className="font-normal text-(--color-muted)">haftalık</span>
          </div>
        ) : (
          <div className="mb-4 h-[19px]" aria-hidden />
        )}

        <div className="rounded-md border border-(--color-border-soft) bg-(--color-bg-alt) px-3 py-2 text-[11px] text-(--color-muted)">
          <span className="font-semibold text-(--color-foreground)">
            {formatDateTr(row.recordedDate) ?? "Tarih bilinmiyor"}
          </span>
          <span aria-hidden> · </span>
          <span>{row.marketCount} halden derlendi</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-(--color-muted)">
          <span className="truncate">
            en ucuz ₺{fmt(row.minPrice)} · en pahalı ₺{fmt(row.maxPrice)}
          </span>
          <div className="relative z-20 shrink-0">
            <FavoriteButton slug={row.productSlug} productName={row.productName} variant="icon" />
          </div>
        </div>
      </div>
    </ContentCard>
  );
}
