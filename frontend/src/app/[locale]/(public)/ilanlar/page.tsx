export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingBoard } from "@/components/listings/ListingBoard";
import { ListingFilters, type ListingFilterValues } from "@/components/listings/ListingFilters";
import { fetchListingBoard, fetchListings, fetchProducts } from "@/lib/api";
import { TURKEY_CITY_OPTIONS } from "@/data/turkey-cities";
import { getPageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  const hasFilter = Boolean(one(query?.q) || one(query?.type) || one(query?.product) || one(query?.city) || one(query?.unit) || one(query?.date));
  return getPageMetadata("ilanlar", {
    locale,
    pathname: "/ilanlar",
    title: "Hal İlanları ve Alım Talepleri",
    description: "Üretici, komisyoncu ve alıcı ilanlarını ürün ve bölgeye göre keşfedin.",
    robots: hasFilter ? { index: false, follow: true } : { index: true, follow: true },
  });
}

export default async function ListingsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const page = Math.max(1, Number(one(query?.page)) || 1);
  const typeRaw = one(query?.type);
  const type = typeRaw === "satis" || typeRaw === "alim" ? typeRaw : undefined;
  const unitRaw = one(query?.unit);
  const unit = (["kg", "adet", "kasa", "bag", "demet", "koli", "paket", "ton", "litre"] as const).find((value) => value === unitRaw);
  const dateRaw = one(query?.date);
  const date = (["today", "7d", "30d"] as const).find((value) => value === dateRaw);
  const q = one(query?.q)?.trim() || undefined;
  const product = one(query?.product);
  const city = one(query?.city);
  const filters: ListingFilterValues = { q, type, product, city, unit, date };
  const hasAnyFilter = Object.values(filters).some(Boolean);
  const [listings, board, products] = await Promise.all([
    fetchListings({
      q,
      type,
      product,
      city,
      unit,
      date,
      page,
      limit: 24,
    }),
    fetchListingBoard({ product, city }),
    fetchProducts(undefined, undefined, { seoIndex: true }),
  ]);

  return (
    <PageContainer>
      <Breadcrumb items={[{ name: "Anasayfa", href: "/" }, { name: "İlanlar", href: "/ilanlar" }]} />
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">İlanlar</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-(--color-muted)">
            Resmi hal fiyatından ayrı, üretici ve alıcıları buluşturan ilan/teklif havuzu.
          </p>
        </div>
        <Link href="/ilan-ver" className="rounded-[6px] bg-(--color-brand) px-4 py-2 text-sm font-semibold text-(--color-brand-fg)">
          İlan ver
        </Link>
      </header>

      <ListingFilters
        values={filters}
        products={products
          .filter((productOption) => !productOption.canonicalSlug)
          .map((productOption) => ({ value: productOption.slug, label: productOption.displayName ?? productOption.nameTr }))}
        cities={TURKEY_CITY_OPTIONS}
      />

      <ListingBoard board={board} />

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
          Aktif ilanlar
        </h2>
        <span className="text-sm text-(--color-muted)" role="status">{listings.meta.total} ilan</span>
      </div>

      {listings.items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.items.map((item) => <ListingCard key={item.id} item={item} />)}
        </div>
      ) : (
        /* Bos durum: "Aktif ilan bulunamadi." tek satiri cikmaz sokakti. Ilan sayisini
           artirmak hedefse bos ekran en degerli reklam alani — dogrudan davet et. */
        <div className="rounded-[10px] border border-dashed border-(--color-border) bg-(--color-bg-alt) p-8 text-center">
          <h3 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
            {hasAnyFilter ? "Bu filtreye uyan ilan yok" : "Burada henüz ilan yok"}
          </h3>
          <p className="mx-auto mt-2 max-w-prose text-sm leading-6 text-(--color-muted)">
            {hasAnyFilter
              ? "Filtreyi genişletmeyi deneyin ya da aradığınız ürün için bir alım talebi açın — satıcılar sizi bulsun."
              : "İlk ilanı siz verin. Ürününüzü hangi fiyattan, hangi miktarda sattığınızı yazın; alıcılar hal fiyatını görürken sizin ilanınızı da görsün."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={hasAnyFilter ? "/ilan-ver?type=alim" : "/ilan-ver"}
              className="min-h-11 rounded-[6px] bg-(--color-brand) px-5 py-2.5 text-sm font-semibold text-(--color-brand-fg) transition hover:opacity-90"
            >
              {hasAnyFilter ? "Alım talebi oluştur" : "Ücretsiz ilan ver"}
            </Link>
            {hasAnyFilter ? (
              <>
                <Link
                  href="#ilan-filtreleri"
                  className="min-h-11 rounded-[6px] border border-(--color-border) px-5 py-2.5 text-sm font-semibold text-(--color-foreground) transition hover:bg-(--color-surface)"
                >
                  Filtreleri düzenle
                </Link>
                <Link href="/ilanlar" className="min-h-11 px-3 py-2.5 text-sm font-semibold text-(--color-brand) underline-offset-4 hover:underline">
                  Tümünü temizle
                </Link>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Liste doluyken de ilan vermeye davet — sayfanin tek amaci arz/talep havuzunu buyutmek. */}
      {listings.items.length ? (
        <section className="mt-10 rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h3 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">
              Siz de ürününüzü buraya koyun
            </h3>
            <p className="mt-1 max-w-prose text-sm leading-6 text-(--color-muted)">
              Ücretsiz, komisyonsuz. İlanınız hal fiyatlarını takip eden alıcılara görünür.
            </p>
          </div>
          <Link
            href="/ilan-ver"
            className="mt-4 inline-flex min-h-11 items-center rounded-[6px] bg-(--color-brand) px-5 py-2.5 text-sm font-semibold text-(--color-brand-fg) transition hover:opacity-90 sm:mt-0 sm:shrink-0"
          >
            İlan ver
          </Link>
        </section>
      ) : null}
    </PageContainer>
  );
}
