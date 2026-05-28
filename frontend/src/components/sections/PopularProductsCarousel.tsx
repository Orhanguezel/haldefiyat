import Link from "next/link";
import type { WidgetPrice } from "@/lib/api";

const FALLBACK_PRODUCTS: WidgetPrice[] = [
  { productSlug: "domates", productName: "Domates", categorySlug: "sebze", avgPrice: 82.5, unit: "kg", changePct: 4.2, yoyChangePct: null },
  { productSlug: "biber", productName: "Biber", categorySlug: "sebze", avgPrice: 43.6, unit: "kg", changePct: -2.1, yoyChangePct: null },
  { productSlug: "sogan-kuru", productName: "Soğan Kuru", categorySlug: "sebze", avgPrice: 18.2, unit: "kg", changePct: 1.4, yoyChangePct: null },
  { productSlug: "patates", productName: "Patates", categorySlug: "sebze", avgPrice: 20.1, unit: "kg", changePct: -1.8, yoyChangePct: null },
];

function formatPrice(value: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function PopularProductsCarousel({ items }: { items: WidgetPrice[] }) {
  const products = (items.length ? items : FALLBACK_PRODUCTS).slice(0, 8);

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
              href={`/urun/${item.productSlug}`}
              className="min-h-[146px] w-[46vw] min-w-[156px] max-w-[190px] snap-start rounded-lg border border-(--color-border) bg-(--color-surface) p-4"
            >
              <div className="text-[15px] font-black leading-5 text-(--color-foreground)">{item.productName}</div>
              <div className="mt-1 text-[11px] uppercase text-(--color-muted)">{item.categorySlug}</div>
              <div className="mt-5 text-[22px] font-black text-(--color-foreground)">{formatPrice(item.avgPrice)}</div>
              <div className="mt-1 text-[11px] text-(--color-muted)">/{item.unit}</div>
              <div className={`mt-3 inline-flex min-h-8 items-center rounded-md px-2 text-[12px] font-bold ${isUp ? "bg-(--color-success)/10 text-(--color-success)" : "bg-(--color-danger)/10 text-(--color-danger)"}`}>
                {isUp ? "+" : ""}{change.toFixed(1)}%
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
