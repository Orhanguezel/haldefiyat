export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchCityPriceMap, fetchMarkets, fetchPricesOverview } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/seo/Breadcrumb";
import TurkeyMapNoSsr from "@/components/sections/TurkeyMapNoSsr";
import MarketDataNav from "@/components/sections/MarketDataNav";
import { PUBLIC_METRICS, publicFreshnessLabel } from "@/lib/public-metrics";
import PageContainer from "@/components/layout/PageContainer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("harita", {
    locale,
    pathname: "/harita",
    title: "Türkiye İnteraktif Hal Fiyat Haritası",
    description:
      "Türkiye genelinde hal fiyat ortalamalarını renk skalasıyla karşılaştırın. Ucuzdan pahalıya Türkiye fiyat haritası.",
  });
}

export default async function HaritaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [markets, cityPriceMap, overview] = await Promise.all([
    fetchMarkets(),
    fetchCityPriceMap({ range: "7d" }),
    fetchPricesOverview(),
  ]);

  return (
    <PageContainer>
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: "Türkiye Fiyat Haritası", href: "/harita" },
      ]} />
      <MarketDataNav active="map" />

      <header className="mb-8 flex flex-col gap-3 border-b border-(--color-border-soft) pb-8">
        <div className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          İnteraktif Fiyat Haritası
        </div>
        <div className="max-w-3xl">
          <h1 className="font-(family-name:--font-display) text-3xl font-bold tracking-[-0.02em] text-(--color-foreground) sm:text-4xl">
            Türkiye Hal Fiyat Haritası
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-(--color-muted)">
            İller, 15 ürünlük sabit sepetle normalize edilmiş <strong className="text-(--color-foreground)">fiyat endeksine</strong> göre
            karşılaştırılır (Türkiye ortalaması = 1.00). Böylece farklı ürün karışımı raporlayan iller
            adil biçimde kıyaslanır — ham ortalama yanıltıcıdır. Bir ile tıklayarak hal sayısı, ürün
            kapsamı ve endeksini inceleyebilirsiniz.
          </p>
          <p className="mt-3 font-(family-name:--font-mono) text-xs text-(--color-muted)">
            {overview.currentCities?.toLocaleString("tr-TR") ?? "—"} {PUBLIC_METRICS.currentCities.label.toLocaleLowerCase("tr-TR")} · {overview.activeMarkets?.toLocaleString("tr-TR") ?? "—"} {PUBLIC_METRICS.activeMarkets.label.toLocaleLowerCase("tr-TR")} · {publicFreshnessLabel(overview.freshness).toLocaleLowerCase("tr-TR")} · <a href="/metodoloji" className="text-(--color-brand) underline underline-offset-2">metodoloji</a>
          </p>
        </div>
      </header>

      <div className="h-auto min-h-[720px]">
        <TurkeyMapNoSsr markets={markets} cityPrices={cityPriceMap.items} />
      </div>
    </PageContainer>
  );
}
