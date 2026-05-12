import Link from "next/link";
import { getProductsInSeason, getMonthName } from "@/lib/season";

export default function SeasonalGuide() {
  const products = getProductsInSeason();
  const monthName = getMonthName();

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1400px] px-8 py-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Mevsim Rehberi
          </span>
          <h2 className="mt-1 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
            {monthName} Ayında Mevsiminde Ürünler
          </h2>
          <p className="mt-1 text-sm text-(--color-muted)">
            Şu an hasat döneminde olan sebze ve meyveler — en taze ve en uygun fiyatlı
          </p>
        </div>
        <Link
          href="/fiyatlar"
          className="shrink-0 font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-brand) hover:underline"
        >
          Tüm fiyatlar →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => (
          <Link
            key={p.slug}
            href={`/urun/${p.slug}`}
            className="group flex flex-col gap-2 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-4 transition-colors hover:border-(--color-brand)/50 hover:bg-(--color-bg-alt)"
          >
            <span className="text-3xl leading-none" aria-hidden>
              {p.emoji}
            </span>
            <div>
              <div className="text-[14px] font-semibold text-(--color-foreground) group-hover:text-(--color-brand)">
                {p.nameTr}
              </div>
              <div className="mt-0.5 text-[12px] leading-snug text-(--color-muted)">
                {p.note}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
