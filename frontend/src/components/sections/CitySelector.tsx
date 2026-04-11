import Link from "next/link";
import { fetchMarkets, type Market } from "@/lib/api";

const POPULAR_LIMIT = 3;
const SKELETON_COUNT = 6;

/**
 * Sehir secici (server component).
 *
 * NEDEN: Hal listesi RSC cache'inden gelir. Tikladiginda /fiyatlar?city=SLUG'a
 * yonlendirir; query string filtre Next.js'in standart pattern'i.
 */
export default async function CitySelector() {
  const markets = await fetchMarkets();

  return (
    <section
      id="sehirler"
      className="relative z-10 px-8 pb-20"
    >
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
              81 İl
            </div>
            <h2 className="font-(family-name:--font-display) text-[28px] font-extrabold tracking-[-0.03em] text-(--color-foreground) sm:text-[32px]">
              Şehir Seçin
            </h2>
          </div>
          <Link
            href="/fiyatlar"
            className="group flex items-center gap-1 text-[13px] font-semibold text-(--color-brand) transition-all hover:gap-2"
          >
            Tüm iller
            <span aria-hidden>→</span>
          </Link>
        </header>

        {markets.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                key={i}
                className="h-[92px] animate-pulse rounded-xl border border-(--color-border) bg-(--color-surface)"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
            {markets.map((market: Market, idx: number) => {
              const isPopular = idx < POPULAR_LIMIT;
              return (
                <Link
                  key={market.id}
                  href={{ pathname: "/fiyatlar", query: { city: market.slug } }}
                  className={`group relative cursor-pointer overflow-hidden rounded-xl border p-5 text-center transition-all duration-300 hover:-translate-y-[3px] ${
                    isPopular
                      ? "border-(--color-brand)/20 bg-(--color-brand)/[0.03] hover:border-(--color-brand)/40"
                      : "border-(--color-border) bg-(--color-surface) hover:border-(--color-border)/50 hover:bg-(--color-bg-alt)"
                  }`}
                >
                  {isPopular && (
                    <span className="absolute right-2 top-2 rounded-[4px] bg-(--color-brand)/10 px-[7px] py-[2px] font-(family-name:--font-mono) text-[9px] font-bold uppercase tracking-[0.1em] text-(--color-brand)">
                      Popüler
                    </span>
                  )}
                  <div className="font-(family-name:--font-display) text-[16px] font-bold text-(--color-foreground)">
                    {market.cityName}
                  </div>
                  <div className="mt-1 text-[12px] text-(--color-muted)">
                    {market.name}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
