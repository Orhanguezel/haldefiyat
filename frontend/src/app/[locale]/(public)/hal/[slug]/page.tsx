export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { fetchPrices, fetchMarkets } from "@/lib/api";
import PriceTable from "@/components/ui/PriceTable";
import WeatherWidget from "@/components/sections/WeatherWidget";
import { cityToWeatherSlug } from "@/lib/weather";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const markets = await fetchMarkets();
  const market = markets.find((m) => m.slug === slug);

  if (!market) {
    return {
      title: "Hal Bulunamadı",
      description: "Aradığınız hal kaydı bulunamadı.",
    };
  }

  return {
    title: `${market.name} Hal Fiyatları`,
    description: `${market.name}, ${market.cityName} — güncel hal fiyatları ve ürün listesi.`,
    openGraph: {
      title: `${market.name} | HaldeFiyat`,
      description: `${market.name} (${market.cityName}) haline ait güncel sebze, meyve ve bakliyat fiyatları.`,
      type: "article",
      locale: "tr_TR",
    },
    alternates: { canonical: `/hal/${slug}` },
  };
}

export default async function HalPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [prices, markets] = await Promise.all([
    fetchPrices({ market: slug, range: "7d", limit: 100 }),
    fetchMarkets(),
  ]);

  const market = markets.find((m) => m.slug === slug);
  const latestDate = prices.length > 0
    ? prices.reduce((max, p) => (p.recordedDate > max ? p.recordedDate : max), prices[0]!.recordedDate)
    : null;

  if (!market) {
    return (
      <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-20">
        <div className="mx-auto max-w-xl rounded-[16px] border border-(--color-border) bg-(--color-surface) p-10 text-center">
          <div className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            404 — Hal Kaydı
          </div>
          <h1 className="mt-3 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
            Bu hal bulunamadı
          </h1>
          <p className="mt-2 text-[13px] text-(--color-muted)">
            Aradığınız hal kaldırılmış veya slug hatalı olabilir. Tüm haller
            listesinden seçim yapabilirsiniz.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/hal"
              className="rounded-[10px] bg-(--color-brand) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-navy) transition-opacity hover:opacity-90"
            >
              Tüm Haller
            </Link>
            <Link
              href="/fiyatlar"
              className="rounded-[10px] border border-(--color-border) px-4 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground) transition-colors hover:border-(--color-brand)"
            >
              Güncel Fiyatlar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isNational = market.regionSlug === "ulusal";
  const weatherSlug = isNational ? null : cityToWeatherSlug(market.cityName);

  if (isNational) {
    return (
      <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
              Ulusal Referans
            </span>
            <span className="rounded-full border border-(--color-brand)/30 bg-(--color-brand)/10 px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold text-(--color-brand)">
              hal.gov.tr
            </span>
          </div>
          <h1 className="mt-2 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
            {market.name}
          </h1>
          <p className="mt-1 text-sm text-(--color-muted)">
            {latestDate
              ? `${new Date(latestDate + "T12:00:00Z").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} fiyatları`
              : "Veri bekleniyor"}
          </p>
        </div>

        <div className="mb-8 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-5 text-[13px] text-(--color-muted) space-y-1.5">
          <p>
            <span className="font-semibold text-(--color-foreground)">Ulusal ortalama fiyatlar</span>{" "}
            — Türkiye genelindeki toptancı hallerden derlenen ağırlıklı ortalama.
            Şehir bazlı hal fiyatları için bölgesel sayfaları inceleyin.
          </p>
          <p>Veriler 1 gün gecikmeli güncellenir. Min/maks aralığı bu kaynakta mevcut değildir.</p>
        </div>

        <PriceTable initialPrices={prices} markets={markets} />
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <div className="mb-8">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          {market.cityName}
          {market.regionSlug ? ` · ${market.regionSlug}` : ""}
        </span>
        <h1 className="mt-1 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
          {market.name}
        </h1>
        <p className="mt-1 text-sm text-(--color-muted)">
          Kaynak: {market.sourceKey ?? "manuel"}
          {latestDate ? ` · ${new Date(latestDate + "T12:00:00Z").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} fiyatları` : ""}
        </p>
      </div>

      {/* Hava durumu — sadece eslesen sehirler icin */}
      {weatherSlug && (
        <div className="mb-8">
          <WeatherWidget citySlug={weatherSlug} cityName={market.cityName} />
        </div>
      )}

      <PriceTable initialPrices={prices} markets={markets} />
    </main>
  );
}
