/**
 * FrostRiskBanner — /urun/[slug] sayfasinda don uyari baneri.
 *
 * Turk tariminin don hassas bolgelerinden (Antalya, Izmir, Adana, Bursa)
 * en yuksek don riskini alir. Risk > 30 ise banner gosterilir.
 */

import {
  fetchFrostRisk,
  cityToWeatherSlug,
  frostLevel,
  FROST_LABELS,
  FROST_COLORS,
} from "@/lib/weather";

// Don'a duyarli ana uretim merkezleri
const FROST_WATCH_CITIES = ["antalya", "izmir", "adana", "bursa", "istanbul"];

interface CityRisk {
  slug: string;
  label: string;
  maxRisk: number;
}

const CITY_LABELS: Record<string, string> = {
  antalya: "Antalya",
  izmir: "İzmir",
  adana: "Adana",
  bursa: "Bursa",
  istanbul: "İstanbul",
};

export default async function FrostRiskBanner() {
  const results = await Promise.all(
    FROST_WATCH_CITIES.map(async (slug): Promise<CityRisk | null> => {
      const data = await fetchFrostRisk(slug);
      if (!data || data.maxRisk < 30) return null;
      return { slug, label: CITY_LABELS[slug] ?? slug, maxRisk: data.maxRisk };
    }),
  );

  const atRisk = results.filter((r): r is CityRisk => r !== null);
  if (atRisk.length === 0) return null;

  const worstRisk = Math.max(...atRisk.map((r) => r.maxRisk));
  const level = frostLevel(worstRisk);
  const citiesText = atRisk.map((r) => r.label).join(", ");

  const borderColor =
    level === "extreme" || level === "high"
      ? "border-red-500/40 bg-red-500/5"
      : "border-orange-500/40 bg-orange-500/5";

  return (
    <div
      className={`mb-6 flex items-start gap-3 rounded-[12px] border p-4 ${borderColor}`}
      role="alert"
    >
      <span className="mt-0.5 text-xl" aria-hidden>
        ❄️
      </span>
      <div>
        <div className={`text-[13px] font-semibold ${FROST_COLORS[level]}`}>
          {FROST_LABELS[level]} — Önümüzdeki 3 gün
        </div>
        <div className="mt-0.5 text-[12px] text-(--color-muted)">
          {citiesText} bölgelerinde don bekleniyor. Hasat ve nakliye planlamalarını
          gözden geçirin. Kaynak: tarimiklim.com
        </div>
      </div>
    </div>
  );
}
