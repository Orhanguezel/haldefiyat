import Link from "next/link";
import type { Market } from "@/lib/api";
import { localePath } from "@/lib/locale-path";

const FALLBACK_CITIES = ["Antalya", "İstanbul", "İzmir", "Ankara", "Bursa", "Mersin", "Adana", "Konya"];

function uniqueCities(markets: Market[]): string[] {
  const seen = new Set<string>();
  for (const market of markets) {
    if (!market.cityName || seen.has(market.cityName)) continue;
    seen.add(market.cityName);
  }
  return [...seen];
}

export default function CityChipsRow({ locale, markets }: { locale: string; markets: Market[] }) {
  const cities = (uniqueCities(markets).length ? uniqueCities(markets) : FALLBACK_CITIES).slice(0, 10);

  return (
    <section className="px-4 py-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <div className="font-(family-name:--font-mono) text-[10px] font-bold uppercase tracking-[0.12em] text-(--color-brand)">
            Şehir Seç
          </div>
          <h2 className="mt-1 text-xl font-black text-(--color-foreground)">Yakındaki hallere bak</h2>
        </div>
        <Link href={localePath(locale, "/hal")} className="min-h-11 rounded-lg px-2 py-3 text-[13px] font-bold text-(--color-brand)">
          Tüm iller
        </Link>
      </div>
      <div className="flex max-h-[96px] flex-wrap gap-2 overflow-hidden">
        {cities.map((city) => (
          <Link
            key={city}
            href={localePath(locale, `/hal?city=${encodeURIComponent(city.toLocaleLowerCase("tr-TR"))}`)}
            className="inline-flex min-h-11 items-center rounded-full border border-(--color-border) bg-(--color-surface) px-4 text-[13px] font-bold text-(--color-foreground)"
          >
            {city}
          </Link>
        ))}
      </div>
    </section>
  );
}
