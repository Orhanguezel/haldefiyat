import Link from "next/link";
import type { Listing } from "@/lib/api";

function priceText(item: Listing) {
  if (item.priceType === "pazarlik") return "Pazarlık";
  if (item.priceType === "hal_endeksli") return `Hal endeksli${item.priceMin ? ` · ${item.priceMin}` : ""}`;
  if (!item.priceMin) return "Fiyat belirtilmedi";
  const max = item.priceMax && item.priceMax !== item.priceMin ? ` - ${item.priceMax}` : "";
  return `${item.priceMin}${max} TL/${item.priceUnit}`;
}

export function ListingCard({ item, compact = false }: { item: Listing; compact?: boolean }) {
  const typeLabel = item.listingType === "satis" ? "Satış ilanı" : "Alım talebi";
  return (
    <article className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-[6px] bg-(--color-brand)/10 px-2 py-1 text-[11px] font-semibold text-(--color-brand)">
          İlan/Teklif
        </span>
        <span className="rounded-[6px] bg-(--color-bg-alt) px-2 py-1 text-[11px] text-(--color-muted)">
          {typeLabel}
        </span>
        {item.isFeatured ? (
          <span className="rounded-[6px] bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">
            Öne çıkan
          </span>
        ) : null}
      </div>
      <Link href={`/ilan/${item.slug}`} className="mt-3 block">
        <h2 className="line-clamp-2 text-lg font-bold text-(--color-foreground)">{item.title}</h2>
      </Link>
      <p className="mt-1 text-sm text-(--color-muted)">
        {item.productName} · {item.citySlug ?? "Türkiye"}{item.districtSlug ? ` / ${item.districtSlug}` : ""}
      </p>
      {!compact && item.description ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-(--color-muted)">{item.description}</p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="block text-[11px] uppercase text-(--color-faint)">Miktar</span>
          <strong>{item.quantity ? `${item.quantity} ${item.quantityUnit}` : "Belirtilmedi"}</strong>
        </div>
        <div>
          <span className="block text-[11px] uppercase text-(--color-faint)">Fiyat</span>
          <strong>{priceText(item)}</strong>
        </div>
      </div>
    </article>
  );
}

