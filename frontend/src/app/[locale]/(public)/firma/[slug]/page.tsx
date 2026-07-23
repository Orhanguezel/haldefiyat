export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { fetchFirm, fetchFirms, fetchMarkets, fetchPrices, type PriceRow } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FirmCard from "@/components/firms/FirmCard";
import { FirmClaimButton } from "@/components/firms/FirmClaimButton";
import FirmClaimPrompt from "@/components/firms/FirmClaimPrompt";
import FirmLeadForm from "@/components/firms/FirmLeadForm";

type Props = { params: Promise<{ locale: string; slug: string }> };

const TYPE_LABELS = {
  komisyoncu: "Hal Komisyoncusu",
  soguk_hava: "Soğuk Hava Deposu",
  nakliye: "Nakliye Firması",
  zirai_ilac: "Zirai İlaç Firması",
} as const;

function titleCaseSlug(value?: string | null): string {
  if (!value) return "Türkiye";
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr") + part.slice(1))
    .join(" ");
}

function normalizeTrSlug(value?: string | null): string {
  if (!value) return "";
  return value
    .trim()
    .toLocaleLowerCase("tr")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findFirmCityMarket(citySlug?: string | null) {
  if (!citySlug) return null;
  const target = normalizeTrSlug(citySlug);
  const markets = await fetchMarkets();
  return markets.find((market) => (
    market.marketType !== "borsa" &&
    market.marketType !== "resmi" &&
    market.regionSlug !== "ulusal" &&
    normalizeTrSlug(market.cityName) === target
  )) ?? null;
}

function hasIndexableContent(firm: Awaited<ReturnType<typeof fetchFirm>>): boolean {
  if (!firm) return false;
  return firm.seoIndex === true || firm.seoIndex === 1;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const firm = await fetchFirm(slug);
  // notFound() BURADA cagrilmaz: generateMetadata icinde cagrilirsa Next
  // render agacini kurmadan kisa devre yapar ve stillendirilmis not-found.tsx
  // yerine ciplak hata kabugu doner. 404'u page component'i veriyor.
  if (!firm) return { title: "Sayfa bulunamadı", robots: { index: false, follow: false } };

  const city = titleCaseSlug(firm.citySlug);
  return getPageMetadata(["firma_detay", "firma"], {
    locale,
    pathname: `/firma/${slug}`,
    vars: {
      name: firm.name,
      city,
    },
    title: `${firm.name} | ${city} Firma Profili`,
    description: `${firm.name} firma profili, adres ve iletişim bilgileri. ${city} hal firmaları ve komisyoncu rehberi.`,
    robots: hasIndexableContent(firm)
      ? { index: true, follow: true }
      : { index: false, follow: true },
  });
}

export default async function FirmDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const firm = await fetchFirm(slug);
  if (!firm) notFound();

  const [related, cityMarket] = await Promise.all([
    firm.citySlug
      ? fetchFirms({ city: firm.citySlug, type: firm.firmType, limit: 4 })
      : Promise.resolve({ items: [], meta: { total: 0, limit: 4, offset: 0 } }),
    findFirmCityMarket(firm.citySlug),
  ]);
  const cityPrices = cityMarket ? await fetchPrices({ market: cityMarket.slug, range: "7d", limit: 6 }) : [];
  const relatedItems = related.items.filter((item) => item.slug !== firm.slug).slice(0, 3);
  const city = titleCaseSlug(firm.citySlug);
  const district = titleCaseSlug(firm.districtSlug);
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");
  const isPremium = Boolean(firm.sponsorshipTier && ["premium", "gold", "featured"].includes(firm.sponsorshipTier));
  const mapQuery = buildMapQuery(firm.name, firm.address, district, city);
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;
  const firmProducts = (firm.products ?? []).filter((product) => product.productName || product.productSlug);

  const localBusinessSchema = {
    name: firm.name,
    url: `${SITE_URL}/firma/${firm.slug}`,
    image: firm.photoUrl || undefined,
    telephone: firm.phone || undefined,
    hasMap: mapUrl || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: firm.address || undefined,
      addressLocality: firm.districtSlug ? district : city,
      addressRegion: city,
      addressCountry: "TR",
    },
    "@type": firm.firmType === "nakliye" ? "MovingCompany" : "LocalBusiness",
  } satisfies Record<string, unknown>;

  return (
    <main className="relative z-10 mx-auto max-w-[1180px] px-8 py-12">
      <JsonLd type="LocalBusiness" data={localBusinessSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Firmalar", href: "/firmalar" },
        { name: firm.name, href: `/firma/${firm.slug}` },
      ]} />

      <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-[8px] border border-(--color-border) bg-(--color-surface)">
          {firm.photoUrl ? (
            <img src={firm.photoUrl} alt="" className="aspect-[4/3] w-full object-cover" />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-(--color-bg-alt) font-(family-name:--font-display) text-5xl font-bold text-(--color-brand)">
              {firm.name.charAt(0).toLocaleUpperCase("tr")}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-(--color-brand)/25 px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.08em] text-(--color-brand)">
              {TYPE_LABELS[firm.firmType]}
            </span>
            {firm.sponsorshipTier && (
              <span className="rounded-full bg-(--color-brand)/12 px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold text-(--color-brand)">
                {isPremium ? "Premium Profil" : "Sponsorlu"}
              </span>
            )}
          </div>

          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground) sm:text-4xl">
            {firm.name}
          </h1>
          <p className="mt-2 font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
            {city}{firm.districtSlug ? ` · ${district}` : ""}
          </p>

          <dl className="mt-8 grid gap-3 sm:grid-cols-2">
            {firm.contactPerson && <Info label="Yetkili" value={firm.contactPerson} />}
            {firm.phone && <Info label="Telefon" value={firm.phone} />}
            {firm.address && <Info label="Adres" value={firm.address} wide />}
          </dl>

          {firm.description && (
            <div className="mt-6 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 text-sm leading-6 text-(--color-muted)">
              {firm.description}
            </div>
          )}

          {(firm.ocrContacts ?? []).length > 0 && (
            <div className="mt-6 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4">
              <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">
                Komisyoncu İletişimleri
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(firm.ocrContacts ?? []).map((contact, index) => (
                  <div key={`${contact.name ?? "komisyoncu"}-${index}`} className="rounded-[6px] border border-(--color-border-soft) p-3">
                    <p className="font-semibold text-(--color-foreground)">{contact.name || "Komisyoncu"}</p>
                    {(contact.phones ?? []).map((phone) => (
                      <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="mt-1 block font-(family-name:--font-mono) text-[12px] text-(--color-brand)">
                        {phone}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isPremium && (
            <div className="mt-6 rounded-[8px] border border-(--color-brand)/25 bg-(--color-brand)/8 p-4 text-sm leading-6 text-(--color-muted)">
              <strong className="text-(--color-foreground)">Premium firma profili.</strong>{" "}
              Bu firma, HalDeFiyat firma rehberinde öne çıkarılmış profil olarak listelenir.
              Görüşme, reklam ve iş ortaklığı talepleri aşağıdaki formdan ekibimize iletilebilir.
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {firm.phone && (
              <a
                href={`tel:${firm.phone.replace(/[^\d+]/g, "")}`}
                className="rounded-[6px] bg-(--color-brand) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-white"
              >
                Telefonla ara
              </a>
            )}
            <Link
              href={firm.citySlug ? `/firmalar/${firm.citySlug}` : "/firmalar"}
              className="rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground)"
            >
              Şehirdeki firmalar
            </Link>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground)"
              >
                Haritada aç
              </a>
            )}
            <FirmClaimButton firmId={firm.id} claimStatus={firm.claimStatus} />
          </div>
        </div>
      </section>

      <FirmClaimPrompt
        firmId={firm.id}
        firmSlug={firm.slug}
        firmName={firm.name}
        claimStatus={firm.claimStatus}
      />

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {(firm.latestPrices ?? []).length > 0 && (
            <section className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
                  Günlük Hal Fiyatları
                </h2>
                {firm.latestPriceDate && (
                  <span className="rounded-full border border-(--color-brand)/25 px-3 py-1 font-(family-name:--font-mono) text-[11px] font-semibold text-(--color-brand)">
                    Veri tarihi: {firm.latestPriceDate}
                  </span>
                )}
              </div>
              <div className="mt-4 overflow-x-auto rounded-[8px] border border-(--color-border-soft)">
                <table className="min-w-[420px] w-full text-left text-sm">
                  <thead className="bg-(--color-bg-alt) font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.08em] text-(--color-muted)">
                    <tr>
                      <th className="px-4 py-3">Ürün</th>
                      <th className="px-4 py-3">Birim</th>
                      <th className="px-4 py-3">Fiyat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--color-border-soft)">
                    {(firm.latestPrices ?? []).map((price) => (
                      <tr key={price.id}>
                        <td className="px-4 py-3 font-semibold text-(--color-foreground)">{price.productName}</td>
                        <td className="px-4 py-3 text-(--color-muted)">{price.unit}</td>
                        <td className="px-4 py-3 font-semibold text-(--color-foreground)">{formatPrice(price.avgPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {cityMarket && (
            <CityMarketPricesBlock
              city={city}
              marketSlug={cityMarket.slug}
              marketName={cityMarket.name}
              prices={cityPrices}
            />
          )}

          {firmProducts.length > 0 && (
            <section className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
              <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
                Çalıştığı Ürünler
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {firmProducts.map((product) => {
                  const label = product.productName || product.productSlug || "Ürün";
                  return product.productSlug ? (
                    <Link
                      key={product.id}
                      href={`/urun/${product.productSlug}`}
                      className="rounded-[6px] border border-(--color-border-soft) px-3 py-2 text-[12px] font-semibold text-(--color-foreground) hover:border-(--color-brand)/45"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span
                      key={product.id}
                      className="rounded-[6px] border border-(--color-border-soft) px-3 py-2 text-[12px] font-semibold text-(--color-muted)"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </section>
          )}

          <FirmLeadForm firmSlug={firm.slug} />
        </div>
        <aside className="rounded-[8px] border border-dashed border-(--color-border) bg-(--color-bg-alt) p-5">
          <div className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-brand)">
            Reklam Alanı
          </div>
          <h2 className="mt-2 font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">
            Bu bölgede öne çıkın
          </h2>
          <p className="mt-2 text-sm leading-6 text-(--color-muted)">
            İl, kategori veya global sponsorlu firma yerleşimi için HalDeFiyat ekibiyle görüşebilirsiniz.
          </p>
          <Link href="/iletisim?subject=Firma%20Rehberi%20Sponsorluk" className="mt-4 inline-flex rounded-[6px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground)">
            Sponsorluk talebi
          </Link>
        </aside>
      </section>

      {relatedItems.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-(--color-border-soft) pb-3">
            <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
              Aynı Bölgedeki Firmalar
            </h2>
            <Link href={firm.citySlug ? `/firmalar/${firm.citySlug}` : "/firmalar"} className="font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand)">
              Tümünü gör
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {relatedItems.map((item) => (
              <FirmCard key={item.id} firm={item} compact />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function CityMarketPricesBlock({
  city,
  marketSlug,
  marketName,
  prices,
}: {
  city: string;
  marketSlug: string;
  marketName: string;
  prices: PriceRow[];
}) {
  const priceDate = prices[0]?.recordedDate;
  return (
    <section className="rounded-[8px] border border-(--color-border) bg-(--color-surface) p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
            {city} Hali Güncel Fiyatları
          </h2>
          <p className="mt-2 text-sm leading-6 text-(--color-muted)">
            Firma görüşmesi öncesinde {marketName} için yayınlanan ürün fiyatlarını kontrol edebilirsiniz.
          </p>
        </div>
        <Link href={`/hal/${marketSlug}`} className="rounded-[6px] bg-(--color-brand) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-white">
          Hal fiyatları
        </Link>
      </div>

      {prices.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {prices.slice(0, 6).map((price) => (
            <Link
              key={`${price.productSlug}-${price.marketSlug}-${price.recordedDate}`}
              href={`/urun/${price.productSlug}`}
              className="rounded-[6px] border border-(--color-border-soft) p-3 hover:border-(--color-brand)/45"
            >
              <span className="block text-sm font-semibold text-(--color-foreground)">{price.productName}</span>
              <span className="mt-1 block font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
                Ort. {formatPrice(price.avgPrice)}{price.recordedDate ? ` · ${price.recordedDate}` : ""}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[6px] border border-dashed border-(--color-border-soft) bg-(--color-bg-alt) p-4 text-sm leading-6 text-(--color-muted)">
          {city} hali için güncel fiyat satırı bekleniyor. Hal sayfası yayında; ETL verisi geldiğinde ürün fiyatları burada da görünecek.
        </div>
      )}

      {priceDate && (
        <p className="mt-3 font-(family-name:--font-mono) text-[11px] text-(--color-muted)">
          Son fiyat tarihi: {priceDate}
        </p>
      )}
    </section>
  );
}

function Info({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 text-(--color-foreground)">{value}</dd>
    </div>
  );
}

function buildMapQuery(...parts: Array<string | null | undefined>): string | null {
  const query = parts.filter(Boolean).join(", ");
  return query || null;
}

function formatPrice(value?: string | number | null): string {
  if (!value) return "-";
  return `${Number(value).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL`;
}
