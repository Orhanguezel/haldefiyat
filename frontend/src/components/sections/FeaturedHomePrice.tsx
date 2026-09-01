import Link from "next/link";
import type { FeaturedPrice } from "@/lib/api";
import ProductImage from "@/components/ui/ProductImage";
import { formatDateTr } from "@/lib/date-format";
import { productHref } from "@/lib/product-links";

function formatPrice(value: number | null | undefined): string {
  return Number.isFinite(Number(value))
    ? Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
}

export default function FeaturedHomePrice({
  row,
  freshness = "unknown",
}: {
  row: FeaturedPrice;
  freshness?: "fresh" | "stale" | "unknown";
}) {
  const date = formatDateTr(row.recordedDate, { day: "numeric", month: "short", year: "numeric" }) ?? "Tarih bilinmiyor";
  const freshnessLabel = freshness === "fresh" ? "Güncel" : freshness === "stale" ? "Gecikmeli" : "Tarihli";
  const change = row.changePct;
  const changeTone = change == null || Math.abs(change) < 0.5
    ? "text-(--color-muted)"
    : change > 0
      ? "text-(--color-danger)"
      : "text-(--color-brand)";
  const changeLabel = change == null
    ? null
    : `${change > 0 ? "▲" : change < 0 ? "▼" : "▬"} %${Math.abs(change).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} haftalık`;
  const scope = row.cityCount > 1 ? `${row.marketCount} hal · ${row.cityCount} il` : `${row.marketCount} hal`;

  return (
    <Link
      href={productHref(row)}
      className="group mt-4 grid grid-cols-[auto_1fr] items-center gap-4 rounded-xl border border-(--color-border) bg-(--color-background) p-4 text-left shadow-(--shadow-card) sm:grid-cols-[auto_1fr_auto]"
      aria-label={`${row.productName} Türkiye hal fiyatı ortalamasını incele`}
    >
      {/* Fotograf hem tanima hizini artiriyor hem de kartin ne oldugunu tek
          bakista anlatiyor — urun gorsel kapsami %100 oldugu icin emoji'ye
          dusme riski pratikte yok. */}
      <ProductImage
        slug={row.productSlug}
        name={row.productName}
        categorySlug={row.categorySlug}
        canonicalSlug={row.canonicalProduct}
        size={96}
        priority
        className="transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <div className="min-w-0">
        <div className="font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-brand)">
          Günün öne çıkan fiyatı · {freshnessLabel}
        </div>
        <div className="mt-1 truncate text-lg font-black text-(--color-foreground)">{row.productName}</div>
        <div className="mt-1 text-xs leading-5 text-(--color-muted)">
          <time dateTime={row.recordedDate}>{date}</time> · {scope} ortalaması
          <span className="hidden sm:inline"> · ₺{formatPrice(row.minPrice)} – ₺{formatPrice(row.maxPrice)} aralığı</span>
        </div>
      </div>
      <div className="col-span-2 shrink-0 border-t border-(--color-border) pt-3 sm:col-span-1 sm:border-0 sm:pt-0 sm:text-right">
        <div className="font-(family-name:--font-mono) text-3xl font-black tracking-tight text-(--color-foreground)">
          ₺{formatPrice(row.avgPrice)}
        </div>
        <div className="text-xs font-semibold text-(--color-muted)">/{row.unit}</div>
        {changeLabel ? (
          <div className={`font-(family-name:--font-mono) text-[11px] font-bold ${changeTone}`}>{changeLabel}</div>
        ) : null}
      </div>
    </Link>
  );
}
