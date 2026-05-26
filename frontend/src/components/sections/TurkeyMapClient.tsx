"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CityPriceMapItem, Market } from "@/lib/api";
import { TURKEY_PROVINCES, TURKEY_VIEWBOX } from "@/lib/turkey-geo";

interface Props {
  markets: Market[];
  cityPrices?: CityPriceMapItem[];
}

function normCity(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
}

const CITY_ALIASES: Record<string, string> = {
  afyon: "afyonkarahisar",
  içel: "mersin",
  icel: "mersin",
  maraş: "kahramanmaraş",
  "k maraş": "kahramanmaraş",
  "k. maraş": "kahramanmaraş",
  urfa: "şanlıurfa",
  sanliurfa: "şanlıurfa",
};

function cityKey(value: string): string {
  const n = normCity(value);
  return CITY_ALIASES[n] ?? n;
}

function formatPrice(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN)) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value as number);
}

// priceIndex: 1.00 = Türkiye sepet ortalaması. İndeks olarak göster.
function formatIndex(idx: number | null | undefined): string {
  if (!Number.isFinite(idx ?? NaN)) return "-";
  return `${(idx as number).toFixed(2)}×`;
}

function indexLabel(idx: number | null | undefined): string {
  if (!Number.isFinite(idx ?? NaN)) return "veri yok";
  const pct = Math.round(((idx as number) - 1) * 100);
  if (pct === 0) return "Türkiye ortalamasında";
  return pct > 0
    ? `Türkiye ortalamasının %${pct} üzerinde`
    : `Türkiye ortalamasının %${Math.abs(pct)} altında`;
}

// Ucuz (yeşil) → pahalı (kırmızı). Verisi olmayan il nötr gri.
function colorFor(value: number | null | undefined, min: number, max: number) {
  if (!Number.isFinite(value ?? NaN)) return "var(--color-bg-alt)";
  if (max <= min) return "hsl(48 90% 52%)";
  const ratio = Math.min(1, Math.max(0, ((value as number) - min) / (max - min)));
  return `hsl(${132 - ratio * 128} 70% 46%)`;
}

interface ProvinceRow {
  code: string;
  name: string;
  d: string;
  markets: Market[];
  price: CityPriceMapItem | null;
}

function buildRows(markets: Market[], prices: CityPriceMapItem[]): ProvinceRow[] {
  const marketMap = new Map<string, Market[]>();
  for (const m of markets) {
    if (!m.cityName || m.regionSlug === "ulusal") continue;
    const k = cityKey(m.cityName);
    marketMap.set(k, [...(marketMap.get(k) ?? []), m]);
  }
  const priceMap = new Map(prices.map((p) => [cityKey(p.cityName), p]));
  return TURKEY_PROVINCES.map((p) => ({
    code: p.code,
    name: p.name,
    d: p.d,
    markets: marketMap.get(cityKey(p.name)) ?? [],
    price: priceMap.get(cityKey(p.name)) ?? null,
  }));
}

