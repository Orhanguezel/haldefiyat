"use client";

import { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import Link from "next/link";
import { productHref } from "@/lib/product-links";
import { sourceCompactLabel, sourceDisplayName } from "@/lib/source-display";
import { apiGet } from "@/lib/api-client";
import type { PriceRow, Market, PriceListResponse, PriceListMeta, FetchPricesParams } from "@/lib/api";
import Pagination from "@/components/ui/Pagination";
import { StatusState } from "@/components/ui/StatusState";
import ExportButton from "@/components/ui/ExportButton";
import { trackDiscoveryEvent } from "@/lib/analytics";

interface PriceTableProps {
  initialPrices?: PriceRow[];
  initialPricePage?: PriceListResponse;
  markets: Market[];
  requestParams?: Pick<FetchPricesParams, "range" | "latestOnly" | "product" | "market" | "marketType" | "sort" | "unit">;
  initialCategory?: string;
  initialCity?: string;
  initialMarket?: string;
  initialUnit?: string;
  initialQuery?: string;
  syncUrl?: boolean;
  showExport?: boolean;
  yoyByMarket?: Record<string, number>;
  hideProductColumn?: boolean;
  hideMarketColumn?: boolean;
  hideCityColumn?: boolean;
}

type SortKey = "avg-desc" | "avg-asc" | "name-asc" | "date-desc";

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "avg-desc", label: "En yüksek ortalama fiyat" },
  { key: "avg-asc", label: "En düşük ortalama fiyat" },
  { key: "name-asc", label: "Ürün adı (A–Z)" },
  { key: "date-desc", label: "En güncel kayıt tarihi" },
] as const;

const RANGE_OPTIONS = [
  { value: "1d", label: "Son veri günü" },
  { value: "7d", label: "Son 7 gün" },
  { value: "30d", label: "Son 30 gün" },
  { value: "90d", label: "Son 90 gün" },
  { value: "365d", label: "Son 1 yıl" },
] as const;

const UNIT_OPTIONS = ["kg", "adet", "bag", "demet", "kasa", "koli", "paket", "ton", "litre"] as const;

function unitLabel(value: string): string {
  const labels: Record<string, string> = {
    kg: "Kg",
    adet: "Adet",
    bag: "Bağ",
    demet: "Demet",
    kasa: "Kasa",
    koli: "Koli",
    paket: "Paket",
    ton: "Ton",
    litre: "Litre",
  };
  return labels[value] ?? humanizeSlug(value);
}

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
  hububat: "Hububat",
  "yagli-tohum": "Yağlı Tohum",
  "sanayi-bitkisi": "Sanayi Bitkisi",
  diger: "Diğer",
};

// /fiyatlar sayfasında tüm geçmiş kayıtlar sayfalandırılırken yalnızca fiyat
// geçmişinde gerçekten veri olan ana kategorileri gösteriyoruz.
const PRICE_TABLE_CATEGORY_SLUGS = [
  "sebze-meyve",
  "sebze",
  "meyve",
  "balik",
  "ithal",
] as const;

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
  hal:       "bg-teal-500/15 text-teal-300 border-teal-500/30",
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

function toPriceNumber(value: string | number | null | undefined): number {
  if (value == null || value === "") return NaN;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : NaN;
}

