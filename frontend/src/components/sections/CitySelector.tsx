import Link from "next/link";
import { fetchMarkets, type Market } from "@/lib/api";
import { localePath } from "@/lib/locale-path";
import CitySelectorClient from "@/components/sections/CitySelectorClient";

const MAJOR_CITIES = ["istanbul", "izmir", "antalya", "ankara", "bursa", "balikesir", "konya", "adana"];

interface CitySelectorProps {
  locale: string;
}

export default async function CitySelector({ locale }: CitySelectorProps) {
  const allMarkets = await fetchMarkets();

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
        <header className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-(--color-border-soft) pb-8 sm:flex-row sm:items-end">
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

        <CitySelectorClient markets={sortedMarkets} locale={locale} majorCities={MAJOR_CITIES} />
      </div>
    </section>
  );
}
