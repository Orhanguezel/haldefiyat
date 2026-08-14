import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { ListingContactPanel } from "@/components/listings/ListingContactPanel";
import { ListingSecondaryActions } from "@/components/listings/ListingSecondaryActions";
import BannerSlot from "@/components/ads/BannerSlot";
import { AdConversionTracker } from "@/components/ads/AdConversionTracker";
import { fetchListing } from "@/lib/api";
import { districtsOfProvinceSlug, provinceBySlug } from "@/data/turkey-cities";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await fetchListing(slug);
  if (!listing) return {};
  return {
    title: `${listing.title} | Hal İlanı`,
    description: listing.description ?? `${listing.productName} için ilan/teklif detayı`,
    alternates: { canonical: `/ilan/${listing.slug}` },
    robots: { index: false, follow: true },
  };
}

function price(item: NonNullable<Awaited<ReturnType<typeof fetchListing>>>) {
  if (item.priceType === "pazarlik") return "Pazarlık";
  if (!item.priceMin) return "Belirtilmedi";
  return `${item.priceMin} TL/${item.priceUnit}`;
}

const ROLE_LABEL = {
  uretici: "Üretici",
  komisyoncu: "Komisyoncu",
  alici: "Alıcı",
  diger: "İlan sahibi",
} as const;

function dateText(value: string | null | undefined) {
  if (!value) return "Belirtilmedi";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Belirtilmedi";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function accountAgeText(value: string | null | undefined) {
  if (!value) return "Hesap yaşı bilgisi yok";
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return "Hesap yaşı bilgisi yok";
  const now = new Date();
  const months = Math.max(0, (now.getUTCFullYear() - created.getUTCFullYear()) * 12 + now.getUTCMonth() - created.getUTCMonth());
  if (months < 1) return "Bu ay katıldı";
  if (months < 12) return `${months} aydır üye`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths ? `${years} yıl ${remainingMonths} aydır üye` : `${years} yıldır üye`;
}

export default async function ListingDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const listing = await fetchListing(slug);
  if (!listing) notFound();
  const city = provinceBySlug(listing.citySlug)?.label ?? "Türkiye";
  const district = districtsOfProvinceSlug(listing.citySlug).find((option) => option.value === listing.districtSlug)?.label;
  const location = district ? `${city} / ${district}` : city;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.productName,
    offers: {
      "@type": "Offer",
      name: listing.title,
      price: listing.priceMin ?? undefined,
      priceCurrency: "TRY",
      availabilityEnds: listing.validUntil,
    },
  };

  return (
    <PageContainer>
      <AdConversionTracker eventType="listing_view" entityType="listing" entityId={listing.id} />
      <JsonLd type="Product" data={schema} />
      <Breadcrumb items={[{ name: "Anasayfa", href: "/" }, { name: "İlanlar", href: "/ilanlar" }, { name: listing.title, href: `/ilan/${listing.slug}` }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <article>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-[6px] bg-(--color-brand)/10 px-2 py-1 text-xs font-semibold text-(--color-brand)">İlan/Teklif</span>
            <span className="rounded-[6px] bg-(--color-bg-alt) px-2 py-1 text-xs">{listing.listingType === "satis" ? "Satış" : "Alım"}</span>
          </div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">{listing.title}</h1>
          <p className="mt-2 text-sm text-(--color-muted)">{listing.productName} · {location}</p>
          <dl className="mt-6 grid gap-3 rounded-[12px] border border-(--color-border) bg-(--color-surface) p-4 sm:grid-cols-2 xl:grid-cols-4">
            <div><dt className="text-xs text-(--color-faint)">Fiyat</dt><dd className="mt-1 text-lg font-bold text-(--color-foreground)">{price(listing)}</dd></div>
            <div><dt className="text-xs text-(--color-faint)">Miktar</dt><dd className="mt-1 font-semibold text-(--color-foreground)">{listing.quantity ? `${listing.quantity} ${listing.quantityUnit}` : "Belirtilmedi"}</dd></div>
            <div><dt className="text-xs text-(--color-faint)">Konum</dt><dd className="mt-1 font-semibold text-(--color-foreground)">{location}</dd></div>
            <div><dt className="text-xs text-(--color-faint)">Yayın tarihi</dt><dd className="mt-1 font-semibold text-(--color-foreground)">{dateText(listing.createdAt)}</dd></div>
          </dl>

          <section className="mt-5 rounded-[12px] border border-(--color-border) bg-(--color-bg-alt) p-4" aria-labelledby="seller-trust-title">
            <h2 id="seller-trust-title" className="text-sm font-bold text-(--color-foreground)">Satıcı güven bilgileri</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 font-semibold">{ROLE_LABEL[listing.partyRole]}</span>
              {listing.phoneVerified ? <span className="rounded-full border border-(--color-success)/30 bg-(--color-success-bg) px-3 py-1 font-semibold text-(--color-success)">✓ Telefon doğrulandı</span> : null}
              {listing.sellerEmailVerified ? <span className="rounded-full border border-(--color-success)/30 bg-(--color-success-bg) px-3 py-1 font-semibold text-(--color-success)">✓ E-posta doğrulandı</span> : null}
              <span className="rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 font-medium">{accountAgeText(listing.sellerAccountCreatedAt)}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-(--color-muted)">
              Doğrulama rozetleri yalnız ilgili telefon veya e-posta kanalına gönderilen kod/bağlantının onaylandığını gösterir; kimlik, ürün kalitesi ya da ticari yetki garantisi değildir.
            </p>
          </section>

          <ListingSecondaryActions listingId={listing.id} title={listing.title} pathname={`/ilan/${listing.slug}`} />

          {listing.images?.length ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {listing.images.map((url, index) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={url}
                  src={url}
                  alt={`${listing.title} — görsel ${index + 1}`}
                  width={640}
                  height={480}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="aspect-[4/3] h-auto w-full rounded-[8px] border border-(--color-border) object-cover"
                />
              ))}
            </div>
          ) : null}
          {listing.description ? <p className="mt-6 whitespace-pre-line leading-7 text-(--color-muted)">{listing.description}</p> : null}
        </article>
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ListingContactPanel
            listingId={listing.id}
            enabled={Boolean(listing.callRequestsEnabled)}
            availableSlots={listing.callAvailability}
          />
          <BannerSlot
            position="listing_detail_sidebar"
            className="mt-6"
            context={{ listing: listing.id, city: listing.citySlug, product: listing.productSlug }}
          />
        </aside>
      </div>
    </PageContainer>
  );
}
