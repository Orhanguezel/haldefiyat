import JsonLd from "@/components/seo/JsonLd";
import HomeFaq from "@/components/sections/HomeFaq";
import LatestReports from "@/components/sections/LatestReports";
import MobileHomeHero from "@/components/sections/MobileHomeHero";
import { loadHomePageData } from "@/lib/home-page-data";

export default async function MobileHomePage({ locale }: { locale: string }) {
  const data = await loadHomePageData(locale);
  return (
    <>
      <JsonLd type="Dataset" data={data.datasetSchema} />
      <MobileHomeHero
        locale={locale}
        products={data.trackedProducts}
        markets={data.markets}
        widget={data.widget}
        activeMarkets={data.overview.activeMarkets}
        freshness={data.overview.freshness}
        featuredPrice={data.featuredPrice}
      />
      <LatestReports limit={6} />
      <HomeFaq
        activeCities={data.cityCount}
        activeMarkets={data.overview.activeMarkets || data.markets.length}
        trackedProducts={data.trackedProducts}
        latestRecordedDate={data.latestMarketUpdate}
      />
    </>
  );
}
