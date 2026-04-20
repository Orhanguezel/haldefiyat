/**
 * Tarimiklim API fetcher — server-side only (RSC).
 *
 * TARIMIKLIM_API_URL: runtime env, build'e baked olmaz.
 * VPS: ecosystem.config.cjs → TARIMIKLIM_API_URL = "http://127.0.0.1:8088"
 * Lokal: .env.local → TARIMIKLIM_API_URL=http://localhost:8088
 */

const WEATHER_API = (
  process.env.TARIMIKLIM_API_URL ?? "http://localhost:8088"
).replace(/\/$/, "") + "/api/v1";

const TOKEN = process.env.INTERNAL_WEATHER_API_TOKEN ?? "";

function authHeaders(): HeadersInit {
  return TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
}

// ── Türkçe şehir adı → tarimiklim slug map ──────────────────────────────────

const CITY_SLUG_MAP: Record<string, string> = {
  istanbul: "istanbul",
  "i̇stanbul": "istanbul",
  izmir: "izmir",
  "i̇zmir": "izmir",
  ankara: "ankara",
  antalya: "antalya",
  bursa: "bursa",
  adana: "adana",
  konya: "konya",
  samsun: "samsun",
};

export function cityToWeatherSlug(cityName: string): string | null {
  const key = cityName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace("i\u0307", "i") // dotted I fix
    .trim();
  return CITY_SLUG_MAP[key] ?? CITY_SLUG_MAP[cityName.toLowerCase()] ?? null;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface FrostRiskDay {
  date: string;
  frostRisk: number;
  tempMin: string | number;
}

export interface FrostRiskResult {
  riskDays: FrostRiskDay[];
  maxRisk: number;
}

export interface WeatherForecastDay {
  date: string;
  tempMin: string | number;
  tempMax: string | number;
  tempAvg: string | number;
  humidity: number;
  windSpeed: string | number;
  condition: string;
  icon: string;
  frostRisk: number;
  precipitation: string | number;
}

export interface WeatherCurrentData {
  tempCelsius: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  icon: string;
  pressure?: number;
}

export interface WeatherWidgetData {
  location: { name: string; city: string; region: string };
  current: WeatherCurrentData;
  forecast: WeatherForecastDay[];
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchFrostRisk(
  locationSlug: string,
): Promise<FrostRiskResult | null> {
  try {
    const url = `${WEATHER_API}/weather/frost-risk?location=${encodeURIComponent(locationSlug)}`;
    const res = await fetch(url, {
      headers: authHeaders(),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data?: FrostRiskResult };
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export async function fetchWeatherWidget(
  locationSlug: string,
): Promise<WeatherWidgetData | null> {
  try {
    const url = `${WEATHER_API}/weather/widget-data?location=${encodeURIComponent(locationSlug)}`;
    const res = await fetch(url, {
      headers: authHeaders(),
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success: boolean; data?: WeatherWidgetData };
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

// ── Frost severity ───────────────────────────────────────────────────────────

export type FrostLevel = "none" | "low" | "medium" | "high" | "extreme";

export function frostLevel(score: number): FrostLevel {
  if (score < 10) return "none";
  if (score < 30) return "low";
  if (score < 55) return "medium";
  if (score < 80) return "high";
  return "extreme";
}

export const FROST_LABELS: Record<FrostLevel, string> = {
  none: "Don riski yok",
  low: "Düşük don riski",
  medium: "Orta don riski",
  high: "Yüksek don riski",
  extreme: "Çok yüksek don riski",
};

export const FROST_COLORS: Record<FrostLevel, string> = {
  none: "text-emerald-400",
  low: "text-yellow-400",
  medium: "text-orange-400",
  high: "text-red-400",
  extreme: "text-red-500",
};