export default function TurkeyMapClient({ markets, cityPrices = [] }: Props) {
  const rows = useMemo(() => buildRows(markets, cityPrices), [markets, cityPrices]);
  // Karşılaştırılabilir metrik: priceIndex (sepet-normalize). Ham avgPrice
  // iller farklı ürün karışımı raporladığı için kıyas dışıdır.
  const priced = rows.filter(
    (r) => r.price && Number.isFinite(r.price.priceIndex ?? NaN),
  );
  const idxOf = (r: ProvinceRow) => r.price!.priceIndex as number;
  const minIdx = priced.length ? Math.min(...priced.map(idxOf)) : 0;
  const maxIdx = priced.length ? Math.max(...priced.map(idxOf)) : 0;

  const [activeName, setActiveName] = useState<string>(
    () => priced[0]?.name ?? "İstanbul",
  );
  const active = rows.find((r) => r.name === activeName) ?? rows[0] ?? null;
  const cheapest = [...priced].sort((a, b) => idxOf(a) - idxOf(b)).slice(0, 3);
  const expensive = [...priced].sort((a, b) => idxOf(b) - idxOf(a)).slice(0, 3);

  return (
    <div className="grid h-full min-h-[620px] gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="relative overflow-hidden rounded-[18px] border border-(--color-border) bg-(--color-surface)">
        <div className="absolute left-4 top-4 z-10 rounded-[12px] border border-(--color-border) bg-(--color-bg)/90 px-3 py-2 backdrop-blur">
          <div className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Türkiye Fiyat Haritası
          </div>
          <div className="mt-1 text-[12px] text-(--color-muted)">
            {priced.length} ilde güncel veri · {rows.length} il
          </div>
        </div>

        <svg
          viewBox={`0 0 ${TURKEY_VIEWBOX.width} ${TURKEY_VIEWBOX.height}`}
          role="img"
          aria-label="Türkiye il bazlı hal fiyat haritası"
          className="h-auto w-full"
        >
          {rows.map((p) => {
            const isActive = active?.name === p.name;
            const idx = p.price?.priceIndex ?? null;
            return (
              <path
                key={p.code}
                d={p.d}
                fill={colorFor(idx, minIdx, maxIdx)}
                fillOpacity={idx != null ? 0.95 : 0.5}
                stroke={isActive ? "var(--color-foreground)" : "var(--color-border)"}
                strokeWidth={isActive ? 2.2 : 0.6}
                role="button"
                tabIndex={0}
                aria-label={`${p.name}${idx != null ? ` fiyat endeksi ${formatIndex(idx)}` : " (veri yok)"}`}
                onClick={() => setActiveName(p.name)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setActiveName(p.name);
                }}
                className="cursor-pointer outline-none transition-opacity hover:opacity-80"
              >
                <title>
                  {p.name}
                  {idx != null
                    ? ` — endeks ${formatIndex(idx)} (${indexLabel(idx)})`
                    : " — veri yok"}
                </title>
              </path>
            );
          })}
        </svg>

        <div className="absolute bottom-4 left-4 right-4 rounded-[12px] border border-(--color-border) bg-(--color-bg)/92 p-3 backdrop-blur">
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-(--color-muted)">
            <span>Ucuz</span>
            <span>Fiyat Endeksi · 1.00 = Türkiye ort.</span>
            <span>Pahalı</span>
          </div>
          <div className="h-2 rounded-full bg-[linear-gradient(90deg,hsl(132_70%_46%),hsl(68_70%_46%),hsl(4_70%_46%))]" />
          <div className="mt-2 flex items-center justify-between gap-3 font-(family-name:--font-mono) text-[10px] text-(--color-muted)">
            <span>{priced.length ? formatIndex(minIdx) : "-"}</span>
            <span>Veri yok: gri</span>
            <span>{priced.length ? formatIndex(maxIdx) : "-"}</span>
          </div>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-4">
        {active && (
          <div className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
            <div className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
              Seçili İl
            </div>
            <h3 className="mt-1 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
              {active.name}
            </h3>
            {active.price ? (
              <div className="mt-4 space-y-3">
                {active.price.priceIndex != null && (
                  <div className="rounded-[12px] border border-(--color-brand)/30 bg-(--color-brand)/10 p-3">
                    <div className="font-(family-name:--font-mono) text-[10px] uppercase tracking-[0.08em] text-(--color-muted)">
                      Fiyat Endeksi · {active.price.basketProductCount} ürünlük sepet
                    </div>
                    <div className="mt-1 text-[22px] font-bold text-(--color-foreground)">
                      {formatIndex(active.price.priceIndex)}
                    </div>
                    <div className="text-[12px] text-(--color-muted)">
                      {indexLabel(active.price.priceIndex)}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Metric label="Sepet ortalaması" value={formatPrice(active.price.basketAvg)} strong />
                  <Metric label="Aralık (tüm ürün)" value={`${formatPrice(active.price.minPrice)} - ${formatPrice(active.price.maxPrice)}`} />
                  <Metric label="Hal" value={`${active.price.marketCount}`} />
                  <Metric label="Ürün" value={`${active.price.productCount}`} />
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-[12px] border border-dashed border-(--color-border) p-4 text-[13px] text-(--color-muted)">
                Bu il için son fiyat penceresinde veri bulunamadı.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {active.markets.slice(0, 5).map((market) => (
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
              href={`/fiyatlar?city=${encodeURIComponent(active.name)}`}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[12px] bg-(--color-brand) px-4 text-[13px] font-bold text-(--color-brand-fg) transition-opacity hover:opacity-90"
            >
              Bu ilin fiyatlarını aç
            </Link>
          </div>
        )}

        <RankCard title="En Uygun Ortalama" rows={cheapest} tone="green" onSelect={setActiveName} />
        <RankCard title="En Yüksek Ortalama" rows={expensive} tone="red" onSelect={setActiveName} />
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
  rows: ProvinceRow[];
  tone: "green" | "red";
  onSelect: (name: string) => void;
}) {
  const color = tone === "green" ? "text-(--color-success)" : "text-(--color-danger)";
  return (
    <div className="rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
      <h4 className="font-(family-name:--font-display) text-[15px] font-bold text-(--color-foreground)">
        {title}
      </h4>
      <div className="mt-3 space-y-2">
        {rows.length === 0 && (
          <p className="text-[12px] text-(--color-muted)">Veri bekleniyor.</p>
        )}
        {rows.map((p, index) => (
          <button
            key={p.code}
            type="button"
            className="flex w-full items-center justify-between rounded-[12px] bg-(--color-bg-alt) px-3 py-2 text-left text-[13px] transition-colors hover:bg-(--color-brand)/10"
            onClick={() => onSelect(p.name)}
          >
            <span className="font-medium text-(--color-foreground)">
              {index + 1}. {p.name}
            </span>
            <span className={`font-(family-name:--font-mono) text-[12px] font-semibold ${color}`}>
              {formatIndex(p.price?.priceIndex)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
