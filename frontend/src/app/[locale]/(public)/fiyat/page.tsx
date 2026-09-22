import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, MapPin } from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import PageContainer from "@/components/layout/PageContainer";
import FreshnessBadge from "@/components/ui/FreshnessBadge";
import { fetchCityProductPairs, type CityProductPair } from "@/lib/api";
import { formatDateTr } from "@/lib/date-format";
import { getPageMetadata } from "@/lib/seo";
import { sectionOgImage } from "@/lib/og-sections";

// Bolum kok sayfasi. /fiyat/<sehir>/<urun> altinda 450+ sayfa vardi ama /fiyat
// 404 donuyordu (Tanitio katalogu 17 Eyl 2026, Bulgu 4): alt sayfalar hub'siz,
// gövdeden link almadan duruyordu. Liste sitemap'le ayni kaynaktan gelir.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

type CityGroup = { citySlug: string; cityName: string; marketName: string; pairs: CityProductPair[] };

function groupByCity(pairs: CityProductPair[]): CityGroup[] {
  const groups = new Map<string, CityGroup>();
  for (const pair of pairs) {
    const group = groups.get(pair.citySlug) ?? { citySlug: pair.citySlug, cityName: pair.cityName, marketName: pair.marketName, pairs: [] };
    group.pairs.push(pair);
    groups.set(pair.citySlug, group);
  }
  for (const group of groups.values()) {
    group.pairs.sort((a, b) => b.searchVolume - a.searchVolume || a.productName.localeCompare(b.productName, "tr"));
  }
  return [...groups.values()].sort((a, b) => b.pairs.length - a.pairs.length || a.cityName.localeCompare(b.cityName, "tr"));
}

function latestDate(pairs: CityProductPair[]): string {
  return pairs.reduce((max, pair) => (pair.lastDate > max ? pair.lastDate : max), "");
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const pairs = await fetchCityProductPairs({ eligible: true });
  const groups = groupByCity(pairs);
  const cities = groups.slice(0, 3).map((group) => group.cityName).join(", ");
  return getPageMetadata("fiyat-index", {
    locale,
    pathname: "/fiyat",
    openGraph: { images: [sectionOgImage("fiyat")] },
    title: `Şehir Şehir Hal Fiyatları — ${groups.length} İl, ${pairs.length} Ürün Sayfası`,
    description: `${cities} dahil ${groups.length} ilin toptancı hal bülteninden ürün bazlı güncel fiyat sayfaları. Her sayfada o halin son kaydı, 90 günlük seyir ve Türkiye kıyası.`,
  });
}

export default async function FiyatIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const pairs = await fetchCityProductPairs({ eligible: true });
  const groups = groupByCity(pairs);
  const newest = latestDate(pairs);
  const newestTr = formatDateTr(newest) ?? "";

  return (
    <PageContainer py="sm">
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: "Şehir Fiyatları", href: "/fiyat" },
      ]} />

      <header className="mt-6 max-w-3xl">
        <FreshnessBadge recordedDate={newest || null} />
        <h1 className="mt-5 font-(family-name:--font-display) text-4xl font-black leading-tight text-(--color-foreground) sm:text-5xl">
          Şehir Şehir Hal Fiyatları
        </h1>
        {/* Cevap paragrafi: tek basina alintilanabilir, birimli sayi tasir. */}
        <p className="mt-4 leading-8 text-(--color-muted)">
          Bu bölümde {groups.length} ilin toptancı hal bülteninden derlenen {pairs.length} ürün sayfası var
          {newestTr ? `; en son kayıt ${newestTr} tarihli` : ""}. Her sayfa tek bir halin tek bir ürün için
          yayımladığı min/ort/maks fiyatı, son 90 günün seyrini ve aynı ürünün Türkiye ortalamasıyla kıyasını gösterir.
          Fiyatlar HaldeFiyat&apos;ın kendi ETL&apos;iyle kaynağın resmi yayın takvimine göre yenilenir; hiçbir satır elle girilmez.
        </p>
      </header>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="İllere göre fiyat sayfaları">
        {groups.map((group) => (
          <article key={group.citySlug} className="rounded-[22px] border border-(--color-border) bg-(--color-surface) p-6">
            <h2 className="flex items-center gap-2 font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
              <MapPin className="h-4 w-4 text-(--color-brand)" aria-hidden="true" />
              {group.cityName}
            </h2>
            <p className="mt-1 text-xs text-(--color-muted)">
              {group.marketName} · {group.pairs.length} ürün · son kayıt {formatDateTr(latestDate(group.pairs)) ?? "—"}
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.pairs.map((pair) => (
                <li key={pair.productSlug}>
                  <Link
                    href={`/fiyat/${pair.citySlug}/${pair.productSlug}`}
                    className="inline-flex rounded-[6px] border border-(--color-border-soft) px-3 py-1.5 text-[12px] font-medium text-(--color-foreground) transition hover:border-(--color-brand)/45 hover:text-(--color-brand)"
                  >
                    {pair.productName}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={`/hal/${group.pairs[0]!.marketSlug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-brand)">
              {group.cityName} halinin tüm listesi <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
    </PageContainer>
  );
}