function fmt(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = toPriceNumber(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const raw = iso.includes("T") ? iso : `${iso.slice(0, 10)}T12:00:00Z`;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sortRows(rows: PriceRow[], key: SortKey): PriceRow[] {
  const copy = [...rows];
  switch (key) {
    case "avg-asc":
      return copy.sort((a, b) => toPriceNumber(a.avgPrice) - toPriceNumber(b.avgPrice));
    case "avg-desc":
      return copy.sort((a, b) => toPriceNumber(b.avgPrice) - toPriceNumber(a.avgPrice));
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
export default function PriceTable({
  initialPrices,
  initialPricePage,
  markets,
  requestParams,
  initialCategory,
  initialCity,
  initialMarket,
  initialUnit,
  initialQuery,
  syncUrl = false,
  showExport = false,
  yoyByMarket,
  hideProductColumn = false,
  hideMarketColumn = false,
  hideCityColumn = false,
}: PriceTableProps) {
  const initialMeta = initialPricePage?.meta;
  const serverPagination = Boolean(initialPricePage);
  const isBorsaTable = requestParams?.marketType === "borsa";
  const visibleColumnCount =
    8 -
    Number(hideProductColumn) -
    Number(hideMarketColumn) -
    Number(hideCityColumn);
  const initialSort = requestParams?.sort ?? "avg-desc";
  const defaultSort: SortKey = syncUrl ? "date-desc" : initialSort;
  const defaultRange = syncUrl ? "30d" : (requestParams?.range || "7d");
  const [prices, setPrices] = useState<PriceRow[]>(
    initialPricePage?.items ?? (Array.isArray(initialPrices) ? initialPrices : []),
  );
  const [meta, setMeta] = useState<PriceListMeta | null>(initialMeta ?? null);
  const [page, setPage] = useState<number>(initialMeta?.page ?? 1);
  const [pageSize, setPageSize] = useState<number>(initialMeta?.limit ?? 100);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const safePrices = Array.isArray(prices) ? prices : [];
  const safeMarkets = Array.isArray(markets) ? markets : [];

  const [city, setCity] = useState<string>(initialCity || "all");
  const [market, setMarket] = useState<string>(initialMarket || requestParams?.market || "all");
  const [category, setCategory] = useState<string>(initialCategory || "all");
  const [unit, setUnit] = useState<string>(initialUnit || requestParams?.unit || "all");
  const [range, setRange] = useState<string>(requestParams?.range || "7d");
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [query, setQuery] = useState<string>(initialQuery || "");
  const deferredQuery = useDeferredValue(query);
  const previousFilterRef = useRef({
    queryLength: (initialQuery || "").trim().length,
    city: initialCity || "all",
    market: initialMarket || requestParams?.market || "all",
    category: initialCategory || "all",
    unit: initialUnit || requestParams?.unit || "all",
    range: requestParams?.range || "7d",
    sort: initialSort,
    pageSize: initialMeta?.limit ?? 100,
  });
  const zeroResultSignatureRef = useRef("");

  useEffect(() => {
    if (!serverPagination) return;
    setPage(1);
  }, [serverPagination, city, market, category, unit, range, sort, deferredQuery, pageSize]);

  useEffect(() => {
    if (!serverPagination) return;
    let cancelled = false;
    const params = {
      latestOnly: requestParams?.latestOnly ?? true,
      product: requestParams?.product,
      market: market === "all" ? requestParams?.market : market,
      marketType: requestParams?.marketType,
      page,
      limit: pageSize,
      sort,
      city: city === "all" ? undefined : city,
      category: category === "all" ? undefined : category,
      unit: unit === "all" ? undefined : unit,
      range,
      q: deferredQuery.trim() || undefined,
    };

    setLoading(true);
    setLoadError(false);
    apiGet<PriceListResponse>("/prices", params)
      .then((result) => {
        if (cancelled) return;
        setPrices(Array.isArray(result.items) ? result.items : []);
        setMeta(result.meta ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(true);
          console.error("[PriceTable] fiyatlar yüklenemedi", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    serverPagination,
    page,
    pageSize,
    city,
    category,
    sort,
    deferredQuery,
    requestParams?.range,
    requestParams?.latestOnly,
    requestParams?.product,
    requestParams?.market,
    requestParams?.marketType,
    market,
    unit,
    range,
    retryToken,
  ]);

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

  const marketOptions = useMemo(() => safeMarkets
    .filter((item) => city === "all" || item.cityName?.toLocaleLowerCase("tr-TR") === city)
    .map((item) => ({ slug: item.slug, name: item.name, cityName: item.cityName }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr")), [safeMarkets, city]);

  const unitOptions = useMemo(() => {
    const values = new Set<string>(UNIT_OPTIONS);
    for (const row of safePrices) {
      if (row.unit?.trim()) values.add(row.unit.trim());
    }
    return [...values].sort((a, b) => unitLabel(a).localeCompare(unitLabel(b), "tr"));
  }, [safePrices]);

  // Kategori seçenekleri verideki gerçek dağılımdan türetilir — sayı ile.
  // Böylece balık, ithal, sebze-meyve gibi yeni kategoriler hard-code
  // edilmeden listeye girer.
  const categoryOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of safePrices) {
      const key = p.categorySlug || "diger";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const categorySlugs = serverPagination && !requestParams?.marketType
      ? [...PRICE_TABLE_CATEGORY_SLUGS]
      : [...counts.keys()];
    const list = categorySlugs
      .map((slug) => ({ slug, label: humanizeSlug(slug), count: counts.get(slug) ?? 0 }))
      .sort((a, b) => a.label.localeCompare(b.label, "tr"));
    return [
      { slug: "all", label: "Tümü", count: meta?.total ?? safePrices.length },
      ...list,
    ];
  }, [safePrices, serverPagination, requestParams?.marketType, meta?.total]);

  const filtered = useMemo(() => {
    if (serverPagination) return safePrices;
    const nq = deferredQuery.trim() ? normalize(deferredQuery.trim()) : "";
    const rows = safePrices.filter((row) => {
      if (city !== "all" && row.cityName?.toLowerCase() !== city) return false;
      if (market !== "all" && row.marketSlug !== market) return false;
      if (category !== "all" && (row.categorySlug || "diger") !== category) return false;
      if (unit !== "all" && row.unit !== unit) return false;
      if (nq && !normalize(row.productName).includes(nq)) return false;
      return true;
    });
    return sortRows(rows, sort);
  }, [safePrices, city, market, category, unit, sort, deferredQuery, serverPagination]);

  const resetFilters = () => {
    setCity("all");
    setMarket("all");
    setCategory("all");
    setUnit("all");
    setRange(defaultRange);
    setQuery("");
    setSort(defaultSort);
  };

  const hasActiveFilter =
    city !== "all" || market !== "all" || category !== "all" || unit !== "all" ||
    range !== defaultRange || query.trim() !== "" || sort !== defaultSort;
  const total = meta?.total ?? safePrices.length;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? page;
  const showingStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(total, (currentPage - 1) * pageSize + filtered.length);
  const activeFilterCount = [
    deferredQuery.trim() !== "",
    city !== "all",
    market !== "all",
    category !== "all",
    unit !== "all",
    range !== defaultRange,
    sort !== defaultSort,
  ].filter(Boolean).length;
  const staleCount = filtered.filter((row) => row.isStale).length;
  const freshCount = filtered.length - staleCount;

  useEffect(() => {
    if (!syncUrl || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    for (const key of ["q", "city", "market", "category", "unit", "range", "sort", "page", "limit"]) {
      params.delete(key);
    }
    if (deferredQuery.trim()) params.set("q", deferredQuery.trim());
    if (city !== "all") params.set("city", city);
    if (market !== "all") params.set("market", market);
    if (category !== "all") params.set("category", category);
    if (unit !== "all") params.set("unit", unit);
    if (range !== defaultRange) params.set("range", range);
    if (sort !== defaultSort) params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (pageSize !== 100) params.set("limit", String(pageSize));
    const queryString = params.toString();
    const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);

    const next = {
      queryLength: deferredQuery.trim().length,
      city,
      market,
      category,
      unit,
      range,
      sort,
      pageSize,
    };
    const previous = previousFilterRef.current;
    const changed = (Object.keys(next) as Array<keyof typeof next>).find((key) => next[key] !== previous[key]);
    previousFilterRef.current = next;
    if (!changed) return;
    const filterName = changed === "queryLength" ? "query" : changed === "pageSize" ? "page_size" : changed;
    const rawValue = next[changed];
    trackDiscoveryEvent("price_filter_changed", {
      filter_name: filterName,
      filter_value: changed === "queryLength" ? `${rawValue}_chars` : String(rawValue).slice(0, 100),
      query_length: deferredQuery.trim().length,
      active_filter_count: activeFilterCount,
    });
  }, [
    syncUrl,
    deferredQuery,
    city,
    market,
    category,
    unit,
    range,
    sort,
    page,
    pageSize,
    defaultRange,
    defaultSort,
    activeFilterCount,
  ]);

  useEffect(() => {
    if (loading || loadError || total !== 0 || activeFilterCount === 0) return;
    const signature = [deferredQuery.trim().length, city, market, category, unit, range, sort].join("|");
    if (zeroResultSignatureRef.current === signature) return;
    zeroResultSignatureRef.current = signature;
    const filterName = deferredQuery.trim()
      ? "query"
      : market !== "all"
        ? "market"
        : city !== "all"
          ? "city"
          : category !== "all"
            ? "category"
            : unit !== "all"
              ? "unit"
              : range !== defaultRange
                ? "range"
                : "sort";
    trackDiscoveryEvent("price_filter_zero_results", {
      filter_name: filterName,
      query_length: deferredQuery.trim().length,
      active_filter_count: activeFilterCount,
      result_count: 0,
      zero_results: true,
    });
  }, [loading, loadError, total, activeFilterCount, deferredQuery, city, market, category, unit, range, sort, defaultRange]);

  const categoryHref = (slug: string) => {
    const params = new URLSearchParams();
    if (slug !== "all") params.set("category", slug);
    if (city !== "all") params.set("city", city);
    if (market !== "all") params.set("market", market);
    if (query.trim()) params.set("q", query.trim());
    if (unit !== "all") params.set("unit", unit);
    if (range !== defaultRange) params.set("range", range);
    if (sort !== defaultSort) params.set("sort", sort);
    if (pageSize !== 100) params.set("limit", String(pageSize));
    const qs = params.toString();
    return qs ? `/fiyatlar?${qs}` : "/fiyatlar";
  };

  return (
    <div className="space-y-5">
      {/* Filtre bar */}
      <div className="flex flex-col gap-3 rounded-[14px] border border-(--color-border) bg-(--color-surface) p-4">
        {/* Üst sıra — arama + hal/il + birim + tarih + sıralama */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.4fr)_repeat(5,minmax(135px,1fr))]">
          <div className="relative">
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
            onChange={(e) => {
              setCity(e.target.value);
              setMarket("all");
            }}
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
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            aria-label="Hal veya kaynak"
            className="min-w-0 rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none"
          >
            <option value="all">Tüm Haller</option>
            {marketOptions.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}{city === "all" && item.cityName ? ` · ${item.cityName}` : ""}
              </option>
            ))}
          </select>

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            aria-label="Birim"
            className="min-w-0 rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none"
          >
            <option value="all">Tüm Birimler</option>
            {unitOptions.map((value) => (
              <option key={value} value={value}>{unitLabel(value)}</option>
            ))}
          </select>

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            aria-label="Tarih aralığı"
            className="min-w-0 rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sıralama"
            className="min-w-0 rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-[13px] text-(--color-foreground) focus:border-(--color-brand) focus:outline-none"
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
                <Link
                  key={c.slug}
                  href={serverPagination ? categoryHref(c.slug) : "#"}
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
                  {(!serverPagination || c.slug === "all") && (
                    <span
                      className={
                        "font-(family-name:--font-mono) text-[10px] " +
                        (active ? "text-(--color-navy)/70" : "opacity-60")
                      }
                    >
                      {c.count}
                    </span>
                  )}
                </Link>
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

      <div className="flex flex-col gap-3 rounded-[12px] border border-(--color-border-soft) bg-(--color-bg-alt) px-4 py-3 text-xs text-(--color-muted) sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <strong className="text-(--color-foreground)">{total.toLocaleString("tr-TR")} kayıt</strong>
          <span>{showingStart}–{showingEnd} gösteriliyor</span>
          <span>{RANGE_OPTIONS.find((option) => option.value === range)?.label ?? range}</span>
          {meta?.latestRecordedDate ? <span>Son kayıt: {formatDate(meta.latestRecordedDate)}</span> : null}
          {filtered.length > 0 && staleCount === 0 ? <span className="font-semibold text-(--color-success)">Güncel kayıtlar</span> : null}
          {freshCount > 0 && staleCount > 0 ? <span className="font-semibold text-(--color-warning)">{staleCount} gecikmeli, {freshCount} güncel</span> : null}
          {filtered.length > 0 && staleCount === filtered.length ? <span className="font-semibold text-(--color-warning)">Tüm sonuçlar gecikmeli</span> : null}
        </div>
        {showExport ? (
          <ExportButton
            label="Filtreli CSV indir"
            params={{
              product: requestParams?.product,
              q: deferredQuery.trim() || undefined,
              city: city === "all" ? undefined : city,
              market: market === "all" ? requestParams?.market : market,
              marketType: requestParams?.marketType,
              category: category === "all" ? undefined : category,
              unit: unit === "all" ? undefined : unit,
              range,
              latestOnly: requestParams?.latestOnly,
            }}
          />
        ) : null}
      </div>

      {loadError ? (
        <div className="rounded-[14px] border border-(--color-danger)/30 bg-(--color-surface)">
          <StatusState
            kind="error"
            compact
            title="Fiyatlar yüklenemedi"
            description="Mevcut sonuçlar korunuyor. Bağlantıyı denetleyip yeniden deneyin."
            action={(
              <button
                type="button"
                onClick={() => setRetryToken((value) => value + 1)}
                className="rounded-lg bg-(--color-brand) px-4 py-2 text-xs font-bold text-(--color-brand-fg)"
              >
                Yeniden dene
              </button>
            )}
          />
        </div>
      ) : null}

      {/* Tablo */}
      <div className="relative overflow-hidden rounded-[14px] border border-(--color-border) bg-(--color-surface)">
        {loading && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-(--color-border)">
            <div className="h-full w-1/3 animate-pulse bg-(--color-brand)" />
          </div>
        )}
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <StatusState
              kind="empty"
              compact
              title={safePrices.length === 0 ? "Henüz fiyat verisi yok" : "Filtrelere uyan kayıt bulunamadı"}
              description={safePrices.length === 0 ? "Yeni kaynak verisi geldiğinde bu liste güncellenecek." : "Arama veya filtreleri değiştirerek tekrar deneyin."}
            />
          ) : (
            <div className="divide-y divide-(--color-border-soft)">
              {filtered.map((row) => (
                <MobilePriceCard
                  key={row.id}
                  row={row}
                  isBorsaTable={isBorsaTable}
                  yearAgoAvg={yoyByMarket?.[row.marketSlug]}
                  hideProduct={hideProductColumn}
                  hideMarket={hideMarketColumn}
                  hideCity={hideCityColumn}
                />
              ))}
            </div>
          )}
        </div>
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-(--color-border) text-left">
              {!hideProductColumn && (
                <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                  Ürün
                </th>
              )}
              {!hideMarketColumn && (
                <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                  Hal
                </th>
              )}
              {!hideCityColumn && (
                <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                  Şehir
                </th>
              )}
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
                Tarih
              </th>
              <th className="px-4 py-3 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.1em] text-(--color-muted)">
                Kaynak
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumnCount}
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
                const yearAgoAvg = yoyByMarket?.[row.marketSlug];
                const currentAvg = toPriceNumber(row.avgPrice);
                const yoyPct =
                  yearAgoAvg && yearAgoAvg > 0 && Number.isFinite(currentAvg)
                    ? ((currentAvg - yearAgoAvg) / yearAgoAvg) * 100
                    : null;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-(--color-border)/50 transition-colors last:border-b-0 hover:bg-(--color-bg-alt)"
                  >
                    {!hideProductColumn && (
                      <td className="px-4 py-3.5">
                        <Link
                          href={productHref(row)}
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
                    )}
                    {!hideMarketColumn && (
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/hal/${row.marketSlug}`}
                          className="text-[13px] text-(--color-muted) hover:text-(--color-brand)"
                        >
                          {row.marketName}
                        </Link>
                      </td>
                    )}
                    {!hideCityColumn && (
                      <td className="px-4 py-3.5 text-[13px] text-(--color-muted)">
                        {row.cityName}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-right font-(family-name:--font-mono) text-[13px] text-(--color-muted)">
                      ₺{fmt(row.minPrice)}<span className="ml-1 text-[10px]">/{row.unit}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-(family-name:--font-mono) text-[15px] font-bold text-(--color-foreground)">
                          ₺{fmt(row.avgPrice)}
                          <span className="ml-1 text-[10px] font-medium text-(--color-muted)">/{row.unit}</span>
                        </span>
                        {row.isSynthetic || row.avgPriceMethod === "midpoint" ? (
                          <span className="text-[10px] text-(--color-muted)" title="Kaynak yalnız minimum ve maksimum fiyat yayımladığı için orta nokta hesaplandı; hacim ağırlıklı ortalama değildir.">
                            min–maks orta noktası
                          </span>
                        ) : null}
                        {yoyPct !== null && (
                          <span
                            title={`Geçen yıl aynı dönem: ₺${yearAgoAvg!.toFixed(2)}`}
                            className={
                              "font-(family-name:--font-mono) text-[10px] font-semibold " +
                              (yoyPct > 0 ? "text-(--trend-up)" : "text-(--trend-down)")
                            }
                          >
                            {yoyPct > 0 ? "+" : ""}
                            {yoyPct.toFixed(1)}% geçen yıla
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-(family-name:--font-mono) text-[13px] text-(--color-muted)">
                      ₺{fmt(row.maxPrice)}<span className="ml-1 text-[10px]">/{row.unit}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-(family-name:--font-mono) text-[12px] text-(--color-muted)">
                      {formatDate(row.recordedDate)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-[132px] flex-wrap gap-1.5">
                        <span
                          title={sourceDisplayName(row.sourceName, row.sourceApi)}
                          className={
                            "inline-flex items-center rounded-[5px] border px-2 py-0.5 font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.05em] " +
                            sourceClass
                          }
                        >
                          {sourceCompactLabel(row.sourceName, row.sourceApi)}
                        </span>
                        {row.isOfficialSource && (
                          <span className="inline-flex items-center rounded-[5px] border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                            Resmi kaynak
                          </span>
                        )}
                        {row.isStale && (
                          <span className="inline-flex items-center rounded-[5px] border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                            {isBorsaTable ? "Geçen sezon" : "Gecikmeli"}
                          </span>
                        )}
                        {row.sourceUrl && (
                          <a
                            href={row.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-[5px] border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200 hover:border-sky-300/50"
                          >
                            Doğrulanabilir
                          </a>
                        )}
                        <Link
                          href="/metodoloji"
                          className="inline-flex items-center text-[10px] font-semibold text-(--color-muted) underline underline-offset-2 hover:text-(--color-brand)"
                        >
                          Metodoloji
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {serverPagination ? (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          showingStart={showingStart}
          showingEnd={showingEnd}
          loading={loading}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 font-(family-name:--font-mono) text-[11px] uppercase tracking-[0.1em] text-(--color-muted)">
          <span>
            {filtered.length} / {safePrices.length} kayıt
          </span>
          <span>Toptancı hal fiyatıdır, perakende değildir.</span>
          {deferredQuery.trim() && (
            <span className="text-(--color-foreground)">
              &ldquo;{deferredQuery.trim()}&rdquo; için sonuçlar
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MobilePriceCard({
  row,
  isBorsaTable,
  yearAgoAvg,
  hideProduct,
  hideMarket,
  hideCity,
}: {
  row: PriceRow;
  isBorsaTable: boolean;
  yearAgoAvg?: number;
  hideProduct: boolean;
  hideMarket: boolean;
  hideCity: boolean;
}) {
  const currentAvg = toPriceNumber(row.avgPrice);
  const yoyPct = yearAgoAvg && yearAgoAvg > 0 && Number.isFinite(currentAvg)
    ? ((currentAvg - yearAgoAvg) / yearAgoAvg) * 100
    : null;
  const family = sourceFamily(row.sourceApi);

  return (
    <article className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {!hideProduct ? (
            <Link href={productHref(row)} className="block truncate text-sm font-bold text-(--color-foreground) hover:text-(--color-brand)">
              {row.productName}
            </Link>
          ) : null}
          {!hideMarket ? (
            <Link href={`/hal/${row.marketSlug}`} className="mt-1 block truncate text-xs text-(--color-muted) hover:text-(--color-brand)">
              {row.marketName}
            </Link>
          ) : null}
          {!hideCity ? <p className="mt-0.5 text-xs text-(--color-muted)">{row.cityName}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-(family-name:--font-mono) text-lg font-bold text-(--color-foreground)">₺{fmt(row.avgPrice)}</p>
          <p className="text-[11px] text-(--color-muted)">/{row.unit}</p>
          {row.isSynthetic || row.avgPriceMethod === "midpoint" ? (
            <p className="mt-1 max-w-32 text-[10px] text-(--color-muted)">min–maks orta noktası</p>
          ) : null}
          {yoyPct !== null ? (
            <p className={`mt-1 text-[10px] font-semibold ${yoyPct > 0 ? "text-(--trend-up)" : "text-(--trend-down)"}`}>
              {yoyPct > 0 ? "↑" : "↓"} %{Math.abs(yoyPct).toFixed(1)} geçen yıla
            </p>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 rounded-lg bg-(--color-bg-alt) p-3 text-xs">
        <div><dt className="text-(--color-muted)">Min</dt><dd className="mt-1 font-(family-name:--font-mono) font-semibold text-(--color-foreground)">₺{fmt(row.minPrice)}</dd></div>
        <div><dt className="text-(--color-muted)">Ortalama</dt><dd className="mt-1 font-(family-name:--font-mono) font-semibold text-(--color-foreground)">₺{fmt(row.avgPrice)}</dd></div>
        <div><dt className="text-(--color-muted)">Maks</dt><dd className="mt-1 font-(family-name:--font-mono) font-semibold text-(--color-foreground)">₺{fmt(row.maxPrice)}</dd></div>
      </dl>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-(--color-muted)">
        <time dateTime={row.recordedDate}>{formatDate(row.recordedDate)}</time>
        <span aria-hidden>·</span>
        <span title={sourceDisplayName(row.sourceName, row.sourceApi)} className="font-semibold">{sourceCompactLabel(row.sourceName, row.sourceApi)}</span>
        {row.isOfficialSource ? <span className="rounded-full border border-(--color-success)/35 bg-(--color-success-bg) px-2 py-0.5 text-(--color-success)">Resmi kaynak</span> : null}
        {row.isStale ? <span className="rounded-full border border-(--color-warning)/40 bg-(--color-warning-bg) px-2 py-0.5 text-(--color-warning)">{isBorsaTable ? "Geçen sezon" : "Gecikmeli"}</span> : null}
        {row.sourceUrl ? <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-(--color-info) underline underline-offset-2">Kaynağı doğrula</a> : null}
        <Link href="/metodoloji" className="font-semibold underline underline-offset-2 hover:text-(--color-brand)">Metodoloji</Link>
      </div>
    </article>
  );
}
