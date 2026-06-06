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
  canonicalSlug?: string | null;
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
  seoIndex?: number | boolean;
  updatedAt?: string;
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
  hidePhone: number | boolean;
  validUntil: string;
  status: "pending" | "approved" | "rejected" | "expired" | "closed";
  isSuspicious: number | boolean;
  isFeatured: number | boolean;
  featuredUntil: string | null;
  viewCount: number;
  createdAt: string | null;
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
  options: { seoIndex?: boolean; marketType?: "hal" | "borsa" | "resmi" | "kooperatif" } = {},
): Promise<Product[]> {
  const qs = buildQuery({
    q,
    category,
    marketType: options.marketType,
    seoIndex: options.seoIndex == null ? undefined : String(options.seoIndex),
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
  return safeFetch<Market[]>(`/prices/markets${qs}`, 300, []);
}

export interface PricesOverview {
  activeCities?: number;
  activeMarkets?: number;
  targetCoverage?: string;
  trackedProducts: number;
  lastSourceDate?: string | null;
  latestRecordedDate: string | null;
  lastEtlRunAt?: string | null;
}

export async function fetchPricesOverview(): Promise<PricesOverview> {
  return safeFetch<PricesOverview>("/prices/overview", 300, {
    activeCities: 0,
    activeMarkets: 0,
    targetCoverage: "81 il hedef",
    trackedProducts: 0,
    lastSourceDate: null,
    latestRecordedDate: null,
    lastEtlRunAt: null,
  });
}

export interface SourceStatusRow {
  sourceApi: string;
  sourceName: string;
  sourceUrl: string | null;
  sourceType: string;
  city: string | null;
  marketName: string | null;
  status: "ok" | "partial" | "error" | "stale";
  lastSourceDate: string | null;
  lastRunAt: string | null;
  rowsInserted: number;
  rowsFetched: number;
  rowsSkipped: number;
  errorMsg: string | null;
}

export async function fetchSourceStatus(): Promise<SourceStatusRow[]> {
  const data = await safeFetchRaw<{ items: SourceStatusRow[] }>("/sources/status", 120, { items: [] });
  return data.items;
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
  type?: "satis" | "alim";
  product?: string;
  city?: string;
  district?: string;
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
  yoyChangePct: number | null;
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
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: string | null;
  imageAlt?: string | null;
  authorId?: number | null;
  authorProfile?: PublicAuthor | null;
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

export async function fetchWidget(params: { slugs?: string[]; category?: string; limit?: number }): Promise<WidgetPrice[]> {
  const qs = buildQuery({
    slugs: params.slugs?.join(","),
    category: params.category,
    limit: params.limit,
  });
  return safeFetch<WidgetPrice[]>(`/prices/widget${qs}`, 300, []);
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
