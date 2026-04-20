/**
 * WeatherWidget — /hal/[slug] sayfasinda sehir hava durumu ozeti.
 * Server Component: RSC'de tarimiklim API'sinden veri ceker.
 */

import {
  fetchWeatherWidget,
  fetchFrostRisk,
  frostLevel,
  FROST_LABELS,
  FROST_COLORS,
  type WeatherWidgetData,
  type FrostRiskResult,
} from "@/lib/weather";

function WeatherIcon({ icon, condition }: { icon: string; condition: string }) {
  if (!icon) return <span className="text-2xl">🌤️</span>;
  // OWM icon kodu → emoji fallback
  const code = icon.replace("n", "d");
  if (code.startsWith("01")) return <span className="text-2xl">☀️</span>;
  if (code.startsWith("02")) return <span className="text-2xl">⛅</span>;
  if (code.startsWith("03") || code.startsWith("04")) return <span className="text-2xl">☁️</span>;
  if (code.startsWith("09") || code.startsWith("10")) return <span className="text-2xl">🌧️</span>;
  if (code.startsWith("11")) return <span className="text-2xl">⛈️</span>;
  if (code.startsWith("13")) return <span className="text-2xl">❄️</span>;
  if (code.startsWith("50")) return <span className="text-2xl">🌫️</span>;
  return <span className="text-2xl" title={condition}>🌤️</span>;
}

function FrostBadge({ maxRisk }: { maxRisk: number }) {
  const level = frostLevel(maxRisk);
  if (level === "none") return null;
  return (
    <div className={`flex items-center gap-1.5 rounded-[6px] border border-current/20 bg-current/5 px-2 py-0.5 text-[11px] font-semibold ${FROST_COLORS[level]}`}>
      <span>❄️</span>
      <span>{FROST_LABELS[level]} — %{maxRisk}</span>
    </div>
  );
}

interface Props {
  citySlug: string;
  cityName: string;
}

export default async function WeatherWidget({ citySlug, cityName }: Props) {
  const [widget, frost] = await Promise.all([
    fetchWeatherWidget(citySlug),
    fetchFrostRisk(citySlug),
  ]);

  if (!widget) {
    return null; // sessizce gizle — hava servisi yoksa sayfayı kırma
  }

  const { current, forecast } = widget;
  const maxRisk = frost?.maxRisk ?? 0;
  const shortForecast = forecast.slice(0, 3);

  return (
    <div className="rounded-[16px] border border-(--color-border) bg-(--color-surface) p-5">
      {/* Baslik */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-muted)">
          Hava Durumu — {cityName}
        </span>
        <span className="font-(family-name:--font-mono) text-[10px] text-(--color-muted)">
          tarimiklim.com
        </span>
      </div>

      {/* Guncel hava */}
      <div className="mb-4 flex items-center gap-4">
        <WeatherIcon icon={current.icon} condition={current.condition} />
        <div>
          <div className="text-2xl font-bold text-(--color-foreground)">
            {Math.round(current.tempCelsius)}°C
          </div>
          <div className="text-[12px] text-(--color-muted)">
            Hissedilen {Math.round(current.feelsLike)}°C · Nem %{current.humidity}
          </div>
          <div className="text-[12px] text-(--color-muted)">
            {current.condition} · Rüzgar {current.windSpeed} km/s
          </div>
        </div>
        {maxRisk >= 10 && (
          <div className="ml-auto">
            <FrostBadge maxRisk={maxRisk} />
          </div>
        )}
      </div>

      {/* 3 gunluk tahmin */}
      {shortForecast.length > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-(--color-border) pt-4">
          {shortForecast.map((day) => {
            const dateLabel = new Date(day.date).toLocaleDateString("tr-TR", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
            const risk = day.frostRisk ?? 0;
            const level = frostLevel(Number(risk));
            return (
              <div
                key={day.date}
                className="rounded-[10px] bg-(--color-navy)/40 p-3 text-center"
              >
                <div className="mb-1 font-(family-name:--font-mono) text-[10px] text-(--color-muted)">
                  {dateLabel}
                </div>
                <WeatherIcon icon={day.icon} condition={day.condition} />
                <div className="mt-1 text-[13px] font-semibold text-(--color-foreground)">
                  {Math.round(Number(day.tempMax))}°
                  <span className="ml-1 font-normal text-(--color-muted)">
                    / {Math.round(Number(day.tempMin))}°
                  </span>
                </div>
                {level !== "none" && (
                  <div className={`mt-1 text-[10px] font-semibold ${FROST_COLORS[level]}`}>
                    ❄️ %{risk}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
