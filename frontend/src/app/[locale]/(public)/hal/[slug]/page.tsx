export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { fetchPrices, fetchMarkets, fetchFirms } from "@/lib/api";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PriceTable from "@/components/ui/PriceTable";
import WeatherWidget from "@/components/sections/WeatherWidget";
import { cityToWeatherSlug } from "@/lib/weather";
import { getPageMetadata } from "@/lib/seo";
import { getMarketEditorial } from "@/lib/market-content";
import FirmCard from "@/components/firms/FirmCard";

type Props = { params: Promise<{ locale: string; slug: string }> };

const MARKET_PRICE_RANGE = "3650d";

function citySlug(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const markets = await fetchMarkets();
  const market = markets.find((m) => m.slug === slug);

  if (!market) {
    notFound();
  }

  // Index: seoIndex açık VE özgün (elle yazılmış) editoryel içerik var.
  // Kategori-şablon fallback'e düşen hal (thin/duplicate) noindex kalır.
  const editorial = getMarketEditorial({
    slug,
    name: market.name,
    cityName: market.cityName,
    regionSlug: market.regionSlug,
  });
  const isMarketSeoIndexed = market.seoIndex === true || market.seoIndex === 1;
  const shouldIndex = isMarketSeoIndexed && editorial.source !== "template";

  return getPageMetadata("hal", {
    locale,
    pathname: `/hal/${slug}`,
    vars: {
      name: market.name,
      city: market.cityName,
      slug,
    },
    title: `${market.name} Hal Fiyatları`,
    description: `${market.cityName} ${market.name} günlük sebze, meyve ve bakliyat fiyatları. Belediye hal müdürlüğü resmi verileri, her gün TSİ 06:15 güncellenir. Min/ort/maks fiyat karşılaştırması.`,
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${market.name} Güncel Hal Fiyatları | HaldeFiyat`,
      description: `${market.cityName} ${market.name} günlük sebze, meyve ve bakliyat fiyatları. Resmi belediye verileri — her gün güncellenir.`,
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
    notFound();
  }

  const isNational = market.regionSlug === "ulusal";
  const weatherSlug = isNational ? null : cityToWeatherSlug(market.cityName);
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");
  const marketFirms = isNational
    ? { items: [] }
    : await fetchFirms({ city: citySlug(market.cityName), type: "komisyoncu", limit: 6 });

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

      {marketFirms.items.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-(--color-border-soft) pb-3">
            <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
              Bu Haldeki Firmalar
            </h2>
            <Link href={`/firmalar?city=${encodeURIComponent(citySlug(market.cityName))}`} className="font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand)">
              Tüm firmalar
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {marketFirms.items.map((firm) => (
              <FirmCard key={firm.id} firm={firm} compact />
            ))}
          </div>
        </section>
      )}

      {/* Editoryal içerik — AI alıntılanabilirlik + E-E-A-T */}
      {(() => {
        const editorial = getMarketEditorial({ slug, name: market.name, cityName: market.cityName, regionSlug: market.regionSlug });
        return (
          <div className="mt-8 rounded-xl border border-border bg-surface/50 px-6 py-5 text-sm leading-relaxed text-muted space-y-3">
            <h2 className="text-base font-semibold text-foreground">{market.name} Hakkında</h2>
            <p>{editorial.description}</p>
            <p><strong className="text-foreground">Kapsama alanı:</strong> {editorial.coverage}</p>
            <p><strong className="text-foreground">Öne çıkan ürünler:</strong> {editorial.specialties}</p>
            <p>
              Veriler, belediye hal müdürlüğünün resmi sistemi ve{" "}
              <a href="https://hal.gov.tr" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">hal.gov.tr</a>{" "}
              üzerinden otomatik çekilmekte; her gün TSİ 06:15'te güncellenmektedir.
              Diğer illerle kıyaslamak için{" "}
              <a href="/karsilastirma" className="text-brand hover:underline">fiyat karşılaştırma</a>{" "}
              aracını kullanabilirsiniz.
            </p>
          </div>
        );
      })()}
    </main>
  );
}
