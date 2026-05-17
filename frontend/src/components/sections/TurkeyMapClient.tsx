"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CityPriceMapItem, Market } from "@/lib/api";
import { CITY_COORDS } from "@/lib/city-coords";

interface CityGroup {
  cityName: string;
  markets: Market[];
  price: CityPriceMapItem | null;
  x: number;
  y: number;
}

interface Props {
  markets: Market[];
  cityPrices?: CityPriceMapItem[];
}

const VIEWBOX = { width: 980, height: 430 };
const LNG_MIN = 25.4;
const LNG_MAX = 44.8;
const LAT_MIN = 35.6;
const LAT_MAX = 42.4;

function normCity(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

const CITY_ALIASES: Record<string, string> = {
  "afyon": "afyonkarahisar",
  "içel": "mersin",
  "icel": "mersin",
  "maraş": "kahramanmaraş",
  "k maraş": "kahramanmaraş",
  "k. maraş": "kahramanmaraş",
  "urfa": "şanlıurfa",
  "sanliurfa": "şanlıurfa",
};

function cityKey(value: string): string {
  const normalized = normCity(value);
  return CITY_ALIASES[normalized] ?? normalized;
}

function project(lat: number, lng: number) {
  const x = 44 + ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * 892;
  const y = 34 + ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * 342;
  return { x, y };
}

function formatPrice(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value as number);
}

function colorFor(value: number | null | undefined, min: number, max: number) {
  if (!Number.isFinite(value ?? NaN)) return "#334155";
  if (max <= min) return "#f6b934";
  const ratio = Math.min(1, Math.max(0, ((value as number) - min) / (max - min)));
  const hue = 132 - ratio * 128;
  return `hsl(${hue} 72% 46%)`;
}

function groupByCity(markets: Market[], prices: CityPriceMapItem[]): CityGroup[] {
  const marketMap = new Map<string, Market[]>();
  for (const market of markets) {
    if (!market.cityName || market.regionSlug === "ulusal") continue;
    const key = cityKey(market.cityName);
    marketMap.set(key, [...(marketMap.get(key) ?? []), market]);
  }

  const priceMap = new Map(prices.map((item) => [cityKey(item.cityName), item]));

  return Object.entries(CITY_COORDS)
    .filter(([cityName]) => cityName !== "İçel")
    .map(([cityName, coords]) => {
      const key = cityKey(cityName);
      return {
        cityName,
        markets: marketMap.get(key) ?? [],
        price: priceMap.get(key) ?? null,
        ...project(coords.lat, coords.lng),
      };
    })
    .sort((a, b) => a.cityName.localeCompare(b.cityName, "tr-TR"));
}

