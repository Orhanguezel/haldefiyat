export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight, BadgeCheck, BarChart3 } from "lucide-react";
import { fetchPrices, fetchPricesPage, fetchProducts, type Product } from "@/lib/api";
import PriceTable from "@/components/ui/PriceTable";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import ProductImage from "@/components/ui/ProductImage";

type Props = { params: Promise<{ locale: string }> };

const BORE_PRODUCTS = [
  "bugday",
  "bugday-ekmeklik",
  "bugday-makarnalik",
  "arpa",
  "misir",
  "celtik",
  "pirinc",
  "yulaf",
  "cavdar",
  "aycicegi",
  "pamuk",
  "mercimek",
  "nohut",
  "kuru-fasulye",
];

const FALLBACK_PRODUCTS: Product[] = [
  { id: -101, slug: "bugday", nameTr: "Buğday", displayName: "Buğday", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -102, slug: "bugday-ekmeklik", nameTr: "Ekmeklik Buğday", displayName: "Ekmeklik Buğday", categorySlug: "hububat", unit: "kg", seoIndex: 1, familySlug: "bugday" },
  { id: -103, slug: "bugday-makarnalik", nameTr: "Makarnalık Buğday", displayName: "Makarnalık Buğday", categorySlug: "hububat", unit: "kg", seoIndex: 1, familySlug: "bugday" },
  { id: -104, slug: "arpa", nameTr: "Arpa", displayName: "Arpa", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -105, slug: "misir", nameTr: "Mısır", displayName: "Mısır", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -106, slug: "celtik", nameTr: "Çeltik", displayName: "Çeltik", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -107, slug: "pirinc", nameTr: "Pirinç", displayName: "Pirinç", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -108, slug: "yulaf", nameTr: "Yulaf", displayName: "Yulaf", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -109, slug: "cavdar", nameTr: "Çavdar", displayName: "Çavdar", categorySlug: "hububat", unit: "kg", seoIndex: 1 },
  { id: -110, slug: "aycicegi", nameTr: "Ayçiçeği", displayName: "Ayçiçeği", categorySlug: "yagli-tohum", unit: "kg", seoIndex: 1 },
  { id: -111, slug: "pamuk", nameTr: "Pamuk", displayName: "Pamuk", categorySlug: "sanayi-bitkisi", unit: "kg", seoIndex: 1 },
  { id: -112, slug: "mercimek", nameTr: "Mercimek", displayName: "Mercimek", categorySlug: "bakliyat-kuru", unit: "kg", seoIndex: 1 },
  { id: -113, slug: "nohut", nameTr: "Nohut", displayName: "Nohut", categorySlug: "bakliyat-kuru", unit: "kg", seoIndex: 1 },
  { id: -114, slug: "kuru-fasulye", nameTr: "Kuru Fasulye", displayName: "Kuru Fasulye", categorySlug: "bakliyat-kuru", unit: "kg", seoIndex: 1 },
];

function withFallbackProducts(products: Product[]): Product[] {
  const seen = new Set(products.map((p) => p.slug));
  return [...products, ...FALLBACK_PRODUCTS.filter((p) => !seen.has(p.slug))];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Borsa ve Resmi Tarım Fiyatları | HaldeFiyat",
    description: "Buğday, ekmeklik ve makarnalık buğday, arpa, mısır, çeltik, pirinç, yulaf, çavdar, ayçiçeği, pamuk, mercimek, nohut ve kuru fasulye için TMO resmi alım fiyatları ile ticaret borsası fiyatları.",
    alternates: { canonical: `/${locale}/borsa` },
  };
}

function formatDate(raw?: string | null) {
  if (!raw) return "Veri bekleniyor";
  return new Date(`${raw.slice(0, 10)}T12:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BorsaPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, borsaPage, resmiRows] = await Promise.all([
    fetchProducts(undefined, undefined, { seoIndex: true }),
    fetchPricesPage({ marketType: "borsa", range: "1825d", latestOnly: false, limit: 100, sort: "date-desc" }),
    fetchPrices({ marketType: "resmi", range: "365d", limit: 50 }),
  ]);
  const borsaRows = borsaPage.items;

  const mvpProducts = withFallbackProducts(products).filter((p) => BORE_PRODUCTS.includes(p.slug));
  const latestDate = [...borsaRows, ...resmiRows]
    .map((r) => r.recordedDate)
    .sort()
    .at(-1);

  const collectionSchema = {
    name: "Borsa ve resmi tarım fiyatları",
    description: "TMO resmi alım fiyatları ve ticaret borsası serbest piyasa fiyatları.",
    hasPart: mvpProducts.map((product) => ({
      "@type": "Product",
      name: product.displayName || product.nameTr,
      url: `https://haldefiyat.com/urun/${product.slug}`,
      category: product.categorySlug,
    })),
  };

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <JsonLd type="Dataset" data={collectionSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Borsa", href: "/borsa" },
      ]} />

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-soft px-3 py-1 text-xs font-semibold text-muted">
            <BadgeCheck className="h-4 w-4 text-brand" />
            Kaynak ve fiyat tipi ayrı etiketlenir
          </div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-foreground md:text-5xl">
            Borsa ve resmi tarım fiyatları
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
            Hububat, yağlı tohum, sanayi bitkisi ve kuru bakliyatta TMO resmi alım fiyatları ile ticaret borsası
            serbest piyasa fiyatlarını ayrı kaynak ve tarih etiketiyle izleyin.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-brand" />
            <div>
              <div className="text-xs uppercase text-muted">Son veri tarihi</div>
              <div className="font-semibold text-foreground">{formatDate(latestDate)}</div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            Destekleme primleri fiyat değildir; resmi alım ve borsa serbest fiyatlarından ayrı değerlendirilir.
            45 günü aşan borsa kayıtları geçen sezon olarak etiketlenir.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {mvpProducts.map((product) => (
          <Link
            key={product.slug}
            href={`/urun/${product.slug}`}
            className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-brand/50"
          >
            <div className="mb-5 flex items-center justify-between">
              <ProductImage
                slug={product.slug}
                name={product.displayName || product.nameTr}
                categorySlug={product.categorySlug}
                size={44}
                className="rounded-lg"
              />
              <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1" />
            </div>
            <div className="font-semibold text-foreground">{product.displayName || product.nameTr}</div>
            <div className="mt-1 text-xs uppercase text-muted">{product.categorySlug}</div>
          </Link>
        ))}
      </section>

      <section className="mt-10 grid gap-8">
        <div>
          <div className="mb-3">
            <h2 className="text-xl font-bold text-foreground">TMO resmi alım fiyatları</h2>
            <p className="mt-1 text-sm text-muted">Taban/devlet alımı niteliğindeki resmi fiyatlar.</p>
          </div>
          <PriceTable initialPrices={resmiRows} markets={[]} />
        </div>
        <div>
          <div className="mb-3">
            <h2 className="text-xl font-bold text-foreground">Borsa serbest piyasa fiyatları</h2>
            <p className="mt-1 text-sm text-muted">TMO bülteni ve ticaret borsalarından gelen günlük fiyatlar. 45 günü aşan kayıtlar geçen sezon olarak işaretlenir.</p>
          </div>
          <PriceTable
            initialPricePage={borsaPage}
            markets={[]}
            requestParams={{ marketType: "borsa", range: "1825d", latestOnly: false, sort: "date-desc" }}
          />
        </div>
      </section>
    </main>
  );
}
