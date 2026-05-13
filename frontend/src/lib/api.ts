/**
 * Server-side fetch helpers (RSC).
 *
 * NEDEN: api-client.ts client-side, JWT'li ve credentials: include kullanir.
 * RSC'lerde fetch() Next.js cache katmanini kullanmali (revalidate). Bu yuzden
 * iki ayri katman: api.ts (server) + api-client.ts (browser).
 */

// BACKEND_URL: server-only (NEXT_PUBLIC_ değil → build'e baked olmaz, runtime'da okunur)
// VPS'te ecosystem.config.cjs: env.BACKEND_URL = "http://127.0.0.1:<backend_port>"
// Lokal: .env.local'da BACKEND_URL yoksa NEXT_PUBLIC_API_URL'ye düşer
const API: string = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8088"
).replace(/\/$/, "") + "/api/v1";

// ── Tipler ──────────────────────────────────────────────────────────────────

export interface PriceRow {
  id: number;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string;
  currency: string;
  unit: string;
  recordedDate: string;
  sourceApi: string;
  productSlug: string;
  productName: string;
  categorySlug: string;
  marketSlug: string;
  marketName: string;
  cityName: string;
}

export interface Product {
  id: number;
  slug: string;
  nameTr: string;
  categorySlug: string;
  unit: string;
}

export interface Market {
  id: number;
  slug: string;
  name: string;
  cityName: string;
  regionSlug: string | null;
  sourceKey: string | null;
}

export interface TrendingItem {
  productId: number;
  marketId: number;
  changePct: number;
  latest: number;
  previous: number;
  product?: { id: number; slug: string; nameTr: string; categorySlug: string };
  market?: { id: number; slug: string; name: string; cityName: string };
}

export interface PriceHistoryRow {
  recordedDate: string;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string;
  marketSlug: string;
  marketName: string;
  cityName: string;
}

export interface PriceListMeta {
  rangeDays: number;
  latestRecordedDate: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PriceListResponse {
  items: PriceRow[];
  meta: PriceListMeta;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

type QueryValue = string | number | undefined | null;
type QueryRecord = Record<string, QueryValue>;

function buildQuery(params: QueryRecord): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

async function safeFetch<T>(
  path: string,
  revalidate: number,
  fallback: T,
): Promise<T> {
  try {
    // Build-time (next build) sırasında backend ulaşılamazsa Next.js worker
    // 60s sonra sayfayı zorla kill ediyor. 15s AbortSignal timeout ile erken
    // bail-out; catch'e düşer, fallback döner, sayfa yine prerender olur.
    const res = await fetch(`${API}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[api] ${path} → ${res.status} ${res.statusText}`);
      return fallback;
    }
    const json = (await res.json()) as unknown;
    return unwrapPayload<T>(json, fallback);
  } catch (err) {
    console.error(`[api] ${path} → fetch error`, err);
    return fallback;
  }
}

async function safeFetchRaw<T>(
  path: string,
  revalidate: number,
  fallback: T,
): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[api] ${path} → ${res.status} ${res.statusText}`);
      return fallback;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[api] ${path} → fetch error`, err);
    return fallback;
  }
}

/**
 * Backend cevabini fallback tipine indirger.
 *
 * NEDEN: Hal Fiyatlari backend'i `{ items: [...] }` zarfi kullaniyor; bazi
 * endpoint'ler ise dogrudan dizi/object dondurebilir. Tek noktada normalize
 * ederiz, fetcher fonksiyonlari saf kalir.
 */
function unwrapPayload<T>(json: unknown, fallback: T): T {
  if (json == null) return fallback;
  if (Array.isArray(fallback)) {
    if (Array.isArray(json)) return json as T;
    if (typeof json === "object") {
      const obj = json as Record<string, unknown>;
      if (Array.isArray(obj.items)) return obj.items as T;
      if (Array.isArray(obj.data)) return obj.data as T;
    }
    return fallback;
  }
  if (typeof json === "object" && json !== null) {
    const obj = json as Record<string, unknown>;
    if ("data" in obj) return (obj.data ?? fallback) as T;
  }
  return (json as T) ?? fallback;
}

// ── Public fetchers ─────────────────────────────────────────────────────────

export interface FetchPricesParams {
  product?: string;
  q?: string;
  city?: string;
  market?: string;
  category?: string;
  range?: string;
  limit?: number;
  page?: number;
  sort?: "avg-desc" | "avg-asc" | "name-asc" | "date-desc";
  /** true → (product, market) başına sadece en güncel satır (tablo görünümü) */
  latestOnly?: boolean;
}

function fallbackPriceList(limit = 100, page = 1): PriceListResponse {
  return {
    items: [],
    meta: {
      rangeDays: 7,
      latestRecordedDate: null,
      total: 0,
      page,
      limit,
      totalPages: 1,
    },
  };
}

export async function fetchPricesPage(
  params: FetchPricesParams = {},
): Promise<PriceListResponse> {
  const qs = buildQuery({
    product:    params.product,
    q:          params.q,
    city:       params.city,
    market:     params.market,
    category:   params.category,
    range:      params.range,
    limit:      params.limit,
    page:       params.page,
    sort:       params.sort,
    latestOnly: params.latestOnly == null ? undefined : String(params.latestOnly),
  });
  return safeFetchRaw<PriceListResponse>(
    `/prices${qs}`,
    300,
    fallbackPriceList(params.limit, params.page),
  );
}

