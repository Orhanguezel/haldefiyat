import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import PageContainer from "@/components/layout/PageContainer";
import { getPageMetadata } from "@/lib/seo";
import { PIYASA_PAGES } from "@/lib/piyasa";
import { fetchProductPriceSummary, formatAveragePrice } from "@/lib/product-price-summary";

// Bolum kok sayfasi. /piyasa/<slug> sayfalari vardi ama /piyasa 404 donuyordu
// (Tanitio katalogu 17 Eyl 2026, Bulgu 5). Kartlar PIYASA_PAGES config'inden,
// sayilar canli veriden gelir — sabit iddia yazilmaz.
export const revalidate = 3600;

type Props = { params: Promise<{ locale: string }> };

const PAGES = Object.values(PIYASA_PAGES);

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const regions = [...new Set(PAGES.map((page) => page.region.split(" / ")[0]))].join(", ");
  return getPageMetadata("piyasa-index", {
    locale,
    pathname: "/piyasa",
    title: `Bölgesel Günlük Piyasalar — ${PAGES.length} Bölge Sayfası`,
    description: `${regions} için günlük hal piyasası sayfaları: yerel kaydın durumu, Türkiye hal fiyatlarıyla kıyas, çeşit ve birim ayrımı. Bahçe fiyatı ile toptan hal fiyatı ayrı değerlendirilir.`,
  });
}

export default async function PiyasaIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const summaries = await Promise.all(PAGES.map((page) => fetchProductPriceSummary(page.productSlug)));

  return (
    <PageContainer py="sm">
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: "Piyasalar", href: "/piyasa" },
      ]} />

      <header className="mt-6 max-w-3xl">
        <h1 className="mt-5 font-(family-name:--font-display) text-4xl font-black leading-tight text-(--color-foreground) sm:text-5xl">
          Bölgesel Günlük Piyasalar
        </h1>
        <p className="mt-4 leading-8 text-(--color-muted)">
          Bir ürünün fiyatı üretim bölgesinde, o bölgenin halinde ve Türkiye genelinde aynı gün farklı olabilir.
          Bu {PAGES.length} sayfa, yerel kaydın o gün var olup olmadığını, hangi çeşit ve birimle yayımlandığını ve
          Türkiye tablosuyla farkını ayrı ayrı gösterir. Bahçe alım fiyatı, toptan hal fiyatı ve perakende fiyat
          aynı sayı değildir; her sayfa bu ayrımı korur.
        </p>
      </header>

      <section className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Piyasa sayfaları">
        {PAGES.map((page, index) => {
          const summary = summaries[index]!;
          const price = formatAveragePrice(summary);
          return (
            <Link
              key={page.slug}
              href={`/piyasa/${page.slug}`}
              className="group rounded-[22px] border border-(--color-border) bg-(--color-surface) p-6 transition hover:border-(--color-brand)/50"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-muted)">{page.region}</p>
              <h2 className="mt-2 font-(family-name:--font-display) text-xl font-bold text-(--color-foreground) group-hover:text-(--color-brand)">
                {page.h1}
              </h2>
              {price && summary.dateTr ? (
                <p className="mt-3 font-(family-name:--font-mono) text-[14px] font-bold text-(--color-foreground)">
                  {`${page.productName} Türkiye ortalaması ${price}`}
                  <span className="ml-1 font-(family-name:--font-body) text-[12px] font-medium text-(--color-muted)">
                    {`(${summary.dateTr}, ${summary.marketCount} hal)`}
                  </span>
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-(--color-muted)">{page.intro[0]}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-(--color-brand)">
                Piyasayı aç <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </section>
    </PageContainer>
  );
}
