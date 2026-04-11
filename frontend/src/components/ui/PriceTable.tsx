"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PriceRow, Market } from "@/lib/api";

interface PriceTableProps {
  initialPrices: PriceRow[];
  markets: Market[];
}

type CategoryFilter = "all" | "sebze" | "meyve" | "bakliyat";
type SortKey = "avg-asc" | "avg-desc" | "name-asc" | "date-desc";

interface CategoryOption {
  key: CategoryFilter;
  label: string;
}

const CATEGORIES: ReadonlyArray<CategoryOption> = [
  { key: "all", label: "Tümü" },
  { key: "sebze", label: "Sebze" },
  { key: "meyve", label: "Meyve" },
  { key: "bakliyat", label: "Bakliyat" },
] as const;

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "avg-desc", label: "Fiyat: Yüksek → Düşük" },
  { key: "avg-asc", label: "Fiyat: Düşük → Yüksek" },
  { key: "name-asc", label: "İsim (A-Z)" },
  { key: "date-desc", label: "Tarih (Yeni → Eski)" },
] as const;

const CATEGORY_DOT: Record<string, string> = {
  sebze: "bg-green-400",
  meyve: "bg-orange-400",
  bakliyat: "bg-yellow-400",
};

const SOURCE_BADGE: Record<string, string> = {
  ibb: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  izmir: "bg-green-500/15 text-green-300 border-green-500/30",
  manual: "bg-white/5 text-(--color-muted) border-white/10",
  seed: "bg-white/5 text-(--color-muted) border-white/10",
};

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
      return copy.sort(
        (a, b) => parseFloat(a.avgPrice) - parseFloat(b.avgPrice),
      );
    case "avg-desc":
      return copy.sort(
        (a, b) => parseFloat(b.avgPrice) - parseFloat(a.avgPrice),
      );
    case "name-asc":
      return copy.sort((a, b) =>
        a.productName.localeCompare(b.productName, "tr"),
      );
    case "date-desc":
      return copy.sort((a, b) =>
        b.recordedDate.localeCompare(a.recordedDate),
      );
    default:
      return copy;
  }
}

/**
 * Fiyat tablosu (client component).
 *
 * NEDEN client: Filtreleme/siralama tarayicida; URL state senkronu sonraki
 * sprintte gelir. Veri server'dan gelir, hidrasyon sonrasi state ile filtrelenir.
 */
export default function PriceTable({
  initialPrices,
  markets,
}: PriceTableProps) {
  const safePrices = Array.isArray(initialPrices) ? initialPrices : [];
  const safeMarkets = Array.isArray(markets) ? markets : [];

  const [city, setCity] = useState<string>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [sort, setSort] = useState<SortKey>("avg-desc");

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

  const filtered = useMemo(() => {
    const filteredRows = safePrices.filter((row) => {
      if (city !== "all" && row.cityName?.toLowerCase() !== city) return false;
      if (category !== "all" && row.categorySlug !== category) return false;
      return true;
    });
    return sortRows(filteredRows, sort);
  }, [safePrices, city, category, sort]);

  return (
    <div className="space-y-5">
      {/* Filtre bar */}
      <div className="flex flex-col gap-4 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Sol — Sehir + kategori */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none"
          >
            <option value="all">Tüm Şehirler</option>
            {cityOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-[10px] bg-(--color-bg-alt) p-1">
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={
                    "rounded-[7px] px-3 py-1.5 text-[12px] font-semibold transition-colors " +
                    (active
                      ? "bg-(--color-brand) text-(--color-navy)"
                      : "text-(--color-muted) hover:text-(--color-foreground)")
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sag — sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
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
                  Filtrelere uyan kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                const dotClass =
                  CATEGORY_DOT[row.categorySlug] ?? "bg-(--color-muted)";
                const sourceClass =
                  SOURCE_BADGE[row.sourceApi] ??
                  "bg-white/5 text-(--color-muted) border-white/10";
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
                        className={
                          "inline-flex items-center rounded-[5px] border px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.05em] " +
                          sourceClass
                        }
                      >
                        {row.sourceApi}
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

      <div className="text-right font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.1em] text-(--color-muted)">
        {filtered.length} kayıt
      </div>
    </div>
  );
}
