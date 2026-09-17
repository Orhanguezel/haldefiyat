import { fetchFeaturedPrice, fetchListings, fetchMarkets, fetchPricesOverview, fetchProducts, fetchWidget } from "@/lib/api";
import { fetchSiteSettings } from "@/lib/site-settings";
import { DATA_LICENSE_URL, getPageMetadata, ORG_REF, WEBSITE_REF } from "@/lib/seo";
import { schemaDateRange } from "@/lib/schema-dates";
import type { Stat } from "@/components/sections/StatsBarClient";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

const datasetSchemaBase = {
  "@id": `${SITE_URL}/#dataset`,
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

// Sesli asistanlar ve AI ozetleri icin okunacak bolumler: baslik + hero aciklamasi.
const HOME_SPEAKABLE_SELECTORS = ["h1", "[data-speakable]"];

function formatUpdatedAt(value: string | undefined): string {
  if (!value) return "Bilinmiyor";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bilinmiyor";
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(date);
}

/**
 * Aciklama KOKEN cumlesiyle baslar, ozellik cumlesi ikinci sirada.
 *
 * 17 Eyl 2026 AI gorunurluk olcumu: "hal fiyatlarini en guvenilir hangi site
 * takip ediyor" sorusunda rakipler verinin NEREDEN geldigini anlatan cumlelerle
 * anildi (tarimpiyasa: "Bakanliga bagli hal mudurlukleri her is gunu ilan
 * eder"), biz /fiyatlar og:description'indaki OZELLIK cumlesiyle ucuncu sirada
 * kaldik ("sehir, kategori ve tarihe gore filtreleyin"). Koken bilgisi zaten
 * llms.txt ve /metodoloji'de vardi, ozet alinan yerde yoktu.
 *
 * Sayilar canli overview'dan gelir; DB'deki seo_pages metni {{...}} ile doldurur.
 */
export async function getHomeMetadata(locale: string) {
  const overview = await fetchPricesOverview();
  return getPageMetadata("home", {
    locale,
    pathname: "/",
    vars: originVars(overview),
    title: "Türkiye Hal Fiyatları — Günlük, Gerçek Zamanlı",
    description: `Resmi hal müdürlükleri ve ticaret borsalarından derlenen günlük toptan fiyatlar: ${originVars(overview).marketCount} hal, ${originVars(overview).sourceCount} kaynak, ${originVars(overview).sinceYear}'ten beri. Şehir ve kategori bazında karşılaştırın.`,
  });
}

/** seo_pages metnindeki {{marketCount}} {{sourceCount}} {{sinceYear}} {{productCount}} yer tutuculari. */
export function originVars(overview: { activeMarkets?: number; activeSources?: number; trackedProducts?: number; earliestRecordedDate?: string | null }) {
  return {
    marketCount: String(overview.activeMarkets ?? 58),
    sourceCount: String(overview.activeSources ?? 45),
    productCount: (overview.trackedProducts ?? 0).toLocaleString("tr-TR"),
    sinceYear: (overview.earliestRecordedDate ?? "2004-01-01").slice(0, 4),
  };
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
  const webPageSchema = {
    "@id": `${SITE_URL}/#webpage`,
    url: SITE_URL,
    name: "Türkiye Hal Fiyatları — Günlük, Gerçek Zamanlı",
    inLanguage: "tr",
    isPartOf: WEBSITE_REF,
    about: ORG_REF,
    mainEntity: { "@id": `${SITE_URL}/#dataset` },
    ...(latestMarketUpdate ? { dateModified: latestMarketUpdate } : {}),
    speakable: { "@type": "SpeakableSpecification", cssSelector: HOME_SPEAKABLE_SELECTORS },
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
    webPageSchema,
    stats,
  };
}
