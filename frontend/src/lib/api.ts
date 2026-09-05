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
  minPrice: number | string | null;
  maxPrice: number | string | null;
  avgPrice: number | string;
  avgPriceMethod?: "reported" | "midpoint" | "unknown" | "mixed";
  isSynthetic?: boolean;
  currency: string;
  unit: string;
  recordedDate: string;
  sourceApi: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceType?: "municipality" | "exchange" | "official" | "cooperative" | "manual";
  fetchedAt?: string | null;
  publishedAt?: string | null;
  isFresh?: boolean;
  isStale?: boolean;
  isOfficialSource?: boolean;
  qualityFlags?: string[];
  recordCount?: number;
  rawProductName?: string;
  canonicalProduct?: string;
  varietySlug?: string;
  productSlug: string;
  productName: string;
  categorySlug: string;
  imageUrl?: string | null;
  marketSlug: string;
  marketName: string;
  marketType?: "hal" | "borsa" | "resmi" | "kooperatif";
  cityName: string;
}

export interface Product {
  id: number;
  slug: string;
  nameTr: string;
  categorySlug: string;
  unit: string;
  displayName?: string | null;
  imageUrl?: string | null;
  canonicalSlug?: string | null;
  familySlug?: string | null;
  seoIndex?: number | boolean;
  dataQuality?: number;
  searchVolume?: number;
}

export interface ProductEditorial {
  productSlug: string;
  about: string;
  priceFactors: string;
  season: string;
  productionRegion: string;
  qualityIndicators: string | null;
  culinaryUses: string | null;
  relatedSlugs: string[];
  publishedAt: string;
}

export interface VariantPriceRow {
  slug: string;
  displayName: string;
  categorySlug: string;
  unit: string;
  avgPrice: number;
  yoyPct: number | null;
  yoyStatus?: "available" | "insufficient_history" | "insufficient_pairs";
  marketCount: number;
  observationCount: number;
  latestRecordedDate: string;
  url: string;
}

export interface Market {
  id: number;
  slug: string;
  name: string;
  cityName: string;
  regionSlug: string | null;
  sourceKey: string | null;
  marketType?: "hal" | "borsa" | "resmi" | "kooperatif";
  address?: string | null;
  phone?: string | null;
  founded?: string | null;
  hours?: string | null;
  seoIndex?: number | boolean;
  updatedAt?: string;
  latestRecordedDate?: string | null;
}

export interface Firm {
  id: number;
  externalId: string;
  slug: string;
  name: string;
  ownerUserId?: string | null;
  contactPerson: string | null;
  phone: string | null;
  address: string | null;
  citySlug: string | null;
  districtSlug: string | null;
  photoUrl: string | null;
  sourceUrl: string;
  source?: "halkatalogu" | "user";
  status?: "pending" | "approved" | "rejected";
  description?: string | null;
  claimStatus?: "unclaimed" | "pending" | "verified";
  seoIndex?: number | boolean;
  firmType: "komisyoncu" | "soguk_hava" | "nakliye" | "zirai_ilac";
  categories: string[] | null;
  products?: FirmProduct[];
  prices?: FirmPrice[];
  latestPrices?: FirmPrice[];
  latestPriceDate?: string | null;
  ocrContacts?: FirmOcrContact[];
  isActive?: number | boolean;
  lastSeenAt?: string | null;
  sponsorshipTier?: string | null;
  sponsorshipPlacement?: string | null;
}

export interface FirmOcrContact {
  name?: string | null;
  phones?: string[];
}

export interface FirmProduct {
  id: number;
  firmId: number;
  productSlug: string | null;
  productName: string;
  note: string | null;
  price: string | null;
  displayOrder: number;
}

export interface FirmPrice {
  id: number;
  firmId: number;
  productSlug: string | null;
  productName: string;
  unit: string;
  minPrice: string | null;
  maxPrice: string | null;
  avgPrice: string;
  recordedDate: string;
  isSuspicious?: number | boolean;
  createdBy: string | null;
}

