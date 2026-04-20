"use client";

import { useMemo, useState, useDeferredValue } from "react";
import Link from "next/link";
import type { PriceRow, Market } from "@/lib/api";

interface PriceTableProps {
  initialPrices: PriceRow[];
  markets: Market[];
}

type SortKey = "avg-desc" | "avg-asc" | "name-asc" | "date-desc";

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "avg-desc", label: "Fiyat: Yüksek → Düşük" },
  { key: "avg-asc", label: "Fiyat: Düşük → Yüksek" },
  { key: "name-asc", label: "İsim (A-Z)" },
  { key: "date-desc", label: "Tarih (Yeni → Eski)" },
] as const;

// Bilinen kategoriler için insan-okunur etiket. Haritada olmayan slug'lar
// `humanizeSlug()` ile "kebab-case" → "Kebab Case" olur.
const CATEGORY_LABEL: Record<string, string> = {
  sebze: "Sebze",
  meyve: "Meyve",
  balik: "Balık",
  "sebze-meyve": "Sebze & Meyve",
  ithal: "İthal",
  "ithal-donuk": "İthal (Donuk)",
  "tatli-su": "Tatlı Su",
  kultur: "Kültür",
  bakliyat: "Bakliyat",
  diger: "Diğer",
};

const CATEGORY_DOT: Record<string, string> = {
  sebze: "bg-green-400",
  meyve: "bg-orange-400",
  balik: "bg-sky-400",
  "sebze-meyve": "bg-lime-400",
  ithal: "bg-purple-400",
  "ithal-donuk": "bg-purple-300",
  "tatli-su": "bg-cyan-400",
  kultur: "bg-amber-400",
  bakliyat: "bg-yellow-400",
};

// Source key "izmir_sebzemeyve" → "izmir"; renklendirme familiyaya göre.
const SOURCE_FAMILY_BADGE: Record<string, string> = {
  izmir:     "bg-green-500/15 text-green-300 border-green-500/30",
  konya:     "bg-amber-500/15 text-amber-300 border-amber-500/30",
  kayseri:   "bg-red-500/15 text-red-300 border-red-500/30",
  eskisehir: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  denizli:   "bg-pink-500/15 text-pink-300 border-pink-500/30",
  antalya:   "bg-orange-500/15 text-orange-300 border-orange-500/30",
  ibb:       "bg-blue-500/15 text-blue-300 border-blue-500/30",
  manual:    "bg-white/10 text-(--color-muted) border-white/10",
};

function humanizeSlug(slug: string): string {
  if (CATEGORY_LABEL[slug]) return CATEGORY_LABEL[slug];
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1))
    .join(" ");
}

function sourceFamily(key: string): string {
  const first = (key || "").split("_")[0];
  return first || "manual";
}

// Türkçe karakter duyarsız arama için normalize (toLocaleLowerCase tr-TR şart —
// aksi halde "İ" combining dot verir ve eşleşme bozulur).
function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

