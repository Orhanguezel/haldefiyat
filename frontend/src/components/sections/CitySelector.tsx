import Link from "next/link";
import { fetchMarkets, type Market } from "@/lib/api";
import { localePath } from "@/lib/locale-path";

const MAJOR_CITIES = ["istanbul", "izmir", "antalya", "ankara", "bursa", "balikesir", "konya", "adana"];
const SKELETON_COUNT = 6;

interface CitySelectorProps {
  locale: string;
}

/**
 * Sehir secici (server component).
 *
 * NEDEN: Hal listesi RSC cache'inden gelir. Tikladiginda /hal/[slug]'a
 * yonlendirir; doğrudan halin detay sayfası daha iyi SEO ve UX sunar.
 */
export default async function CitySelector({ locale }: CitySelectorProps) {
  const allMarkets = await fetchMarkets();

  // Büyük şehirleri başa al, kalanları alfabetik sırala
  const sortedMarkets = [...allMarkets].sort((a, b) => {
    const aIsMajor = MAJOR_CITIES.includes(a.slug);
    const bIsMajor = MAJOR_CITIES.includes(b.slug);
    if (aIsMajor && !bIsMajor) return -1;
    if (!aIsMajor && bIsMajor) return 1;
    return a.cityName.localeCompare(b.cityName, "tr");
  });

  return (
    <section id="sehirler" className="relative z-10 px-6 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-12 flex flex-col items-start justify-between gap-4 border-b border-(--color-border-soft) pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-(--color-brand-light) px-3 py-1 font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-wider text-(--color-brand)">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-brand) opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-brand)"></span>
              </span>
              81 İl aktif
            </div>
            <h2 className="font-(family-name:--font-display) text-3xl font-extrabold tracking-tight text-(--color-foreground) sm:text-4xl">
              Şehir & Hal Seçin
            </h2>
            <p className="mt-2 max-w-md text-[14px] text-(--color-muted)">
              Türkiye'nin dört bir yanındaki toptancı hallerinden en güncel fiyat verilerine ulaşın.
            </p>
          </div>
          <Link
            href={localePath(locale, "/hal")}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-(--color-bg-alt) px-6 text-[13px] font-bold text-(--color-foreground) transition-all hover:bg-(--color-brand) hover:text-(--color-brand-fg) active:scale-95"
          >
            Tüm İller Listesi
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-1"
            >
              <path d="M5 10h10M10 5l5 5-5 5" />
            </svg>
          </Link>
        </header>

        {sortedMarkets.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                key={i}
                className="h-[100px] animate-pulse rounded-2xl border border-(--color-border-soft) bg-(--color-bg-alt)/50"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {sortedMarkets.map((market: Market) => {
              const isMajor = MAJOR_CITIES.includes(market.slug);
              return (
                <Link
                  key={market.id}
                  href={localePath(locale, `/hal/${market.slug}`)}
                  className={`group relative flex flex-col justify-center rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isMajor
                      ? "border-(--color-brand)/20 bg-(--color-brand)/[0.02] hover:border-(--color-brand) hover:shadow-(--color-brand)/5"
                      : "border-(--color-border-soft) bg-(--color-surface) hover:border-(--color-brand)/40 hover:bg-(--color-bg-alt)/30"
                  }`}
                >
                  {isMajor && (
                    <span className="absolute right-3 top-3 rounded-md bg-(--color-brand) px-1.5 py-0.5 font-(family-name:--font-mono) text-[9px] font-bold uppercase tracking-wider text-(--color-brand-fg)">
                      Popüler
                    </span>
                  )}
                  <div className="font-(family-name:--font-display) text-[16px] font-bold tracking-tight text-(--color-foreground) group-hover:text-(--color-brand)">
                    {market.cityName}
                  </div>
                  <div className="mt-1 line-clamp-1 text-[11px] font-medium text-(--color-muted)">
                    {market.name}
                  </div>
                  <div className="mt-4 flex items-center justify-between opacity-0 transition-all group-hover:opacity-100">
                    <span className="text-[10px] font-bold uppercase text-(--color-brand)">
                      Fiyatları Gör
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-(--color-brand)">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
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
