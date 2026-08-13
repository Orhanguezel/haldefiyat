export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { getPageMetadata, ORG_REF } from "@/lib/seo";
import { fetchListings, fetchMarkets, fetchPricesOverview, fetchProducts, fetchWidget } from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import HeroSection from "@/components/sections/HeroSection";
import PriceDashboard from "@/components/sections/PriceDashboard";
import CitySelector from "@/components/sections/CitySelector";
import StatsBar from "@/components/sections/StatsBar";
import CtaNewsletter from "@/components/sections/CtaNewsletter";
import IndexCta from "@/components/sections/IndexCta";
import LatestReports from "@/components/sections/LatestReports";
import HomeFaq from "@/components/sections/HomeFaq";
import MobileHomeHero from "@/components/sections/MobileHomeHero";
import BannerSlot from "@/components/ads/BannerSlot";
import type { Stat } from "@/components/sections/StatsBarClient";
import { ListingCard } from "@/components/listings/ListingCard";
import { schemaDateRange } from "@/lib/schema-dates";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("home", {
    locale,
    pathname: "/",
    title: "Türkiye Hal Fiyatları — Günlük, Gerçek Zamanlı",
    description:
      "Türkiye geneli hal ve pazar fiyatları tek ekranda. Sebze, meyve ve bakliyat fiyatlarını şehir ve kategori bazında karşılaştırın.",
  });
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

// Organization + WebSite schema TEK kaynakta (public/layout.tsx) uretilir ve
// DB site_settings'ten beslenir. Burada tekrar uretmek marka kimligini cakistirir
// (rapor: CRITICAL duplicate schema). Dataset.creator kanonik Organization'a @id
// ile referans verir — isim hardcode edilmez.
const datasetSchemaBase = {
  name: "Türkiye Hal Fiyatları",
  description:
    "Türkiye genelindeki hal ve pazar fiyat verileri. Günlük güncellenir.",
  url: SITE_URL,
  creator: ORG_REF,
  license: "https://creativecommons.org/licenses/by/4.0/",
  spatialCoverage: { "@type": "Place", name: "Türkiye" },
  variableMeasured: ["MinFiyat", "MaxFiyat", "OrtalamaFiyat"],
  isAccessibleForFree: true,
  measurementTechnique:
    "Resmi hal kaynaklarının yayın takvimine göre ETL ile derleme, ürün ve birim normalizasyonu",
  distribution: {
    "@type": "DataDownload",
    encodingFormat: "application/json",
    contentUrl: `${SITE_URL}/api/v1/prices`,
  },
} satisfies Record<string, unknown>;

function formatUpdatedAt(value: string | undefined): string {
  if (!value) return "Bilinmiyor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bilinmiyor";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Cihaz-bazlı sunucu render (sayfa force-dynamic → cache zehirlenmesi yok).
  // Mobil UA'ya masaüstü ağacı HİÇ gönderilmez: eskiden `hidden md:block` ile
  // gizlenip yine de indirilip hydrate ediliyordu (~1MB HTML / 505KB RSC) ve
  // mobil FCP/LCP'yi şişiriyordu. Googlebot Smartphone mobil ağacı görür; SEO
  // metin bölümleri (rehber/SSS) mobil ağaçta da render edilir.
  const ua = (await headers()).get("user-agent") ?? "";
  const isMobile = /Android|iPhone|iPod|Mobi|IEMobile|Opera Mini|BlackBerry/i.test(ua);

  const [widget, markets, products, listings, overview] = await Promise.all([
    fetchWidget({ limit: 30 }),
    fetchMarkets(),
    fetchProducts(undefined, undefined, { seoIndex: true }),
    fetchListings({ limit: 3 }),
    fetchPricesOverview(),
  ]);
  const cityCount = overview.activeCities || new Set(
    markets
      .filter((market) => market.regionSlug !== "ulusal")
      .map((market) => market.cityName?.trim())
      .filter(Boolean),
  ).size;
  const latestMarketUpdate = overview.lastSourceDate ?? overview.latestRecordedDate ?? undefined;
  const datasetDates = schemaDateRange([
    overview.earliestRecordedDate,
    overview.latestRecordedDate,
  ]);
  const datasetSchema = {
    ...datasetSchemaBase,
    ...(datasetDates ? {
      temporalCoverage: datasetDates.temporalCoverage,
      dateModified: datasetDates.latest,
    } : latestMarketUpdate ? { dateModified: latestMarketUpdate } : {}),
  };
  const stats: Stat[] = [
    {
      kind: "number",
      value: cityCount || markets.length,
      label: "İl Kapsamı",
    },
    {
      kind: "number",
      value: overview.activeMarkets || markets.length,
      label: "Aktif Hal",
    },
    {
      kind: "number",
      value: overview.trackedProducts || products.length,
      label: "İzlenen Ürün",
    },
    {
      kind: "static",
      display: formatUpdatedAt(latestMarketUpdate),
      label: "Son Güncelleme",
    },
  ];

  if (isMobile) {
    return (
      <>
        <JsonLd type="Dataset" data={datasetSchema} />
        <MobileHomeHero locale={locale} products={overview.trackedProducts || products.length} markets={markets} widget={widget} activeMarkets={overview.activeMarkets} freshness={overview.freshness} />
        {/* Ana görevden sonra yalnız güncel içerik ve güven/SSS kalır. */}
        <LatestReports limit={6} />
        <HomeFaq
          activeCities={cityCount}
          activeMarkets={overview.activeMarkets || markets.length}
          trackedProducts={overview.trackedProducts || products.length}
          latestRecordedDate={latestMarketUpdate}
        />
      </>
    );
  }

  return (
    <>
      <JsonLd type="Dataset" data={datasetSchema} />
      <HeroSection activeCities={overview.activeCities} targetCoverage={overview.targetCoverage} freshness={overview.freshness} />
      <PriceDashboard />
      {/* "Bugünkü Hal Fiyatları" bölümünün hemen altındaki reklam */}
      <BannerSlot position="home_mid" />
      <CitySelector locale={locale} />
      <StatsBar stats={stats} />
      <IndexCta />
      {listings.items.length ? (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">İlan vitrini</h2>
              <p className="mt-1 text-sm text-(--color-muted)">Üretici, komisyoncu ve alıcı ilanlarından güncel fırsatlar.</p>
            </div>
            <a href="/ilanlar" className="text-sm font-semibold text-(--color-brand)">Tümü</a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {listings.items.map((item) => <ListingCard key={item.id} item={item} compact />)}
          </div>
        </section>
      ) : null}
      <LatestReports limit={6} />
      <HomeFaq
        activeCities={cityCount}
        activeMarkets={overview.activeMarkets || markets.length}
        trackedProducts={overview.trackedProducts || products.length}
        latestRecordedDate={latestMarketUpdate}
      />
      <CtaNewsletter />
    </>
  );
}
