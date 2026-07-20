import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3 } from "lucide-react";
import { fetchPricesPage, fetchProducts } from "@/lib/api";
import PriceTable from "@/components/ui/PriceTable";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import ProductImage from "@/components/ui/ProductImage";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

function formatDate(raw?: string | null): string {
  if (!raw) return "Veri bekleniyor";
  return new Date(`${raw.slice(0, 10)}T12:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface CategoryPriceLandingProps {
  category: string;
  slug: string;
  title: string;
  kicker: string;
  description: string;
  breadcrumbLabel: string;
  unitNote: string;
}

export default async function CategoryPriceLanding({
  category,
  slug,
  title,
  kicker,
  description,
  breadcrumbLabel,
  unitNote,
}: CategoryPriceLandingProps) {
  const [allProducts, pricePage] = await Promise.all([
    fetchProducts(undefined, category, { seoIndex: true }),
    // 90 gun: "guncel fiyatlar" listesi bayat kayit gostermesin. `latestOnly` her
    // (urun, hal) ciftinin SON fiyatini getirir; pencere genis olursa veri vermeyi
    // birakmis bir borsanin son fiyati sonsuza dek guncel gibi listelenir. 1825 gunluk
    // (5 yil) pencerede Erzurum'un 22 Aralik 2021 tarihli koyun fiyati ve Ilgin'in
    // 132 gunluk (16,33 TL/kg — birim hatasi supheli) inek fiyati listede duruyordu.
    // 90 gun, borsalarin periyodik yayin ritmini (haftalik/aylik) tolere eder.
    fetchPricesPage({ category, range: "90d", latestOnly: true, limit: 200, sort: "date-desc" }),
  ]);
  const products = allProducts.filter((p) => p.categorySlug === category);
  const rows = pricePage.items;
  const latestDate = rows.map((r) => r.recordedDate).sort().at(-1);

  const collectionSchema = {
    name: title,
    description,
    hasPart: products.map((product) => ({
      "@type": "Product",
      name: product.displayName || product.nameTr,
      url: `${SITE_URL}/urun/${product.slug}`,
      category: product.categorySlug,
    })),
  };

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 md:px-8">
      <JsonLd type="Dataset" data={collectionSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: breadcrumbLabel, href: `/${slug}` },
      ]} />

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border-soft px-3 py-1 text-xs font-semibold text-muted">
            <BadgeCheck className="h-4 w-4 text-brand" />
            {kicker}
          </div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{description}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-brand" />
            <div>
              <div className="text-xs uppercase text-muted">Son veri tarihi</div>
              <div className="font-semibold text-foreground">{formatDate(latestDate)}</div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">{unitNote}</p>
        </div>
      </section>

      {products.length > 0 && (
        <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {products.map((product) => (
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
      )}

      <section className="mt-10">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-foreground">Güncel fiyatlar</h2>
          <p className="mt-1 text-sm text-muted">
            Ticaret borsalarından derlenen güncel fiyatlar. Kaynak ve tarih her satırda etiketlidir.
          </p>
        </div>
        <PriceTable initialPrices={rows} markets={[]} />
      </section>

      <section className="mt-10 rounded-lg border border-border bg-surface p-6">
        <p className="text-sm leading-7 text-muted">
          Bu sayfa HaldeFiyat'ın <Link href="/borsa" className="text-brand hover:underline">borsa ve resmi fiyatlar</Link> dikeyinin
          bir parçasıdır; ana hal sebze-meyve verisi <Link href="/fiyatlar" className="text-brand hover:underline">güncel hal fiyatları</Link>
          sayfasındadır. Fiyatlar bilgilendirme amaçlıdır.
        </p>
      </section>
    </main>
  );
}
