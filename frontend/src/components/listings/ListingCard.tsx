import Link from "next/link";
import type { Listing } from "@/lib/api";

function priceText(item: Listing) {
  if (item.priceType === "pazarlik") return "Pazarlık";
  if (item.priceType === "hal_endeksli") return `Hal endeksli${item.priceMin ? ` · ${item.priceMin}` : ""}`;
  if (!item.priceMin) return "Fiyat belirtilmedi";
  const max = item.priceMax && item.priceMax !== item.priceMin ? ` - ${item.priceMax}` : "";
  return `${item.priceMin}${max} TL/${item.priceUnit}`;
}

/** İlanı kimin verdiği alıcı için en kritik bilgi — kart bunu göstermiyordu. */
const ROLE_LABEL: Record<Listing["partyRole"], string> = {
  uretici: "Üretici",
  komisyoncu: "Komisyoncu",
  alici: "Alıcı",
  diger: "İlan sahibi",
};

function relativeDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 30) return `${days} gün önce`;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
}

export function ListingCard({ item, compact = false }: { item: Listing; compact?: boolean }) {
  const typeLabel = item.listingType === "satis" ? "Satış ilanı" : "Alım talebi";
  const owner = item.contactName?.trim();
  const posted = relativeDate(item.createdAt);

  return (
    <article className="group flex h-full flex-col rounded-[10px] border border-(--color-border) bg-(--color-surface) p-4 shadow-sm transition hover:border-(--color-brand)/40 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={
            item.listingType === "satis"
              ? "rounded-[6px] bg-(--color-success-bg) px-2 py-1 text-[11px] font-semibold text-(--color-success)"
              : "rounded-[6px] bg-(--color-info-bg) px-2 py-1 text-[11px] font-semibold text-(--color-info)"
          }
        >
          {typeLabel}
        </span>
        <span className="rounded-[6px] bg-(--color-bg-alt) px-2 py-1 text-[11px] text-(--color-muted)">
          {ROLE_LABEL[item.partyRole]}
        </span>
        {item.isFeatured ? (
          // Onceden bg-amber-100/text-amber-800 sabit acik-tema rengiydi; koyu temada okunmuyordu.
          <span className="rounded-[6px] bg-(--color-warning-bg) px-2 py-1 text-[11px] font-semibold text-(--color-warning)">
            Öne çıkan
          </span>
        ) : null}
      </div>

      {item.images?.[0] ? (
        <Link
          href={`/ilan/${item.slug}`}
          className="mt-3 block overflow-hidden rounded-[6px] border border-(--color-border)"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.images[0]}
            alt={item.title}
            className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>
      ) : null}

      <Link href={`/ilan/${item.slug}`} className="mt-3 block">
        <h2 className="line-clamp-2 text-lg font-bold text-(--color-foreground) group-hover:text-(--color-brand)">
          {item.title}
        </h2>
      </Link>

      <p className="mt-1 text-sm text-(--color-muted)">
        {item.productName} · {item.citySlug ?? "Türkiye"}
        {item.districtSlug ? ` / ${item.districtSlug}` : ""}
      </p>

      {!compact && item.description ? (
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-(--color-muted)">{item.description}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="block text-[11px] uppercase tracking-wide text-(--color-faint)">Miktar</span>
          <strong className="text-(--color-foreground)">
            {item.quantity ? `${item.quantity} ${item.quantityUnit}` : "Belirtilmedi"}
          </strong>
        </div>
        <div>
          <span className="block text-[11px] uppercase tracking-wide text-(--color-faint)">Fiyat</span>
          <strong className="text-(--color-foreground)">{priceText(item)}</strong>
        </div>
      </div>

      {/* İlan sahibi — alıcının "bu ilan kime ait?" sorusunun cevabı kartta olmalı. */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-(--color-border) pt-3 text-xs text-(--color-muted)">
        {owner ? (
          <span className="inline-flex items-center gap-1.5 font-medium text-(--color-foreground)">
            <span
              aria-hidden
              className="grid size-5 place-items-center rounded-full bg-(--color-brand)/10 text-[10px] font-bold text-(--color-brand)"
            >
              {owner.slice(0, 1).toLocaleUpperCase("tr-TR")}
            </span>
            {owner}
          </span>
        ) : (
          <span>{ROLE_LABEL[item.partyRole]}</span>
        )}

        {item.phoneVerified ? (
          <span className="inline-flex items-center gap-1 text-(--color-success)" title="Telefon numarası doğrulandı">
            <span aria-hidden>✓</span> Doğrulanmış
          </span>
        ) : null}

        {posted ? <span className="ml-auto">{posted}</span> : null}
      </div>
    </article>
  );
}
