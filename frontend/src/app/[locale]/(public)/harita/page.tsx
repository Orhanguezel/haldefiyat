export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { fetchCityPriceMap, fetchMarkets, fetchPricesOverview } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/seo/Breadcrumb";
import TurkeyMapClient from "@/components/sections/TurkeyMapClient";

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
    <main className="relative z-10 mx-auto max-w-[1400px] px-6 py-12 lg:px-8">
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: "Türkiye Fiyat Haritası", href: "/harita" },
      ]} />

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
            {overview.currentCities?.toLocaleString("tr-TR") ?? "—"} güncel şehir · {overview.activeMarkets?.toLocaleString("tr-TR") ?? "—"} aktif hal · {overview.freshness === "fresh" ? "veri güncel" : overview.freshness === "stale" ? "veri gecikmeli" : "tazelik bilinmiyor"} · <a href="/metodoloji" className="text-(--color-brand) hover:underline">metodoloji</a>
          </p>
        </div>
      </header>

      <div className="h-auto min-h-[720px]">
        <TurkeyMapClient markets={markets} cityPrices={cityPriceMap.items} />
      </div>
    </main>
  );
}
