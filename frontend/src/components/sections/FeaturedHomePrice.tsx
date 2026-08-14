import Link from "next/link";
import type { PriceRow } from "@/lib/api";
import { formatDateTr } from "@/lib/date-format";
import { productHref } from "@/lib/product-links";
import { sourceDisplayName } from "@/lib/source-display";

function formatPrice(value: string | number | null | undefined): string {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
}

export default function FeaturedHomePrice({
  row,
  freshness = "unknown",
}: {
  row: PriceRow;
  freshness?: "fresh" | "stale" | "unknown";
}) {
  const date = formatDateTr(row.recordedDate, { day: "numeric", month: "short", year: "numeric" }) ?? "Tarih bilinmiyor";
  const freshnessLabel = freshness === "fresh" ? "Güncel" : freshness === "stale" ? "Gecikmeli" : "Tarihli";

  return (
    <Link
      href={productHref(row)}
      className="group mt-4 grid gap-3 rounded-xl border border-(--color-border) bg-(--color-background) p-4 text-left shadow-(--shadow-card) sm:grid-cols-[1fr_auto] sm:items-center"
      aria-label={`${row.productName} son fiyat kaydını incele`}
    >
      <div className="min-w-0">
        <div className="font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-brand)">
          Öne çıkan son fiyat · {freshnessLabel}
        </div>
        <div className="mt-1 truncate text-base font-black text-(--color-foreground)">{row.productName}</div>
        <div className="mt-1 text-xs leading-5 text-(--color-muted)">
          <time dateTime={row.recordedDate}>{date}</time> · {sourceDisplayName(row.sourceName, row.sourceApi)} · 1 doğrulanabilir kaynak
        </div>
      </div>
      <div className="shrink-0 sm:text-right">
        <div className="font-(family-name:--font-mono) text-3xl font-black tracking-tight text-(--color-foreground)">
          ₺{formatPrice(row.avgPrice)}
        </div>
        <div className="text-xs font-semibold text-(--color-muted)">/{row.unit}</div>
      </div>
    </Link>
  );
}