export interface FirmListResponse {
  items: Firm[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface FirmCityAggregate {
  citySlug: string;
  cityName: string;
  total: number;
  byType: Record<Firm["firmType"], number>;
}

export interface FirmTypeAggregate {
  firmType: Firm["firmType"];
  total: number;
}

export interface Listing {
  id: number;
  slug: string;
  listingType: "satis" | "alim";
  partyRole: "uretici" | "komisyoncu" | "alici" | "diger";
  productSlug: string | null;
  productName: string;
  categorySlug: string;
  title: string;
  description: string | null;
  quantity: string | null;
  quantityUnit: string;
  priceType: "sabit" | "pazarlik" | "hal_endeksli";
  priceMin: string | null;
  priceMax: string | null;
  priceUnit: string;
  citySlug: string | null;
  districtSlug: string | null;
  contactName: string | null;
  contactPhone: string | null;
  phoneVerified: number | boolean;
  hidePhone: number | boolean;
  callRequestsEnabled: number | boolean;
  callAvailability: Array<"asap" | "morning" | "afternoon" | "evening">;
  validUntil: string;
  status: "pending" | "approved" | "rejected" | "expired" | "closed";
  isSuspicious: number | boolean;
  isFeatured: number | boolean;
  featuredUntil: string | null;
  viewCount: number;
  createdAt: string | null;
  sellerAccountCreatedAt?: string | null;
  sellerEmailVerified?: boolean;
  images?: string[];
}

export interface ListingListResponse {
  items: Listing[];
  meta: { total: number; limit: number; page: number };
}

export interface ListingBoardItem {
  id: number;
  slug: string;
  title: string;
  price: number;
}

export interface ListingBoardSide {
  count: number;
  median: number | null;
  top3: ListingBoardItem[];
}

export interface ListingBoard {
  product: { slug: string; name: string } | null;
  city: string | null;
  sell: ListingBoardSide;
  buy: ListingBoardSide;
  spread: number | null;
  updatedAt?: string;
}

export interface CityPriceMapItem {
  cityName: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  marketCount: number;
  productCount: number;
  observationCount: number;
  latestRecordedDate: string;
  // Karşılaştırılabilir metrikler — 15 ürünlük endeks sepetiyle normalize.
  // priceIndex: 1.00 = Türkiye sepet ortalaması (<1 ucuz, >1 pahalı).
  basketAvg: number | null;
  priceIndex: number | null;
  basketProductCount: number;
}

export interface CityPriceMapResponse {
  items: CityPriceMapItem[];
  meta: {
    rangeDays: number;
    product: string | null;
    category: string | null;
  };
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
  minPrice: number | string | null;
  maxPrice: number | string | null;
  avgPrice: number | string;
  avgPriceMethod?: "reported" | "midpoint" | "unknown" | "mixed";
  unit: string;
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

interface ItemEnvelope<T> {
  item?: T;
}

async function safeFetch<T>(
  path: string,
  revalidate: number,
  fallback: T,
  tags?: string[],
  extraHeaders?: Record<string, string>,
): Promise<T> {
  try {
    // Build-time (next build) sırasında backend ulaşılamazsa Next.js worker
    // 60s sonra sayfayı zorla kill ediyor. 15s AbortSignal timeout ile erken
    // bail-out; catch'e düşer, fallback döner, sayfa yine prerender olur.
    const res = await fetch(`${API}${path}`, {
      next: { revalidate, ...(tags ? { tags } : {}) },
      headers: { Accept: "application/json", ...(extraHeaders ?? {}) },
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

async function safeFetchNoStore<T>(
  path: string,
  fallback: T,
): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, {
      cache: "no-store",
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
  marketType?: "hal" | "borsa" | "resmi" | "kooperatif";
  category?: string;
  unit?: string;
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
    marketType: params.marketType,
    category:   params.category,
    unit:       params.unit,
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

/**
 * Ana sayfa hero karti. Eski secim `/prices?range=1d&limit=1` idi ve sirasiz
 * doner (display_order her urunde 0) — kart rastgele bir egzotik urune
 * dusuyordu. Backend artik cok halde dogrulanan urun havuzundan gunluk secer.
 */
export interface FeaturedPrice {
  productSlug: string;
  canonicalProduct: string;
  productName: string;
  categorySlug: string;
  unit: string;
  currency: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  recordedDate: string;
  marketCount: number;
  cityCount: number;
  changePct: number | null;
  pinned: boolean;
}

export async function fetchFeaturedPrice(): Promise<FeaturedPrice | null> {
  const path = "/prices/featured";
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[api] ${path} → ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as ItemEnvelope<FeaturedPrice>;
    return json.item ?? null;
  } catch (err) {
    console.error(`[api] ${path} → fetch error`, err);
    return null;
  }
}

/**
 * Ana sayfa izgarasi: kart basina bir URUN. Eskiden `/prices?range=1d&limit=8`
 * kullaniliyordu; siralama once arama hacmine baktigi icin en cok aranan urun
 * tum hallerini doldurup izgarayi bitiriyordu (4 Limon + 4 Sogan).
 */
export async function fetchFeaturedList(
  limit = 8,
  excludeSlug?: string,
): Promise<FeaturedPrice[]> {
  const qs = buildQuery({ limit, exclude: excludeSlug });
  const path = `/prices/featured-list${qs}`;
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.error(`[api] ${path} → ${res.status} ${res.statusText}`);
      return [];
    }
    const json = (await res.json()) as { items?: FeaturedPrice[] };
    return json.items ?? [];
  } catch (err) {
    console.error(`[api] ${path} → fetch error`, err);
    return [];
  }
}

export async function fetchProducts(
  q?: string,
  category?: string,
  options: { seoIndex?: boolean; canonicalOnly?: boolean; marketType?: "hal" | "borsa" | "resmi" | "kooperatif" } = {},
): Promise<Product[]> {
  const qs = buildQuery({
    q,
    category,
    marketType: options.marketType,
    seoIndex: options.seoIndex == null ? undefined : String(options.seoIndex),
    canonicalOnly: options.canonicalOnly == null ? undefined : String(options.canonicalOnly),
  });
  return safeFetch<Product[]>(`/prices/products${qs}`, 300, []);
}

export async function fetchProductEditorial(slug: string): Promise<ProductEditorial | null> {
  const path = `/prices/editorial/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[api] ${path} → ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as ItemEnvelope<ProductEditorial>;
    return json.item ?? null;
  } catch (err) {
    console.error(`[api] ${path} → fetch error`, err);
    return null;
  }
}

export async function fetchVariantPrices(masterSlug: string, range = "7d"): Promise<VariantPriceRow[]> {
  const qs = buildQuery({ range });
  return safeFetch<VariantPriceRow[]>(`/prices/variants/${encodeURIComponent(masterSlug)}${qs}`, 3600, []);
}

export async function fetchMarkets(city?: string): Promise<Market[]> {
  const qs = buildQuery({ city });
  // "markets" tag'i: admin künye/hal düzenleyince backend on-demand revalidate tetikler.
  return safeFetch<Market[]>(`/prices/markets${qs}`, 300, [], ["markets"]);
}

export interface PricesOverview {
  totalProducts?: number;
  pricedProducts?: number;
  currentProducts?: number;
  activeSources?: number;
  currentCities?: number;
  activeCities?: number;
  activeMarkets?: number;
  activeMarketsByType?: Record<"hal" | "borsa" | "resmi" | "kooperatif", number>;
  targetCoverage?: string;
  trackedProducts: number;
  lastSourceDate?: string | null;
  earliestRecordedDate: string | null;
  latestRecordedDate: string | null;
  lastEtlRunAt?: string | null;
  measuredAt?: string;
  freshness?: "fresh" | "stale" | "unknown";
}

export async function fetchPricesOverview(): Promise<PricesOverview> {
  return safeFetch<PricesOverview>("/prices/overview", 300, {
    activeCities: 0,
    activeMarkets: 0,
    activeMarketsByType: { hal: 0, borsa: 0, resmi: 0, kooperatif: 0 },
    targetCoverage: "81 il hedef",
    trackedProducts: 0,
    totalProducts: 0,
    pricedProducts: 0,
    currentProducts: 0,
    activeSources: 0,
    currentCities: 0,
    lastSourceDate: null,
    earliestRecordedDate: null,
    latestRecordedDate: null,
    lastEtlRunAt: null,
    measuredAt: undefined,
    freshness: "unknown",
  });
}

export interface SourceStatusRow {
  sourceApi: string;
  sourceName: string;
  sourceUrl: string | null;
  sourceType: string;
  city: string | null;
  marketName: string | null;
  status: "ok" | "partial" | "error" | "stale" | "no_data";
  lastSourceDate: string | null;
  lastRunAt: string | null;
  rowsInserted: number;
  rowsFetched: number;
  rowsSkipped: number;
  statusMessage: string | null;
}

export interface SourceHealthEvent {
  id: number;
  sourceApi: string;
  sourceName: string;
  status: "ok" | "partial" | "error";
  runDate: string | null;
  occurredAt: string | null;
  rowsInserted: number;
  message: string;
}

export interface SourceHealthResponse {
  items: SourceStatusRow[];
  events: SourceHealthEvent[];
}

export async function fetchSourceHealth(): Promise<SourceHealthResponse> {
  return safeFetchRaw<SourceHealthResponse>("/sources/status", 120, { items: [], events: [] });
}

export async function fetchSourceStatus(): Promise<SourceStatusRow[]> {
  return (await fetchSourceHealth()).items;
}

export async function fetchFirms(params: {
  city?: string;
  district?: string;
  type?: Firm["firmType"];
  q?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<FirmListResponse> {
  const qs = buildQuery({
    city: params.city,
    district: params.district,
    type: params.type,
    q: params.q,
    limit: params.limit,
    offset: params.offset,
  });
  return safeFetchRaw<FirmListResponse>(
    `/firms${qs}`,
    300,
    { items: [], meta: { total: 0, limit: params.limit ?? 50, offset: params.offset ?? 0 } },
  );
}

export async function fetchFirmCities(): Promise<FirmCityAggregate[]> {
  const data = await safeFetchRaw<{ items: FirmCityAggregate[] }>("/firms/cities", 300, { items: [] });
  return data.items;
}

export async function fetchFirmTypes(): Promise<FirmTypeAggregate[]> {
  const data = await safeFetchRaw<{ items: FirmTypeAggregate[] }>("/firms/types", 300, { items: [] });
  return data.items;
}

export async function fetchListings(params: {
  q?: string;
  type?: "satis" | "alim";
  product?: string;
  city?: string;
  district?: string;
  unit?: "kg" | "adet" | "kasa" | "bag" | "demet" | "koli" | "paket" | "ton" | "litre";
  date?: "today" | "7d" | "30d";
  page?: number;
  limit?: number;
} = {}): Promise<ListingListResponse> {
  const qs = buildQuery(params);
  return safeFetchRaw<ListingListResponse>(
    `/listings${qs}`,
    120,
    { items: [], meta: { total: 0, limit: params.limit ?? 20, page: params.page ?? 1 } },
  );
}

export async function fetchListing(slug: string): Promise<Listing | null> {
  const path = `/listings/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as ItemEnvelope<Listing>;
    return json.item ?? null;
  } catch {
    return null;
  }
}

export async function fetchListingBoard(params: {
  product?: string | null;
  city?: string | null;
}): Promise<ListingBoard | null> {
  if (!params.product || !params.city) return null;
  const qs = buildQuery({ product: params.product, city: params.city });
  return safeFetchRaw<ListingBoard | null>(`/listings/board${qs}`, 120, null);
}

export async function fetchFirm(slug: string): Promise<Firm | null> {
  const path = `/firms/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(`${API}${path}`, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[api] ${path} → ${res.status} ${res.statusText}`);
      return null;
    }
    const json = (await res.json()) as ItemEnvelope<Firm>;
    return json.item ?? null;
  } catch (err) {
    console.error(`[api] ${path} → fetch error`, err);
    return null;
  }
}

export async function fetchCityPriceMap(params: {
  product?: string;
  category?: string;
  range?: string;
} = {}): Promise<CityPriceMapResponse> {
  const qs = buildQuery({
    product: params.product,
    category: params.category,
    range: params.range,
  });
  return safeFetchRaw<CityPriceMapResponse>(
    `/prices/city-map${qs}`,
    300,
    { items: [], meta: { rangeDays: Math.min(30, parseRangeToDaysFallback(params.range)), product: params.product ?? null, category: params.category ?? null } },
  );
}

function parseRangeToDaysFallback(range?: string): number {
  const m = /^(\d+)d$/.exec(range ?? "");
  return m ? Math.max(1, Number(m[1])) : 7;
}

export async function fetchTrending(limit?: number): Promise<TrendingItem[]> {
  const qs = buildQuery({ limit });
  return safeFetch<TrendingItem[]>(`/prices/trending${qs}`, 60, []);
}

export async function fetchPriceHistory(
  productSlug: string,
  marketSlug?: string,
  range?: string,
  bucket?: "daily" | "weekly" | "monthly" | "auto",
): Promise<PriceHistoryRow[]> {
  const qs = buildQuery({ market: marketSlug, range, bucket });
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
  canonicalProduct?: string | null;
  productName: string;
  categorySlug: string;
  avgPrice: number;
  unit: string;
  changePct: number | null;
  yoyChangePct: number | null;
  yoyStatus?: "available" | "insufficient_history" | "insufficient_pairs";
}

export interface AutoWeeklyReport {
  slug: string;
  baslik: string;
  ozet: string;
  icerik: string;
  yazar: string;
  tarih: string;
  etiketler: string[];
  hafta?: string;
  weekStart: string;
  weekEnd: string;
  totalRecords: number;
  source?: "auto" | "manual";
  reviewedAt?: string | null;
  updatedAt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  imageAlt?: string | null;
  authorId?: number | null;
  authorProfile?: PublicAuthor | null;
}

export interface WeeklyPriceSummary {
  week: string;
  weekStart: string;
  weekEnd: string;
  totalRecords: number;
  productCount: number;
  marketCount: number;
  topRisers: Array<{
    productSlug: string;
    productName: string;
    marketName: string;
    changePct: number;
    latestAvg: number;
    previousAvg: number;
  }>;
  topFallers: Array<{
    productSlug: string;
    productName: string;
    marketName: string;
    changePct: number;
    latestAvg: number;
    previousAvg: number;
  }>;
  avgByCategory: Record<string, number>;
}

export interface PublicAuthor {
  id: number;
  slug: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  expertise: string[];
  avatarUrl: string | null;
  credentials: string | null;
  socialLinks?: Record<string, string>;
}

export interface AuthorArticle {
  slug: string;
  baslik: string;
  ozet: string;
  tarih: string;
  etiketler: string[];
}

export interface PublicAuthorDetail extends PublicAuthor {
  articles: AuthorArticle[];
}

export async function fetchAuthors(limit = 100): Promise<PublicAuthor[]> {
  const qs = buildQuery({ limit });
  const response = await safeFetch<{ items: PublicAuthor[] }>(
    `/authors${qs}`,
    300,
    { items: [] },
  );
  return response.items;
}

export async function fetchWidget(params: {
  slugs?: string[];
  category?: string;
  limit?: number;
  referer?: string | null;
}): Promise<WidgetPrice[]> {
  const qs = buildQuery({
    slugs: params.slugs?.join(","),
    category: params.category,
    limit: params.limit,
  });
  // Widget SSR ile render edildiğinden gömen sitenin referer'ı backend'e normalde
  // ulaşmaz; admin "Widget Gömen Siteler" bölümü bu yüzden kördü. Sayfa isteğindeki
  // referer buraya taşınıp backend'e Referer olarak iletilir (audit loguna düşer).
  const headers = params.referer ? { Referer: params.referer } : undefined;
  return safeFetch<WidgetPrice[]>(`/prices/widget${qs}`, 300, [], undefined, headers);
}

export async function fetchAutoWeeklyReports(limit = 8): Promise<AutoWeeklyReport[]> {
  const qs = buildQuery({ limit });
  return safeFetch<AutoWeeklyReport[]>(`/analysis/weekly-reports${qs}`, 300, []);
}

export async function fetchAutoWeeklyReport(slug: string): Promise<AutoWeeklyReport | null> {
  return safeFetchNoStore<AutoWeeklyReport | null>(
    `/analysis/weekly-reports/${encodeURIComponent(slug)}`,
    null,
  );
}

export async function fetchWeeklyPriceSummary(week: string): Promise<WeeklyPriceSummary | null> {
  const qs = buildQuery({ week });
  return safeFetch<WeeklyPriceSummary | null>(`/prices/weekly-summary${qs}`, 600, null);
}

export interface AnnualReportYear {
  year: number;
  totalRows: number;
  oldestDate: string;
  newestDate: string;
}

export async function fetchAnnualReportYears(): Promise<AnnualReportYear[]> {
  const response = await safeFetch<{ items: AnnualReportYear[] }>(
    "/reports/annual/years",
    21_600,
    { items: [] },
  );
  return response.items;
}

export async function fetchAuthor(slug: string): Promise<PublicAuthorDetail | null> {
  return safeFetchNoStore<PublicAuthorDetail | null>(
    `/authors/${encodeURIComponent(slug)}`,
    null,
  );
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
  sourceName:    string;
  sourceUrl:     string | null;
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
  created_at?: string | null;
  updated_at?: string | null;
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

// ── Sosyal medya akışı (@haldefiyat) ─────────────────────────────────────────
// Veri ekosistem-sosyal-medya sisteminde; backend /social/feed cross-DB okur.
export interface SocialTweet {
  tweetId: string;
  url: string;
  text: string;
  hashtags: string | null;
  mediaUrls: string[];
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}

export async function fetchSocialFeed(limit = 30): Promise<SocialTweet[]> {
  return safeFetch<SocialTweet[]>(`/social/feed?limit=${limit}`, 300, []);
}

// ─── Sehir x urun sayfalari (/fiyat/<sehir>/<urun>) ─────────────────────────
export interface CityProductPair {
  citySlug: string; cityName: string; productSlug: string; productName: string; unit: string;
  marketSlug: string; marketName: string; days90: number; lastDate: string; searchVolume: number; eligible: boolean;
}
export interface CityProductDetail {
  pair: CityProductPair;
  latest: { recordedDate: string; avgPrice: number; minPrice: number | null; maxPrice: number | null } | null;
  weekAgoAvg: number | null;
  history: PriceHistoryRow[];
  cities: Array<{ citySlug: string; cityName: string; marketSlug: string; avgPrice: number; recordedDate: string; eligible: boolean }>;
  nationalMedian: number | null;
  rank: number | null;
  movers: Array<{ productSlug: string; productName: string; avgPrice: number; prevPrice: number; changePct: number; citySlug: string; eligible: boolean }>;
}

export async function fetchCityProductPairs(params: { eligible?: boolean; city?: string; product?: string } = {}): Promise<CityProductPair[]> {
  const qs = buildQuery({ eligible: params.eligible ? "1" : undefined, city: params.city, product: params.product });
  return safeFetch<CityProductPair[]>(`/prices/city-products${qs}`, 1800, [], ["prices"]);
}

export async function fetchCityProduct(citySlug: string, productSlug: string): Promise<CityProductDetail | null> {
  const path = `/prices/city-products/${encodeURIComponent(citySlug)}/${encodeURIComponent(productSlug)}`;
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 1800, tags: ["prices"] }, headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${path} → ${res.status}`);
    const json = (await res.json()) as ItemEnvelope<CityProductDetail>;
    return json.item ?? null;
  } catch (err) {
    console.error(`[api] ${path} → fetch error`, err);
    throw err;
  }
}
