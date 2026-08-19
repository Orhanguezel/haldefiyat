import BannerSlot from "@/components/ads/BannerSlot";
import { ListingCard } from "@/components/listings/ListingCard";
import JsonLd from "@/components/seo/JsonLd";
import CitySelector from "@/components/sections/CitySelector";
import CtaNewsletter from "@/components/sections/CtaNewsletter";
import HeroSection from "@/components/sections/HeroSection";
import HomeFaq from "@/components/sections/HomeFaq";
import IndexCta from "@/components/sections/IndexCta";
import LatestReports from "@/components/sections/LatestReports";
import PriceDashboard from "@/components/sections/PriceDashboard";
import SeasonGuides from "@/components/sections/SeasonGuides";
import StatsBar from "@/components/sections/StatsBar";
import { loadHomePageData } from "@/lib/home-page-data";

export default async function DesktopHomePage({ locale }: { locale: string }) {
  const data = await loadHomePageData(locale);
  return (
    <>
      <JsonLd type="Dataset" data={data.datasetSchema} />
      <HeroSection activeCities={data.overview.activeCities} targetCoverage={data.overview.targetCoverage} freshness={data.overview.freshness} featuredPrice={data.featuredPrice} />
      <PriceDashboard />
      <BannerSlot position="home_mid" />
      <CitySelector locale={locale} />
      <StatsBar stats={data.stats} />
      <IndexCta />
      {data.listings.items.length ? (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">İlan vitrini</h2>
              <p className="mt-1 text-sm text-(--color-muted)">Üretici, komisyoncu ve alıcı ilanlarından güncel fırsatlar.</p>
            </div>
            <a href="/ilanlar" className="text-sm font-semibold text-(--color-brand)">Tümü</a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {data.listings.items.map((item) => <ListingCard key={item.id} item={item} compact />)}
          </div>
        </section>
      ) : null}
      <SeasonGuides />
      <LatestReports limit={6} />
      <HomeFaq
        activeCities={data.cityCount}
        activeMarkets={data.overview.activeMarkets || data.markets.length}
        trackedProducts={data.trackedProducts}
        latestRecordedDate={data.latestMarketUpdate}
      />
      <CtaNewsletter whatsappChannelUrl={data.siteSettings.social_whatsapp} />
    </>
  );
}