export default function TurkeyMapClient({ markets, cityPrices = [] }: Props) {
  const cities = useMemo(() => groupByCity(markets, cityPrices), [markets, cityPrices]);
  const priced = cities.filter((city) => city.price && Number.isFinite(city.price.avgPrice));
  const minPrice = Math.min(...priced.map((city) => city.price!.avgPrice));
  const maxPrice = Math.max(...priced.map((city) => city.price!.avgPrice));
  const [activeCityName, setActiveCityName] = useState<string>(() => priced[0]?.cityName ?? "İstanbul");
  const activeCity = cities.find((city) => city.cityName === activeCityName) ?? cities[0] ?? null;
  const cheapest = [...priced].sort((a, b) => a.price!.avgPrice - b.price!.avgPrice).slice(0, 3);
  const expensive = [...priced].sort((a, b) => b.price!.avgPrice - a.price!.avgPrice).slice(0, 3);

  return (
    <div className="grid h-full min-h-[620px] gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative overflow-hidden rounded-[18px] border border-(--color-border) bg-(--color-surface)">
        <div className="absolute left-4 top-4 z-10 rounded-[12px] border border-(--color-border) bg-(--color-bg)/90 px-3 py-2 backdrop-blur">
          <div className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Türkiye Fiyat Haritası
          </div>
          <div className="mt-1 text-[12px] text-(--color-muted)">
            {priced.length} ilde güncel veri · {cities.length} il SVG
          </div>
        </div>

        <svg
          viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          role="img"
          aria-label="Türkiye il bazlı hal fiyat haritası"
          className="h-full min-h-[460px] w-full"
        >
          <defs>
            <linearGradient id="price-map-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#f6b934" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="city-shadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#020617" floodOpacity="0.22" />
            </filter>
          </defs>

          <path
            d="M62 176 C116 92 224 69 333 82 C420 92 464 56 543 76 C632 98 689 72 771 116 C846 156 913 149 934 215 C951 269 881 313 798 313 C724 313 658 354 563 331 C485 312 431 348 348 329 C252 307 194 342 114 299 C55 268 24 225 62 176 Z"
            fill="currentColor"
            className="text-(--color-bg-alt)"
            opacity="0.58"
          />
          <path
            d="M70 176 C121 103 229 82 333 93 C421 103 468 70 541 90 C629 113 688 86 764 126 C833 162 898 158 921 214 C938 258 875 297 795 298 C720 299 660 337 567 316 C487 298 433 332 354 314 C255 292 201 326 124 287 C70 260 38 224 70 176 Z"
            fill="none"
            stroke="currentColor"
            className="text-(--color-border)"
            strokeWidth="1.5"
            opacity="0.65"
          />

          {cities.map((city) => {
            const hasData = !!city.price;
            const active = activeCity?.cityName === city.cityName;
            const fill = colorFor(city.price?.avgPrice, minPrice, maxPrice);
            const radius = city.markets.length > 0 ? 8.2 : 6.2;
            return (
              <g key={city.cityName}>
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={`${city.cityName} fiyat detayı`}
                  onClick={() => setActiveCityName(city.cityName)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setActiveCityName(city.cityName);
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={active ? radius + 3 : radius}
                    fill={fill}
                    opacity={hasData ? 0.96 : 0.42}
                    stroke={active ? "#ffffff" : "rgba(255,255,255,0.62)"}
                    strokeWidth={active ? 3 : 1.4}
                    filter={active ? "url(#city-shadow)" : undefined}
                    className="transition-all duration-200 hover:opacity-100"
                  />
                </g>
                {(active || city.markets.length > 1) && (
                  <text
                    x={city.x}
                    y={city.y - 13}
                    textAnchor="middle"
                    className="pointer-events-none select-none fill-(--color-foreground) font-(family-name:--font-mono) text-[10px] font-semibold"
                  >
                    {city.cityName}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-4 left-4 right-4 rounded-[12px] border border-(--color-border) bg-(--color-bg)/92 p-3 backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-(--color-muted)">
            <span>Ucuz</span>
            <span>Pahalı</span>
          </div>
          <div className="h-2 rounded-full bg-[linear-gradient(90deg,#22c55e,#f6b934,#ef4444)]" />
          <div className="mt-2 flex items-center justify-between gap-3 font-(family-name:--font-mono) text-[10px] text-(--color-muted)">
            <span>{formatPrice(Number.isFinite(minPrice) ? minPrice : null)}</span>
            <span>Veri yok: gri</span>
            <span>{formatPrice(Number.isFinite(maxPrice) ? maxPrice : null)}</span>
          </div>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-4">
        {activeCity && (
          <div className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
            <div className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
              Seçili İl
            </div>
            <h3 className="mt-1 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
              {activeCity.cityName}
            </h3>
            {activeCity.price ? (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Ortalama" value={formatPrice(activeCity.price.avgPrice)} strong />
                <Metric label="Aralık" value={`${formatPrice(activeCity.price.minPrice)} - ${formatPrice(activeCity.price.maxPrice)}`} />
                <Metric label="Hal" value={`${activeCity.price.marketCount}`} />
                <Metric label="Ürün" value={`${activeCity.price.productCount}`} />
              </div>
            ) : (
              <p className="mt-4 rounded-[12px] border border-dashed border-(--color-border) p-4 text-[13px] text-(--color-muted)">
                Bu il için son fiyat penceresinde veri bulunamadı.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {activeCity.markets.slice(0, 5).map((market) => (
                <Link
                  key={market.id}
                  href={`/hal/${market.slug}`}
                  className="flex items-center justify-between rounded-[12px] border border-(--color-border-soft) bg-(--color-bg-alt) px-3 py-2 text-[13px] font-medium text-(--color-foreground) transition-colors hover:border-(--color-brand)/40 hover:text-(--color-brand)"
                >
                  <span>{market.name}</span>
                  <span aria-hidden>→</span>
                </Link>
              ))}
            </div>

            <Link
              href={`/fiyatlar?city=${encodeURIComponent(activeCity.cityName)}`}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[12px] bg-(--color-brand) px-4 text-[13px] font-bold text-(--color-brand-fg) transition-opacity hover:opacity-90"
            >
              Bu ilin fiyatlarını aç
            </Link>
          </div>
        )}

        <RankCard title="En Uygun Ortalama" rows={cheapest} tone="green" onSelect={setActiveCityName} />
        <RankCard title="En Yüksek Ortalama" rows={expensive} tone="red" onSelect={setActiveCityName} />
      </aside>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-[12px] border border-(--color-border-soft) bg-(--color-bg-alt) p-3">
      <div className="font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.08em] text-(--color-muted)">
        {label}
      </div>
      <div className={(strong ? "text-[18px] font-bold" : "text-[12px] font-semibold") + " mt-1 text-(--color-foreground)"}>
        {value}
      </div>
    </div>
  );
}

function RankCard({
  title,
  rows,
  tone,
  onSelect,
}: {
  title: string;
  rows: CityGroup[];
  tone: "green" | "red";
  onSelect: (cityName: string) => void;
}) {
  const color = tone === "green" ? "text-emerald-500" : "text-red-500";
  return (
    <div className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
      <h4 className="font-(family-name:--font-display) text-[15px] font-bold text-(--color-foreground)">
        {title}
      </h4>
      <div className="mt-3 space-y-2">
        {rows.map((city, index) => (
          <button
            key={city.cityName}
            type="button"
            className="flex w-full items-center justify-between rounded-[12px] bg-(--color-bg-alt) px-3 py-2 text-left text-[13px] transition-colors hover:bg-(--color-brand)/10"
            onClick={() => onSelect(city.cityName)}
          >
            <span className="font-medium text-(--color-foreground)">
              {index + 1}. {city.cityName}
            </span>
            <span className={`font-(family-name:--font-mono) text-[12px] font-semibold ${color}`}>
              {formatPrice(city.price?.avgPrice)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
