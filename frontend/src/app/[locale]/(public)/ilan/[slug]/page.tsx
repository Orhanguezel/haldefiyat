import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { ListingInquiryForm } from "@/components/listings/ListingInquiryForm";
import { fetchListing } from "@/lib/api";

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

export default async function ListingDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const listing = await fetchListing(slug);
  if (!listing) notFound();

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
      <JsonLd type="Product" data={schema} />
      <Breadcrumb items={[{ name: "Anasayfa", href: "/" }, { name: "İlanlar", href: "/ilanlar" }, { name: listing.title, href: `/ilan/${listing.slug}` }]} />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <article>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-[6px] bg-(--color-brand)/10 px-2 py-1 text-xs font-semibold text-(--color-brand)">İlan/Teklif</span>
            <span className="rounded-[6px] bg-(--color-bg-alt) px-2 py-1 text-xs">{listing.listingType === "satis" ? "Satış" : "Alım"}</span>
          </div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">{listing.title}</h1>
          <p className="mt-2 text-sm text-(--color-muted)">{listing.productName} · {listing.citySlug ?? "Türkiye"}</p>
          <dl className="mt-6 grid gap-4 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 sm:grid-cols-3">
            <div><dt className="text-xs text-(--color-faint)">Miktar</dt><dd className="font-semibold">{listing.quantity ? `${listing.quantity} ${listing.quantityUnit}` : "Belirtilmedi"}</dd></div>
            <div><dt className="text-xs text-(--color-faint)">Fiyat</dt><dd className="font-semibold">{price(listing)}</dd></div>
            <div><dt className="text-xs text-(--color-faint)">Geçerli</dt><dd className="font-semibold">{listing.validUntil}</dd></div>
          </dl>
          {listing.description ? <p className="mt-6 whitespace-pre-line leading-7 text-(--color-muted)">{listing.description}</p> : null}
          {listing.contactPhone ? <p className="mt-6 text-sm font-semibold">Telefon: {listing.contactPhone}</p> : null}
        </article>
        <aside>
          <ListingInquiryForm listingId={listing.id} />
        </aside>
      </div>
    </PageContainer>
  );
}
