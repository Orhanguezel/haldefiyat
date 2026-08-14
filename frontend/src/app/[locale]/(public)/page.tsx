export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { DATA_LICENSE_URL, getPageMetadata, ORG_REF } from "@/lib/seo";
import { fetchListings, fetchMarkets, fetchPrices, fetchPricesOverview, fetchProducts, fetchWidget } from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import LatestReports from "@/components/sections/LatestReports";
import HomeFaq from "@/components/sections/HomeFaq";
import type { Stat } from "@/components/sections/StatsBarClient";
import { schemaDateRange } from "@/lib/schema-dates";
import { fetchSiteSettings } from "@/lib/site-settings";

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
  license: DATA_LICENSE_URL,
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

  const [widget, markets, products, listings, overview, siteSettings, featuredPrices] = await Promise.all([
    fetchWidget({ limit: 30 }),
    fetchMarkets(),
    fetchProducts(undefined, undefined, { seoIndex: true }),
    fetchListings({ limit: 3 }),
    fetchPricesOverview(),
    fetchSiteSettings(locale),
    fetchPrices({ range: "1d", limit: 1 }),
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
    const { default: MobileHomeHero } = await import("@/components/sections/MobileHomeHero");
    return (
      <>
        <JsonLd type="Dataset" data={datasetSchema} />
        <MobileHomeHero locale={locale} products={overview.trackedProducts || products.length} markets={markets} widget={widget} activeMarkets={overview.activeMarkets} freshness={overview.freshness} featuredPrice={featuredPrices[0]} />
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

  // Koşullu sunucu importları mobil yanıtın desktop client adalarını preload
  // etmesini engeller. Bu sınır UA dalıyla aynı yerde tutulur ki iki ağaç
  // yeniden tek statik import grafiğinde birleşmesin.
  const [
    { default: HeroSection },
    { default: PriceDashboard },
    { default: CitySelector },
    { default: StatsBar },
    { default: IndexCta },
    { default: CtaNewsletter },
    { default: BannerSlot },
    { ListingCard },
  ] = await Promise.all([
    import("@/components/sections/HeroSection"),
    import("@/components/sections/PriceDashboard"),
    import("@/components/sections/CitySelector"),
    import("@/components/sections/StatsBar"),
    import("@/components/sections/IndexCta"),
    import("@/components/sections/CtaNewsletter"),
    import("@/components/ads/BannerSlot"),
    import("@/components/listings/ListingCard"),
  ]);

  return (
    <>
      <JsonLd type="Dataset" data={datasetSchema} />
      <HeroSection activeCities={overview.activeCities} targetCoverage={overview.targetCoverage} freshness={overview.freshness} featuredPrice={featuredPrices[0]} />
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
      <CtaNewsletter whatsappChannelUrl={siteSettings.social_whatsapp} />
    </>
  );
}
