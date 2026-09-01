import { fetchFeaturedPrice, fetchListings, fetchMarkets, fetchPricesOverview, fetchProducts, fetchWidget } from "@/lib/api";
import { fetchSiteSettings } from "@/lib/site-settings";
import { DATA_LICENSE_URL, getPageMetadata, ORG_REF } from "@/lib/seo";
import { schemaDateRange } from "@/lib/schema-dates";
import type { Stat } from "@/components/sections/StatsBarClient";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

const datasetSchemaBase = {
  name: "Türkiye Hal Fiyatları",
  description: "Türkiye genelindeki hal ve pazar fiyat verileri. Günlük güncellenir.",
  url: SITE_URL,
  creator: ORG_REF,
  license: DATA_LICENSE_URL,
  spatialCoverage: { "@type": "Place", name: "Türkiye" },
  variableMeasured: ["MinFiyat", "MaxFiyat", "OrtalamaFiyat"],
  isAccessibleForFree: true,
  measurementTechnique: "Resmi hal kaynaklarının yayın takvimine göre ETL ile derleme, ürün ve birim normalizasyonu",
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
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(date);
}

export function getHomeMetadata(locale: string) {
  return getPageMetadata("home", {
    locale,
    pathname: "/",
    title: "Türkiye Hal Fiyatları — Günlük, Gerçek Zamanlı",
    description: "Türkiye geneli hal ve pazar fiyatları tek ekranda. Sebze, meyve ve bakliyat fiyatlarını şehir ve kategori bazında karşılaştırın.",
  });
}

export async function loadHomePageData(locale: string) {
  const [widget, markets, products, listings, overview, siteSettings, featuredPrice] = await Promise.all([
    fetchWidget({ limit: 30 }),
    fetchMarkets(),
    fetchProducts(undefined, undefined, { seoIndex: true }),
    fetchListings({ limit: 3 }),
    fetchPricesOverview(),
    fetchSiteSettings(locale),
    fetchFeaturedPrice(),
  ]);
  const cityCount = overview.activeCities || new Set(
    markets
      .filter((market) => market.regionSlug !== "ulusal")
      .map((market) => market.cityName?.trim())
      .filter(Boolean),
  ).size;
  const latestMarketUpdate = overview.lastSourceDate ?? overview.latestRecordedDate ?? undefined;
  const datasetDates = schemaDateRange([overview.earliestRecordedDate, overview.latestRecordedDate]);
  const datasetSchema = {
    ...datasetSchemaBase,
    ...(datasetDates ? {
      temporalCoverage: datasetDates.temporalCoverage,
      dateModified: datasetDates.latest,
    } : latestMarketUpdate ? { dateModified: latestMarketUpdate } : {}),
  };
  const stats: Stat[] = [
    { kind: "number", value: cityCount || markets.length, label: "İl Kapsamı" },
    { kind: "number", value: overview.activeMarkets || markets.length, label: "Aktif Hal" },
    { kind: "number", value: overview.trackedProducts || products.length, label: "İzlenen Ürün" },
    { kind: "static", display: formatUpdatedAt(latestMarketUpdate), label: "Son Güncelleme" },
  ];

  return {
    widget,
    markets,
    listings,
    overview,
    siteSettings,
    featuredPrice: featuredPrice ?? undefined,
    cityCount,
    latestMarketUpdate,
    trackedProducts: overview.trackedProducts || products.length,
    datasetSchema,
    stats,
  };
}
