import Link from "next/link";
import { productHref } from "@/lib/product-links";
import type { WidgetPrice } from "@/lib/api";

function formatPrice(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function PopularProductsCarousel({ items }: { items: WidgetPrice[] }) {
  const products = items.slice(0, 8);
  if (products.length === 0) return null;

  return (
    <section className="px-4 py-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-brand)">
            Popüler Ürünler
          </div>
          <h2 className="mt-1 text-xl font-black text-(--color-foreground)">Bugün en çok bakılanlar</h2>
        </div>
        <Link href="/fiyatlar" className="min-h-11 rounded-lg px-2 py-3 text-[13px] font-bold text-(--color-brand)">
          Tümü
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((item) => {
          const change = item.changePct ?? 0;
          const isUp = change >= 0;
          return (
            <Link
              key={item.productSlug}
              href={productHref(item)}
              className="min-h-[146px] w-[46vw] min-w-[156px] max-w-[190px] snap-start rounded-lg border border-(--color-border) bg-(--color-surface) p-4"
            >
              <div className="text-[15px] font-black leading-5 text-(--color-foreground)">{item.productName}</div>
              <div className="mt-1 text-[11px] uppercase text-(--color-muted)">{item.categorySlug}</div>
              <div className="mt-5 text-[22px] font-black text-(--color-foreground)">{formatPrice(item.avgPrice)}</div>
              <div className="mt-1 text-[11px] text-(--color-muted)">/{item.unit}</div>
              <div className={`mt-3 inline-flex min-h-8 items-center rounded-md bg-(--trend-bg) px-2 text-[12px] font-bold ${isUp ? "text-(--trend-up)" : "text-(--trend-down)"}`}>
                {isUp ? "+" : ""}{change.toFixed(1)}%
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
