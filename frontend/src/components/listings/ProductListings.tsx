import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchListings } from "@/lib/api";
import { ListingCard } from "./ListingCard";

type Props = { productSlug: string; productName: string };

export default function ProductListings(props: Props) {
  return <Suspense fallback={null}><ProductListingsContent {...props} /></Suspense>;
}

export async function ProductListingsContent({ productSlug, productName }: Props) {
  // The public endpoint applies approval, expiry and real-listing gates before pagination.
  // Exact product filtering also keeps variety pages from showing a different variety.
  const { items, meta } = await fetchListings({ product: productSlug, limit: 6 });
  const query = new URLSearchParams({ product: productSlug });
  return (
    <section className="my-10" aria-label={`${productName} ilanları`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">{productName} ilanları</h2>
          <p className="mt-2 text-sm leading-6 text-(--color-muted)">Türkiye genelindeki aktif alım ve satış ilanları. İlan fiyatları resmî hal fiyatlarından ayrıdır.</p>
        </div>
        {items.length > 0 && <Link href={`/ilanlar?${query}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-(--color-brand) hover:underline">Tümünü gör ({meta.total}) <ArrowRight size={16} aria-hidden="true" /></Link>}
      </div>
      {items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => <ListingCard key={item.id} item={item} layout="horizontal" />)}
        </div>
      ) : (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed border-(--color-border) bg-(--color-surface) p-5 sm:flex-row sm:items-center">
          <p className="text-sm text-(--color-muted)">Bu ürün için şu anda aktif ilan bulunmuyor. İlk ilanı siz verebilirsiniz.</p>
          <Link href={`/ilan-ver?${query}`} className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-(--color-brand) px-5 text-sm font-bold text-(--color-brand-fg)">Ücretsiz ilan ver</Link>
        </div>
      )}
    </section>
  );
}
