export const dynamic = "force-dynamic";

import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { ListingCard } from "@/components/listings/ListingCard";
import { ListingBoard } from "@/components/listings/ListingBoard";
import { fetchListingBoard, fetchListings } from "@/lib/api";
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
  const hasFilter = Boolean(one(query?.type) || one(query?.product) || one(query?.city) || one(query?.district));
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
  const product = one(query?.product);
  const city = one(query?.city);
  const [listings, board] = await Promise.all([
    fetchListings({
    type,
    product,
    city,
    district: one(query?.district),
    page,
    limit: 24,
    }),
    fetchListingBoard({ product, city }),
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
        <Link href="/ilan-ver" className="rounded-[6px] bg-(--color-brand) px-4 py-2 text-sm font-semibold text-white">
          İlan ver
        </Link>
      </header>

      <form className="mb-8 grid gap-3 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-4 md:grid-cols-5">
        <select name="type" defaultValue={type ?? ""} className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm">
          <option value="">Tüm tipler</option>
          <option value="satis">Satış</option>
          <option value="alim">Alım</option>
        </select>
        <input name="product" defaultValue={one(query?.product)} placeholder="Ürün slug" className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
        <input name="city" defaultValue={one(query?.city)} placeholder="İl slug" className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
        <input name="district" defaultValue={one(query?.district)} placeholder="İlçe slug" className="min-h-11 rounded-[6px] border border-(--color-border-soft) bg-(--color-bg) px-3 text-sm" />
        <button className="min-h-11 rounded-[6px] bg-(--color-brand) px-4 text-sm font-semibold text-white">Filtrele</button>
      </form>

      <ListingBoard board={board} />

      <div className="mb-4 text-sm text-(--color-muted)">{listings.meta.total} ilan</div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {listings.items.map((item) => <ListingCard key={item.id} item={item} />)}
      </div>
      {!listings.items.length ? <p className="text-sm text-(--color-muted)">Aktif ilan bulunamadı.</p> : null}
    </PageContainer>
  );
}