export async function fetchPrices(
  params: FetchPricesParams = {},
): Promise<PriceRow[]> {
  const result = await fetchPricesPage(params);
  return result.items;
}

export async function fetchProducts(
  q?: string,
  category?: string,
): Promise<Product[]> {
  const qs = buildQuery({ q, category });
  return safeFetch<Product[]>(`/prices/products${qs}`, 300, []);
}

export async function fetchMarkets(city?: string): Promise<Market[]> {
  const qs = buildQuery({ city });
  return safeFetch<Market[]>(`/prices/markets${qs}`, 300, []);
}

export async function fetchTrending(limit?: number): Promise<TrendingItem[]> {
  const qs = buildQuery({ limit });
  return safeFetch<TrendingItem[]>(`/prices/trending${qs}`, 60, []);
}

export async function fetchPriceHistory(
  productSlug: string,
  marketSlug?: string,
  range?: string,
): Promise<PriceHistoryRow[]> {
  const qs = buildQuery({ market: marketSlug, range });
  return safeFetch<PriceHistoryRow[]>(
    `/prices/history/${encodeURIComponent(productSlug)}${qs}`,
    300,
    [],
  );
}

export interface RetailPriceRow {
  chainSlug: string;
  price: string;
  unit: string;
  recordedDate: string;
}

export async function fetchRetailPrices(productSlug: string): Promise<RetailPriceRow[]> {
  return safeFetch<RetailPriceRow[]>(
    `/prices/retail/${encodeURIComponent(productSlug)}`,
    600,
    [],
  );
}

export interface WidgetPrice {
  productSlug: string;
  productName: string;
  categorySlug: string;
  avgPrice: number;
  unit: string;
  changePct: number | null;
}

export async function fetchWidget(params: { slugs?: string[]; category?: string; limit?: number }): Promise<WidgetPrice[]> {
  const qs = buildQuery({
    slugs: params.slugs?.join(","),
    category: params.category,
    limit: params.limit,
  });
  return safeFetch<WidgetPrice[]>(`/prices/widget${qs}`, 300, []);
}

// ── Yıllık üretim ───────────────────────────────────────────────────────────

export interface ProductionRow {
  id:            number;
  year:          number;
  species:       string;
  speciesSlug:   string;
  categorySlug:  string;
  regionSlug:    string;
  productionTon: string;
  sourceApi:     string;
  note:          string | null;
}

export interface ProductionSpeciesRow {
  speciesSlug:  string;
  species:      string;
  categorySlug: string;
  firstYear:    number;
  lastYear:     number;
  entries:      number;
}

export interface ProductionSeriesRow {
  year:          number;
  species:       string;
  regionSlug:    string;
  productionTon: string;
}

export async function fetchProduction(params: {
  species?:  string;
  region?:   string;
  category?: string;
  yearFrom?: number;
  yearTo?:   number;
  limit?:    number;
} = {}): Promise<ProductionRow[]> {
  const qs = buildQuery({
    species:  params.species,
    region:   params.region,
    category: params.category,
    yearFrom: params.yearFrom,
    yearTo:   params.yearTo,
    limit:    params.limit,
  });
  return safeFetch<ProductionRow[]>(`/production${qs}`, 3600, []);
}

export async function fetchProductionSpecies(region?: string): Promise<ProductionSpeciesRow[]> {
  const qs = buildQuery({ region });
  return safeFetch<ProductionSpeciesRow[]>(`/production/species${qs}`, 3600, []);
}

export async function fetchProductionSeries(
  species: string,
  region?: string,
): Promise<ProductionSeriesRow[]> {
  const qs = buildQuery({ species, region });
  return safeFetch<ProductionSeriesRow[]>(`/production/series${qs}`, 3600, []);
}

// ── Custom pages ─────────────────────────────────────────────────────────────

export interface CustomPageData {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  summary: string | null;
  meta_title: string | null;
  meta_description: string | null;
  module_key: string;
  is_published: number;
}

export type IndexSnapshot = {
  indexWeek:     string;
  indexValue:    string;
  baseWeek:      string;
  basketAvg:     string;
  productsCount: number;
  weekStart:     string;
  weekEnd:       string;
  createdAt?:    string | null;
};

export async function fetchIndexLatest(): Promise<IndexSnapshot | null> {
  return safeFetch<IndexSnapshot | null>("/index/latest", 300, null);
}

export async function fetchIndexHistory(weeks = 26): Promise<IndexSnapshot[]> {
  return safeFetch<IndexSnapshot[]>(`/index/history?weeks=${weeks}`, 300, []);
}

export async function fetchCustomPageBySlug(
  slug: string,
  locale = 'tr',
): Promise<CustomPageData | null> {
  const qs = buildQuery({ locale });
  return safeFetch<CustomPageData | null>(
    `/custom-pages/by-slug/${encodeURIComponent(slug)}${qs}`,
    3600,
    null,
  );
}
