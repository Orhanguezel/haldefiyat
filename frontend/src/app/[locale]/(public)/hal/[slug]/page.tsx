export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { fetchPrices, fetchMarkets } from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PriceTable from "@/components/ui/PriceTable";
import WeatherWidget from "@/components/sections/WeatherWidget";
import { cityToWeatherSlug } from "@/lib/weather";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; slug: string }> };

const MARKET_PRICE_RANGE = "3650d";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const markets = await fetchMarkets();
  const market = markets.find((m) => m.slug === slug);

  if (!market) {
    return {
      title: "Hal Bulunamadı",
      description: "Aradığınız hal kaydı bulunamadı.",
    };
  }

  return getPageMetadata("hal", {
    locale,
    pathname: `/hal/${slug}`,
    vars: {
      name: market.name,
      city: market.cityName,
      slug,
    },
    title: `${market.name} Hal Fiyatları`,
    description: `${market.name}, ${market.cityName} — güncel hal fiyatları ve ürün listesi.`,
    openGraph: {
      title: `${market.name} | HaldeFiyat`,
      description: `${market.name} (${market.cityName}) haline ait güncel sebze, meyve ve bakliyat fiyatları.`,
      type: "article",
      locale: "tr_TR",
    },
  });
}

export default async function HalPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [prices, markets] = await Promise.all([
    fetchPrices({ market: slug, range: MARKET_PRICE_RANGE, limit: 500 }),
    fetchMarkets(),
  ]);

  const market = markets.find((m) => m.slug === slug);
  const sourceKey = market?.sourceKey ?? null;
  const isAntalyaSource = sourceKey?.startsWith("antalya_") ?? slug.startsWith("antalya-hal-");
  const antalyaMerkez = isAntalyaSource
    ? markets.find((m) => m.slug === "antalya-hal-merkez")
    : null;
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
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

  const placeSchema = {
    name: market.name,
    description: `${market.name} — ${market.cityName} güncel hal ve toptancı pazar fiyatları.`,
    url: `${SITE_URL}/hal/${slug}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: market.cityName,
      addressCountry: "TR",
    },
  } satisfies Record<string, unknown>;

  const breadcrumbItems = [
    { name: "Anasayfa", href: "/" },
    { name: "Haller", href: "/hal" },
    { name: market.name, href: `/hal/${slug}` },
  ];

  if (isNational) {
    return (
      <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
        <JsonLd type="Place" data={placeSchema} />
        <Breadcrumb items={breadcrumbItems} />
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

        <PriceTable
          key={slug}
          initialPrices={prices}
          markets={markets}
          requestParams={{ market: slug, range: MARKET_PRICE_RANGE }}
        />
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto max-w-[1400px] px-8 py-12">
      <JsonLd type="Place" data={placeSchema} />
      <Breadcrumb items={breadcrumbItems} />
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

      {prices.length === 0 && (
        <div className="mb-6 rounded-[14px] border border-amber-400/30 bg-amber-400/8 p-5 text-sm text-amber-100">
          <p className="font-semibold text-amber-50">Bu hal için kaynak bugün fiyat yayınlamıyor.</p>
          <p className="mt-1 text-amber-100/80">
            ETL kaynağı çalışıyor ancak {market.name} için sayısal fiyat yerine
            “Fiyat Bekleniyor” veya “Mevcut Değil” cevabı geliyor. Veri kaynağı
            yeniden fiyat yayınladığında kayıtlar otomatik olarak görünür.
          </p>
          {antalyaMerkez && antalyaMerkez.slug !== market.slug && (
            <Link
              href={`/hal/${antalyaMerkez.slug}`}
              className="mt-4 inline-flex rounded-[10px] border border-amber-300/35 px-3 py-2 font-(family-name:--font-mono) text-[12px] font-semibold text-amber-50 transition-colors hover:border-amber-200"
            >
              Antalya merkez fiyatlarına bak
            </Link>
          )}
        </div>
      )}

      <PriceTable
        key={slug}
        initialPrices={prices}
        markets={markets}
        requestParams={{ market: slug, range: MARKET_PRICE_RANGE }}
      />

      {/* Editoryal içerik — AI alıntılanabilirlik + E-E-A-T */}
      <div className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5 text-sm leading-relaxed text-muted space-y-3">
        <h2 className="text-base font-semibold text-foreground">
          {market.name} Hakkında
        </h2>
        <p>
          <strong className="text-foreground">{market.name}</strong>, {market.cityName} iline bağlı resmi toptancı hal müdürlüğünden derlenen günlük fiyat verilerini içermektedir.
          Fiyatlar; sebze, meyve ve bakliyat kategorilerinde minimum, maksimum ve ortalama değerler olarak sunulmaktadır.
        </p>
        <p>
          Veriler, belediye hal müdürlüğünün resmi sistemi ve{" "}
          <a href="https://hal.gov.tr" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">hal.gov.tr</a>{" "}
          üzerinden otomatik olarak çekilmekte; her gün TSİ 06:15'te güncellenmektedir.
        </p>
        <p>
          Diğer illerdeki hal fiyatlarıyla karşılaştırma yapmak için{" "}
          <a href="/karsilastirma" className="text-brand hover:underline">fiyat karşılaştırma</a>{" "}
          aracını kullanabilirsiniz.
        </p>
      </div>
    </main>
  );
}
