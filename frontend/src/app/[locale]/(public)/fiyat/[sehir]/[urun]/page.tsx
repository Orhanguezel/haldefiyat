import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, LineChart, MapPin } from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import AnswerBlock from "@/components/seo/AnswerBlock";
import PriceChart from "@/components/sections/PriceChartLazy";
import PageContainer from "@/components/layout/PageContainer";
import { CityCompareTable, CityProductKeyNumbers, EditorialBlocks, MarketMovers } from "@/components/sections/CityProductSections";
import { fetchCityProduct, fetchProductEditorial } from "@/lib/api";
import { buildCityProductSummary } from "@/lib/city-product";
import { formatDateTr } from "@/lib/date-format";
import { PIYASA_BY_PRODUCT } from "@/lib/piyasa";
import { getPageMetadata } from "@/lib/seo";

/**
 * /fiyat/<sehir>/<urun> — sehir x urun sayfasi (pilot, 2026-09).
 * Kapi kosulunu (45+ veri gunu, 5.000+ arama hacmi, 14 gun icinde veri) gecmeyen
 * cift 404 degil noindex olur: URL yasar, sitemap'e girmez, iclink yalniz eligible'a verilir.
 */
export const revalidate = 1800;

type Props = { params: Promise<{ locale: string; sehir: string; urun: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, sehir, urun } = await params;
  const d = await fetchCityProduct(sehir, urun);
  if (!d) return { title: "Sayfa bulunamadı", robots: { index: false, follow: false } };
  const year = String(new Date().getFullYear());
  const dateTr = d.latest ? (formatDateTr(d.latest.recordedDate) ?? "") : "";
  const title = `${d.pair.cityName} ${d.pair.productName} Fiyatları ${year} — ${d.pair.marketName}`;
  const live = d.latest ? `${dateTr}: ortalama ${d.latest.avgPrice.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} TL/${d.pair.unit}. ` : "";
  const description = `${d.pair.cityName} ${d.pair.productName.toLocaleLowerCase("tr-TR")} hal fiyatı. ${live}${d.pair.marketName} günlük kaydı, 90 günlük seyir, haftalık değişim ve diğer şehirlerle karşılaştırma.`;
  return getPageMetadata("fiyat_sehir_urun", {
    locale, pathname: `/fiyat/${sehir}/${urun}`, title, description,
    robots: d.pair.eligible ? { index: true, follow: true } : { index: false, follow: true },
  });
}

export default async function CityProductPage({ params }: Props) {
  const { locale, sehir, urun } = await params;
  const d = await fetchCityProduct(sehir, urun);
  if (!d) notFound();
  setRequestLocale(locale);
  const { pair } = d;
  const editorial = await fetchProductEditorial(pair.productSlug);
  const dateTr = d.latest ? (formatDateTr(d.latest.recordedDate) ?? "") : "";
  const lower = pair.productName.toLocaleLowerCase("tr-TR");
  const piyasa = PIYASA_BY_PRODUCT[pair.productSlug];

  return (
    <PageContainer py="sm">
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: `${pair.productName} Fiyatları`, href: `/urun/${pair.productSlug}` },
        { name: pair.cityName, href: `/fiyat/${pair.citySlug}/${pair.productSlug}` },
      ]} />

      <header className="mt-6 max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-(--color-brand)/25 bg-(--color-brand)/10 px-3 py-1.5 font-(family-name:--font-mono) text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-brand)">
          <MapPin className="h-3.5 w-3.5" /> {pair.cityName} · {pair.marketName} · Günlük güncellenir
        </p>
        <h1 className="mt-5 font-(family-name:--font-display) text-4xl font-black leading-tight text-(--color-foreground) sm:text-5xl">
          {pair.cityName} {pair.productName} Fiyatları
        </h1>
        <p className="mt-4 leading-8 text-(--color-muted)">
          Bu sayfa <Link href={`/hal/${pair.marketSlug}`} className="font-semibold text-(--color-brand) underline underline-offset-2">{pair.marketName}</Link> kayıtlarındaki {lower} fiyatını her gün günceller: günün ortalaması ve aralığı, son 90 günün seyri, haftalık değişim ve aynı ürünün diğer şehirlerdeki hal fiyatıyla karşılaştırma. Son 90 günde {pair.days90} gün veri var.
        </p>
      </header>

      <div className="mt-8">
        <AnswerBlock id="ozet" title={`${pair.cityName}'da ${lower} bugün kaç lira?`} meta={dateTr ? `Son kayıt: ${dateTr}` : undefined}>
          {buildCityProductSummary(d, dateTr)}
        </AnswerBlock>
      </div>

      <CityProductKeyNumbers d={d} />

      <section className="mt-12" aria-label="Fiyat geçmişi">
        <h2 className="flex items-center gap-2 font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">
          <LineChart className="h-6 w-6 text-(--color-brand)" /> {pair.cityName}'da son 90 günün seyri
        </h2>
        <div className="mt-4"><PriceChart history={d.history} productName={`${pair.cityName} ${pair.productName}`} /></div>
      </section>

      <CityCompareTable d={d} />
      <MarketMovers d={d} />
      <EditorialBlocks productName={pair.productName} priceFactors={editorial?.priceFactors ?? ""} season={editorial?.season ?? ""} />

      <section className="my-12" aria-label="İlgili sayfalar">
        <div className="rounded-2xl border border-(--color-border) bg-(--color-bg-alt) p-6">
          <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">İlgili sayfalar</h2>
          <ul className="mt-3 space-y-2">
            {[
              { href: `/urun/${pair.productSlug}`, label: `${pair.productName} fiyatları — tüm haller ve geçmiş` },
              { href: `/hal/${pair.marketSlug}`, label: `${pair.marketName} — tüm ürünler` },
              ...(piyasa ? [{ href: `/piyasa/${piyasa.slug}`, label: piyasa.h1 }] : []),
              { href: `/fiyatlar?urun=${pair.productSlug}`, label: `Canlı fiyat tablosunda ${lower} filtrele` },
            ].map((item) => (
              <li key={item.href}><Link href={item.href} className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-brand) hover:underline"><ArrowRight className="h-4 w-4" /> {item.label}</Link></li>
            ))}
          </ul>
        </div>
      </section>
    </PageContainer>
  );
}
