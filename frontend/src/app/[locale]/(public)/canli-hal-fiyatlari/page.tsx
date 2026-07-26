import Link from "next/link";
import { productHref } from "@/lib/product-links";
import { setRequestLocale } from "next-intl/server";
import { Bell, Clock3, MapPin, Newspaper, TrendingDown, TrendingUp } from "lucide-react";
import { fetchMarkets, fetchPricesOverview, fetchProducts, fetchWidget } from "@/lib/api";
import { getPageMetadata, ORG_REF } from "@/lib/seo";
import { schemaDateRange } from "@/lib/schema-dates";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import LivePriceNewsletter from "@/components/sections/LivePriceNewsletter";

type Props = { params: Promise<{ locale: string }> };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

const cityLinks = [
  { label: "Antalya", href: "/hal/antalya-hal-merkez" },
  { label: "İstanbul", href: "/hal?city=istanbul" },
  { label: "İzmir", href: "/hal?city=izmir" },
  { label: "Ankara", href: "/hal?city=ankara" },
  { label: "Mersin", href: "/hal?city=mersin" },
  { label: "Bursa", href: "/hal?city=bursa" },
];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const overview = await fetchPricesOverview();
  const coverageTitle = overview.activeMarkets
    ? ` — ${overview.activeMarkets.toLocaleString("tr-TR")} Aktif Hal`
    : "";

  return getPageMetadata("canli_hal_fiyatlari", {
    locale,
    pathname: "/canli-hal-fiyatlari",
    title: `Canlı Hal Fiyatları 2026${coverageTitle}`,
    description:
      "Türkiye geneli canlı hal fiyatları, günlük güncellenen sebze ve meyve fiyatları, şehir karşılaştırmaları ve ücretsiz haftalık fiyat bülteni.",
  });
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function LiveMarketPricesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [widget, markets, products, overview] = await Promise.all([
    fetchWidget({ limit: 12 }),
    fetchMarkets(),
    fetchProducts(undefined, undefined, { seoIndex: true }),
    fetchPricesOverview(),
  ]);
  const datasetDates = schemaDateRange([
    overview.earliestRecordedDate,
    overview.latestRecordedDate,
  ]);

  const updatedAt = datasetDates
    ? new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${datasetDates.latest}T00:00:00Z`))
    : "Veri tarihi bilinmiyor";
  const activeMarketCount = overview.activeMarkets || markets.length;
  const trackedProductCount = overview.trackedProducts || products.length;

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Canlı Türkiye Hal Fiyatları",
    description: "Türkiye toptancı halleri için günlük sebze ve meyve fiyat verisi.",
    url: `${SITE_URL}/canli-hal-fiyatlari`,
    creator: ORG_REF,
    license: "https://creativecommons.org/licenses/by/4.0/",
    ...(datasetDates ? {
      temporalCoverage: datasetDates.temporalCoverage,
      dateModified: datasetDates.latest,
    } : {}),
    spatialCoverage: { "@type": "Country", name: "Türkiye" },
    variableMeasured: ["Ortalama fiyat", "Günlük değişim", "Hal", "Ürün"],
    isAccessibleForFree: true,
    measurementTechnique:
      "Resmi hal kaynaklarından günlük ETL ile derleme, ürün ve birim normalizasyonu",
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE_URL}/api/v1/prices`,
    },
  } satisfies Record<string, unknown>;

  return (
    <main className="min-h-screen bg-(--color-background)">
      <JsonLd type="Dataset" data={datasetSchema} />

      <section className="border-b border-(--color-border) bg-(--color-surface)">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-14">
          <div className="flex min-w-0 flex-col justify-center">
            <Breadcrumb visible items={[
              { name: "Anasayfa", href: "/" },
              { name: "Canlı Hal Fiyatları", href: "/canli-hal-fiyatlari" },
            ]} />
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-(--color-brand)/35 bg-(--color-brand)/10 px-3 py-1 text-[12px] font-semibold text-(--color-brand)">
              <Clock3 className="h-3.5 w-3.5" />
              Son veri: {updatedAt}
            </div>
            <h1
              className="max-w-3xl text-[34px] font-black leading-[1.05] tracking-normal text-(--color-foreground) sm:text-[48px] lg:text-[58px]"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              Türkiye canlı hal fiyatları
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-7 text-(--color-muted) sm:text-[18px]">
              {activeMarketCount
                ? `${activeMarketCount.toLocaleString("tr-TR")} aktif haldeki sebze ve meyve fiyatlarını`
                : "Yayımlanan sebze ve meyve hal fiyatlarını"} ürün, şehir ve değişim yüzdesiyle takip edin. Haftalık bülteni alıp fiyat hareketlerini kaçırmayın.
            </p>
            <div className="mt-7 grid max-w-2xl grid-cols-3 gap-3">
              <Kpi label="Ürün" value={trackedProductCount || "—"} />
              <Kpi label="Aktif hal" value={activeMarketCount || "—"} />
              <Kpi label="Son veri" value={updatedAt} small />
            </div>
          </div>

          <LivePriceNewsletter />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
              Popüler ürünlerde bugün
            </h2>
            <p className="mt-1 text-[14px] text-(--color-muted)">
              Ortalama toptan fiyat ve son değişim.
            </p>
          </div>
          <Link href="/fiyatlar" className="hidden text-[14px] font-semibold text-(--color-brand) sm:inline">
            Tüm fiyatlar
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {widget.slice(0, 12).map((item) => {
            const change = item.changePct ?? 0;
            const up = change >= 0;
            return (
              <Link
                key={item.productSlug}
                href={productHref(item)}
                className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-brand)/55"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-bold text-(--color-foreground)">{item.productName}</div>
                    <div className="mt-1 text-[12px] uppercase text-(--color-muted)">{item.categorySlug}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold ${up ? "bg-(--color-success)/10 text-(--color-success)" : "bg-(--color-danger)/10 text-(--color-danger)"}`}>
                    {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {Math.abs(change).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-4 text-[22px] font-black text-(--color-foreground)">
                  {formatPrice(item.avgPrice)}
                </div>
                <div className="mt-1 text-[12px] text-(--color-muted)">/{item.unit}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-(--color-border) bg-(--color-surface)">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <h2 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
              Şehrini seç, hali takip et
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-(--color-muted)">
              Bölgesel fiyat farklarını hızlıca karşılaştırın; en çok takip edilen hallere tek dokunuşla geçin.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cityLinks.map((city) => (
              <Link
                key={city.label}
                href={city.href}
                className="flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-background) px-4 py-3 text-[14px] font-semibold text-(--color-foreground) hover:border-(--color-brand)/55"
              >
                <MapPin className="h-4 w-4 text-(--color-brand)" />
                {city.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
        <Link href="/uyarilar" className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5 hover:border-(--color-brand)/55">
          <Bell className="mb-4 h-6 w-6 text-(--color-brand)" />
          <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">Fiyat alarmı kur</h2>
          <p className="mt-2 text-[14px] leading-6 text-(--color-muted)">Ürün hedef fiyata geldiğinde e-posta, Telegram veya Web Push ile haber alın.</p>
        </Link>
        <Link href="/analiz" className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5 hover:border-(--color-brand)/55">
          <Newspaper className="mb-4 h-6 w-6 text-(--color-brand)" />
          <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">Haftalık piyasa özeti</h2>
          <p className="mt-2 text-[14px] leading-6 text-(--color-muted)">Sebze ve meyvede haftanın öne çıkan fiyat hareketlerini tek ekranda okuyun.</p>
        </Link>
      </section>
    </main>
  );
}

function Kpi({ label, value, small = false }: { label: string; value: number | string; small?: boolean }) {
  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-background) p-3">
      <div className={`${small ? "text-[15px]" : "text-[24px]"} font-black text-(--color-foreground)`}>{value}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase text-(--color-muted)">{label}</div>
    </div>
  );
}
