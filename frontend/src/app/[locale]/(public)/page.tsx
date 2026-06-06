export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { getPageMetadata, ORG_REF } from "@/lib/seo";
import { fetchListings, fetchMarkets, fetchPricesOverview, fetchProducts, fetchWidget, type TrendingItem } from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import HeroSection from "@/components/sections/HeroSection";
import PriceTicker from "@/components/sections/PriceTicker";
import PriceDashboard from "@/components/sections/PriceDashboard";
import CitySelector from "@/components/sections/CitySelector";
import StatsBar from "@/components/sections/StatsBar";
import FeaturesGrid from "@/components/sections/FeaturesGrid";
import HowItWorks from "@/components/sections/HowItWorks";
import CtaNewsletter from "@/components/sections/CtaNewsletter";
import IndexCta from "@/components/sections/IndexCta";
import SeasonalGuide from "@/components/sections/SeasonalGuide";
import HomeFaq from "@/components/sections/HomeFaq";
import MobileHomeHero from "@/components/sections/MobileHomeHero";
import type { Stat } from "@/components/sections/StatsBarClient";
import { ListingCard } from "@/components/listings/ListingCard";

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
const datasetSchema = {
  name: "Türkiye Hal Fiyatları",
  description:
    "Türkiye genelindeki hal ve pazar fiyat verileri. Günlük güncellenir.",
  url: SITE_URL,
  creator: ORG_REF,
  license: "https://creativecommons.org/licenses/by/4.0/",
  temporalCoverage: "2025/..",
  spatialCoverage: { "@type": "Place", name: "Türkiye" },
  variableMeasured: ["MinFiyat", "MaxFiyat", "OrtalamaFiyat"],
  isAccessibleForFree: true,
} satisfies Record<string, unknown>;

function formatUpdatedAt(value: string | undefined): string {
  if (!value) return "Bugün";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Bugün";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Ticker: trending (uç değişimler) yerine widget verisi (popüler ürünler,
  // makul haftalık değişim). previous = avgPrice / (1 + changePct/100).
  const [widget, markets, products, listings, overview] = await Promise.all([
    fetchWidget({ limit: 30 }),
    fetchMarkets(),
    fetchProducts(undefined, undefined, { seoIndex: true }),
    fetchListings({ limit: 3 }),
    fetchPricesOverview(),
  ]);
  const trending: TrendingItem[] = widget
    .filter((w) => w.changePct !== null && Number.isFinite(w.avgPrice) && w.avgPrice > 0)
    .map((w, i) => {
      const pct = w.changePct as number;
      const previous = pct !== 0 ? w.avgPrice / (1 + pct / 100) : w.avgPrice;
      return {
        productId: i + 1,
        marketId: 0,
        changePct: pct,
        latest: w.avgPrice,
        previous,
        product: {
          id: i + 1,
          slug: w.productSlug,
          nameTr: w.productName,
          categorySlug: w.categorySlug,
        },
      };
    });
  const cityCount = overview.activeCities || new Set(
    markets
      .filter((market) => market.regionSlug !== "ulusal")
      .map((market) => market.cityName?.trim())
      .filter(Boolean),
  ).size;
  const latestMarketUpdate = overview.lastSourceDate ?? overview.latestRecordedDate ?? undefined;
  const stats: Stat[] = [
    {
      kind: "number",
      value: cityCount || markets.length,
      label: "İl Kapsamı",
    },
    {
      kind: "number",
      value: markets.length,
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

  return (
    <>
      <JsonLd type="Dataset" data={datasetSchema} />
      <MobileHomeHero locale={locale} products={products.length} markets={markets} widget={widget} />
      <div className="hidden md:block">
        <HeroSection activeCities={overview.activeCities} targetCoverage={overview.targetCoverage} />
        <PriceTicker items={trending} />
        <PriceDashboard />
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
        <SeasonalGuide />
        <FeaturesGrid activeCities={overview.activeCities} targetCoverage={overview.targetCoverage} />
        <HowItWorks />
        <HomeFaq />
        <CtaNewsletter />
      </div>
    </>
  );
}
