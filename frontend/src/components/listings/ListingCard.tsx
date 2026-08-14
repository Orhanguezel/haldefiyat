import Link from "next/link";
import type { Listing } from "@/lib/api";
import { districtsOfProvinceSlug, provinceBySlug } from "@/data/turkey-cities";
import { ContentCard } from "@/components/ui/ContentCard";

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

function fallbackLocationLabel(value: string | null | undefined) {
  if (!value) return null;
  return value
    .split("-")
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}

export function ListingCard({ item, compact = false }: { item: Listing; compact?: boolean }) {
  const typeLabel = item.listingType === "satis" ? "Satış ilanı" : "Alım talebi";
  const posted = relativeDate(item.createdAt);
  const city = provinceBySlug(item.citySlug)?.label ?? fallbackLocationLabel(item.citySlug) ?? "Türkiye";
  const district = districtsOfProvinceSlug(item.citySlug).find((option) => option.value === item.districtSlug)?.label
    ?? fallbackLocationLabel(item.districtSlug);
  const verificationHelpId = `listing-verification-${item.id}`;

  return (
    <ContentCard
      as="article"
      kind="listing"
      aria-label={item.isFeatured ? `Sponsorlu ilan: ${item.title}` : undefined}
      className={`group flex h-full flex-col rounded-[10px] bg-(--color-surface) p-4 shadow-sm transition hover:shadow-md ${
        item.isFeatured
          ? "border-2 border-(--color-warning) ring-4 ring-(--color-warning-bg)"
          : "hover:border-(--color-brand)/40"
      }`}
    >
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
            Reklam · Sponsorlu
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
        {item.productName} · {city}{district ? ` / ${district}` : ""}
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

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-(--color-border) pt-3 text-xs text-(--color-muted)">
        <span>{ROLE_LABEL[item.partyRole]}</span>

        {item.phoneVerified ? (
          <span className="group/verify relative inline-flex">
            <button type="button" aria-describedby={verificationHelpId} className="inline-flex items-center gap-1 font-semibold text-(--color-success) underline decoration-dotted underline-offset-2">
              <span aria-hidden>✓</span> Telefon doğrulandı
            </button>
            <span id={verificationHelpId} role="tooltip" className="pointer-events-none invisible absolute bottom-full left-0 z-20 mb-2 w-64 rounded-lg bg-(--color-foreground) p-3 text-[11px] font-normal leading-5 text-(--color-bg) opacity-0 shadow-xl transition group-hover/verify:visible group-hover/verify:opacity-100 group-focus-within/verify:visible group-focus-within/verify:opacity-100">
              Bu rozet yalnız ilan sahibinin telefonuna gönderilen kodun onaylandığını gösterir; kimlik veya ticari yetki doğrulaması değildir.
            </span>
          </span>
        ) : null}

        {posted ? <span className="ml-auto">{posted}</span> : null}
      </div>

      <Link href={`/ilan/${item.slug}`} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[8px] bg-(--color-brand) px-4 text-sm font-semibold text-(--color-brand-fg) transition hover:opacity-90">
        İlanı incele
      </Link>
    </ContentCard>
  );
}