function fmt(value: string | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function sortRows(rows: PriceRow[], key: SortKey): PriceRow[] {
  const copy = [...rows];
  switch (key) {
    case "avg-asc":
      return copy.sort((a, b) => parseFloat(a.avgPrice) - parseFloat(b.avgPrice));
    case "avg-desc":
      return copy.sort((a, b) => parseFloat(b.avgPrice) - parseFloat(a.avgPrice));
    case "name-asc":
      return copy.sort((a, b) => a.productName.localeCompare(b.productName, "tr"));
    case "date-desc":
      return copy.sort((a, b) => b.recordedDate.localeCompare(a.recordedDate));
    default:
      return copy;
  }
}

/**
 * Fiyat tablosu (client component).
 *
 * NEDEN client: Filtreleme/sıralama/arama tarayıcıda çalışır. Kategori chip'leri
 * veriden türetilir (yeni kaynak eklendiğinde otomatik listeye girer). Arama
 * ürün adında çalışır, Türkçe karakter duyarsızdır.
 */
export default function PriceTable({ initialPrices, markets }: PriceTableProps) {
  const safePrices = Array.isArray(initialPrices) ? initialPrices : [];
  const safeMarkets = Array.isArray(markets) ? markets : [];

  const [city, setCity] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("avg-desc");
  const [query, setQuery] = useState<string>("");
  const deferredQuery = useDeferredValue(query);

  const cityOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { slug: string; name: string }[] = [];
    const source: ReadonlyArray<{ cityName: string }> =
      safeMarkets.length > 0 ? safeMarkets : safePrices;
    for (const item of source) {
      const key = item.cityName?.toLowerCase() ?? "";
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push({ slug: key, name: item.cityName });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
  }, [safeMarkets, safePrices]);

  // Kategori seçenekleri verideki gerçek dağılımdan türetilir — sayı ile.
  // Böylece balık, ithal, sebze-meyve gibi yeni kategoriler hard-code
  // edilmeden listeye girer.
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of safePrices) {
      const key = p.categorySlug || "diger";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const list = [...counts.entries()]
      .map(([slug, count]) => ({ slug, label: humanizeSlug(slug), count }))
      .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label, "tr"));
    return [
      { slug: "all", label: "Tümü", count: safePrices.length },
      ...list,
    ];
  }, [safePrices]);

  const filtered = useMemo(() => {
    const nq = deferredQuery.trim() ? normalize(deferredQuery.trim()) : "";
    const rows = safePrices.filter((row) => {
      if (city !== "all" && row.cityName?.toLowerCase() !== city) return false;
      if (category !== "all" && (row.categorySlug || "diger") !== category) return false;
      if (nq && !normalize(row.productName).includes(nq)) return false;
      return true;
    });
    return sortRows(rows, sort);
  }, [safePrices, city, category, sort, deferredQuery]);

  const resetFilters = () => {
    setCity("all");
    setCategory("all");
    setQuery("");
    setSort("avg-desc");
  };

  const hasActiveFilter =
    city !== "all" || category !== "all" || query.trim() !== "" || sort !== "avg-desc";

  return (
    <div className="space-y-5">
      {/* Filtre bar */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-4">
        {/* Üst sıra — arama + şehir + sıralama */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-md">
            <svg
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-muted)"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={11} cy={11} r={7} />
              <path d="m20 20-3-3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ürün adı ara… (ör. domates, biber, hamsi)"
              aria-label="Ürün ara"
              className="w-full rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) py-2 pl-9 pr-8 text-[13px] text-(--color-foreground) placeholder:text-(--color-muted) focus:border-(--color-brand) focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Aramayı temizle"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-(--color-muted) hover:bg-(--color-border) hover:text-(--color-foreground)"
              >
                ×
              </button>
            )}
          </div>

          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="Şehir"
            className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none"
          >
            <option value="all">Tüm Şehirler</option>
            {cityOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sıralama"
            className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none md:ml-auto"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Alt sıra — kategori chip'leri (yatay scroll), sağda reset */}
        <div className="flex items-center gap-3">
          <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryOptions.map((c) => {
              const active = category === c.slug;
              const dot = c.slug !== "all" ? CATEGORY_DOT[c.slug] : null;
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors " +
                    (active
                      ? "border-(--color-brand) bg-(--color-brand) text-(--color-navy)"
                      : "border-(--color-border) bg-(--color-bg-alt) text-(--color-muted) hover:text-(--color-foreground)")
                  }
                  aria-pressed={active}
                >
                  {dot && (
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full ${dot}`}
                    />
                  )}
                  <span>{c.label}</span>
                  <span
                    className={
                      "font-(family-name:--font-mono) text-[10px] " +
                      (active ? "text-(--color-navy)/70" : "opacity-60")
                    }
                  >
                    {c.count}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-1.5 text-[12px] font-semibold text-(--color-muted) transition-colors hover:text-(--color-foreground)"
            >
              Sıfırla
            </button>
          )}
        </div>
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto rounded-[14px] border border-(--color-border) bg-(--color-surface)">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-(--color-border) text-left">
              <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Ürün
              </th>
              <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Hal
              </th>
              <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Şehir
              </th>
              <th className="px-4 py-3 text-right font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Min
              </th>
              <th className="px-4 py-3 text-right font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Ort
              </th>
              <th className="px-4 py-3 text-right font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Maks
              </th>
              <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Kaynak
              </th>
              <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Tarih
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-[13px] text-(--color-muted)"
                >
                  {safePrices.length === 0
                    ? "Henüz fiyat verisi yok. ETL'in çalışmasını bekleyin."
                    : "Filtrelere uyan kayıt bulunamadı."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const categoryKey = row.categorySlug || "diger";
                const dotClass = CATEGORY_DOT[categoryKey] ?? "bg-(--color-muted)";
                const family = sourceFamily(row.sourceApi);
                const sourceClass =
                  SOURCE_FAMILY_BADGE[family] ??
                  "bg-white/10 text-(--color-muted) border-white/10";
                return (
                  <tr
                    key={row.id}
                    className="border-b border-(--color-border)/50 transition-colors last:border-b-0 hover:bg-(--color-bg-alt)"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/urun/${row.productSlug}`}
                        className="flex items-center gap-2 text-[14px] font-semibold text-(--color-foreground) hover:text-(--color-brand)"
                      >
                        <span
                          aria-hidden
                          title={humanizeSlug(categoryKey)}
                          className={`h-2 w-2 rounded-full ${dotClass}`}
                        />
                        {row.productName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/hal/${row.marketSlug}`}
                        className="text-[13px] text-(--color-muted) hover:text-(--color-brand)"
                      >
                        {row.marketName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-(--color-muted)">
                      {row.cityName}
                    </td>
                    <td className="px-4 py-3.5 text-right font-(family-name:--font-mono) text-[13px] text-(--color-muted)">
                      ₺{fmt(row.minPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-(family-name:--font-mono) text-[15px] font-bold text-(--color-foreground)">
                      ₺{fmt(row.avgPrice)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-(family-name:--font-mono) text-[13px] text-(--color-muted)">
                      ₺{fmt(row.maxPrice)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        title={row.sourceApi}
                        className={
                          "inline-flex items-center rounded-[5px] border px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.05em] " +
                          sourceClass
                        }
                      >
                        {family}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
                      {formatDate(row.recordedDate)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.1em] text-(--color-muted)">
        <span>
          {filtered.length} / {safePrices.length} kayıt
        </span>
        {deferredQuery.trim() && (
          <span className="text-(--color-foreground)">
            &ldquo;{deferredQuery.trim()}&rdquo; için sonuçlar
          </span>
        )}
      </div>
    </div>
  );
}
