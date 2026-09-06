import Link from "next/link";

import ProductImage from "@/components/ui/ProductImage";
import type { WantedProduct } from "@/lib/api";

/**
 * "Bu hafta aranan ürünler" — ilan panosunun arz tarafını besler.
 *
 * Liste süs değil çağrı: talebi ölçülen ama satış ilanı OLMAYAN ürünler gösterilir
 * ve her satır doğrudan o ürünün ilan formuna gider. Rozet, talebin nereden
 * geldiğini söyler; uydurma "popüler" iddiası yok.
 */
function demandLabel(item: WantedProduct): string {
  return [
    item.buyers > 0 ? `${item.buyers} açık alım ilanı` : null,
    item.watchers > 0 ? `${item.watchers} fiyat takipçisi` : null,
    item.searchVolume > 0 ? `Aylık arama ilgisi: ${item.searchVolume.toLocaleString("tr-TR")}` : null,
    item.contactedOffers ? `${item.contactedOffers} teklifte iletişime geçildi` : null,
  ].filter(Boolean).join(" · ");
}

function priceLabel(item: WantedProduct): string | null {
  if (item.price == null || item.price <= 0) return null;
  const price = item.price.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Son hal gözlemi (${item.priceDate ?? "tarih yok"}): ${price} ₺/kg${item.markets ? ` · ${item.markets} hal` : ""}`;
}

export function WantedProducts({ items }: { items: WantedProduct[] }) {
  if (!items.length) return null;

  return (
    <section aria-labelledby="aranan-urunler" className="mb-10 rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="aranan-urunler" className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">
          Bu hafta aranan ürünler
        </h2>
        <p className="text-sm text-(--color-muted)">
          Arama ve fiyat takibi ilgi sinyalidir; satın alma taahhüdü değildir. Ürününüz varsa ilan açabilirsiniz.
        </p>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/ilan-ver?product=${encodeURIComponent(item.slug)}`}
              className="flex h-full min-h-11 items-center gap-3 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-3 transition hover:border-(--color-brand)"
            >
              <ProductImage slug={item.slug} name={item.name} imageUrl={item.imageUrl} size={48} className="h-12 w-12 shrink-0 rounded-[6px] object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-(--color-foreground)">{item.name}</span>
                <span className="block text-xs text-(--color-muted)">{demandLabel(item)}</span>
                {priceLabel(item) ? (
                  <span className="block truncate text-xs text-(--color-muted)">{priceLabel(item)}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs font-semibold text-(--color-brand)">İlan ver →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
