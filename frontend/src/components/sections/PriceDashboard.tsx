import Link from "next/link";
import { fetchPrices, fetchTrending } from "@/lib/api";
import PriceCard from "@/components/ui/PriceCard";

const CARD_LIMIT = 8;

/**
 * Anasayfa fiyat dashboard'u (server component).
 *
 * NEDEN: Server component sayesinde fetchPrices/fetchTrending RSC cache
 * katmaninda cache'lenir ve tarayicida JS bundle'a girmez.
 */
export default async function PriceDashboard() {
  const [prices, trending] = await Promise.all([
    fetchPrices({ range: "1d", limit: CARD_LIMIT }),
    fetchTrending(20),
  ]);

  // productSlug:marketSlug → changePct hizli lookup map'i
  const changeMap = new Map<string, number>();
  for (const t of trending) {
    const productSlug = t.product?.slug;
    const marketSlug = t.market?.slug;
    if (productSlug && marketSlug) {
      changeMap.set(`${productSlug}:${marketSlug}`, t.changePct);
    }
  }

  return (
    <section
      id="fiyatlar"
      className="relative z-10 px-8 py-20"
    >
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-10 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
              Anlık Fiyatlar
            </div>
            <h2 className="font-(family-name:--font-display) text-[28px] font-extrabold tracking-[-0.03em] text-(--color-foreground) sm:text-[32px]">
              Bugünkü Hal Fiyatları
            </h2>
          </div>
          <Link
            href="/fiyatlar"
            className="group flex items-center gap-1 text-[13px] font-semibold text-(--color-brand) transition-all hover:gap-2"
          >
            Tüm ürünleri gör
            <span aria-hidden>→</span>
          </Link>
        </header>

        {prices.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-[16px] border border-(--color-border) bg-(--color-surface)"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {prices.slice(0, CARD_LIMIT).map((row) => {
              const key = `${row.productSlug}:${row.marketSlug}`;
              const changePct = changeMap.get(key);
              return (
                <PriceCard
                  key={`${row.id}`}
                  row={row}
                  changePct={changePct}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
