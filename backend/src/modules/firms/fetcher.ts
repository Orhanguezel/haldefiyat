import type { FetchedFirm, FirmContext, FirmEtlOptions, FirmEtlResult, FirmType } from "./types";

const BASE_URL = "https://halkatalogu.com";
const DEFAULT_DELAY_MS = 500;
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = "Mozilla/5.0 (compatible; HaldeFiyatBot/1.0; +https://haldefiyat.com)";

export const HALKATALOGU_CITY_SLUGS = [
  "adana", "adiyaman", "afyonkarahisar", "agri", "amasya", "ankara", "antalya", "artvin", "aydin",
  "balikesir", "bilecik", "bingol", "bitlis", "bolu", "burdur", "bursa", "canakkale", "cankiri",
  "corum", "denizli", "diyarbakir", "edirne", "elazig", "erzincan", "erzurum", "eskisehir",
  "gaziantep", "giresun", "gumushane", "hakkari", "hatay", "isparta", "mersin", "istanbul",
  "izmir", "kars", "kastamonu", "kayseri", "kirklareli", "kirsehir", "kocaeli", "konya",
  "kutahya", "malatya", "manisa", "kahramanmaras", "mardin", "mugla", "mus", "nevsehir", "nigde",
  "ordu", "rize", "sakarya", "samsun", "siirt", "sinop", "sivas", "tekirdag", "tokat", "trabzon",
  "tunceli", "sanliurfa", "usak", "van", "yozgat", "zonguldak", "aksaray", "bayburt", "karaman",
  "kirikkale", "batman", "sirnak", "bartin", "ardahan", "igdir", "yalova", "karabuk", "kilis",
  "osmaniye", "duzce",
];

const DIRECTORY_PATHS: Record<Exclude<FirmType, "komisyoncu">, string> = {
  soguk_hava: "/soguk-hava-depolari",
  nakliye: "/nakliyeciler",
  zirai_ilac: "/zirai-ilac",
};

type ListingFirm = FirmContext & {
  externalId: string;
  slug: string;
  name: string;
  sourceUrl: string;
  photoUrl?: string | null;
  raw: Record<string, unknown>;
};

export async function discoverFirmLinks(options: FirmEtlOptions = {}): Promise<ListingFirm[]> {
  const type = options.type ?? "komisyoncu";
  const items = new Map<string, ListingFirm>();

  if (type === "all" || type === "komisyoncu") {
    const cities = options.city ? [options.city] : HALKATALOGU_CITY_SLUGS;
    for (const citySlug of cities) {
      const rootPath = `/il/${citySlug}`;
      await collectListingPath(rootPath, { citySlug, firmType: "komisyoncu" }, items);
      const subPaths = await discoverSubPaths(rootPath, citySlug);
      for (const path of subPaths) {
        const segment = path.split("/").filter(Boolean)[2] ?? null;
        await collectListingPath(path, {
          citySlug,
          districtSlug: segment,
          categories: segment ? [segment] : [],
          firmType: "komisyoncu",
        }, items);
        await sleep(options.delayMs ?? DEFAULT_DELAY_MS);
      }
      await sleep(options.delayMs ?? DEFAULT_DELAY_MS);
      if (options.limit && items.size >= options.limit) break;
    }
  }

  for (const [firmType, path] of Object.entries(DIRECTORY_PATHS) as Array<[Exclude<FirmType, "komisyoncu">, string]>) {
    if (type !== "all" && type !== firmType) continue;
    await collectListingPath(path, { firmType }, items);
    await sleep(options.delayMs ?? DEFAULT_DELAY_MS);
  }

  return Array.from(items.values()).slice(0, options.limit);
}

export async function fetchFirmDetail(listing: ListingFirm): Promise<FetchedFirm> {
  const html = await fetchHtml(listing.sourceUrl);
  const table = extractTableFields(html);
  const breadcrumb = extractBreadcrumb(html);
  const name = table["Firma Adı"] || extractH1(html) || listing.name;
  const photoUrl = absoluteUrl(extractFirst(html, /<img[^>]+class=["']firmaResim["'][^>]+src=["']([^"']+)["']/i) || listing.photoUrl);
  const location = parseCityDistrict(table["Şehir / İlçe"]);
  const citySlug = breadcrumb.citySlug ?? location.citySlug ?? listing.citySlug ?? null;
  const districtSlug = breadcrumb.districtSlug ?? location.districtSlug ?? listing.districtSlug ?? null;

  return {
    ...listing,
    name: cleanupText(name),
    contactPerson: cleanupText(table.Yetkili || "") || null,
    address: cleanupText(table.Adres || "") || null,
    phone: cleanupText(table.Telefon || table["GSM No"] || "") || null,
    photoUrl,
    citySlug,
    districtSlug,
    categories: mergeCategories(listing.categories, breadcrumb.categorySlug ? [breadcrumb.categorySlug] : []),
    raw: {
      ...listing.raw,
      breadcrumb,
      detailFields: table,
      fetchedAt: new Date().toISOString(),
    },
  };
}

export async function crawlFirms(options: FirmEtlOptions = {}, onFirm?: (firm: FetchedFirm) => Promise<void>): Promise<FirmEtlResult> {
  const result: FirmEtlResult = { discovered: 0, fetched: 0, inserted: 0, updated: 0, skipped: 0, errors: [] };
  const listings = await discoverFirmLinks(options);
  result.discovered = listings.length;

  for (const listing of listings) {
    try {
      const firm = options.includeDetails === false
        ? listingToFetchedFirm(listing)
        : await fetchFirmDetail(listing);
      result.fetched++;
      await onFirm?.(firm);
      await sleep(options.delayMs ?? DEFAULT_DELAY_MS);
    } catch (err) {
      result.skipped++;
      if (result.errors.length < 20) {
        result.errors.push(`${listing.sourceUrl}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  return result;
}

async function discoverSubPaths(rootPath: string, citySlug: string): Promise<string[]> {
  const html = await fetchHtml(pathToUrl(rootPath));
  const paths = new Set<string>();
  const re = /<a\s+[^>]*href=["'](\/il\/[^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const path = normalizePath(m[1]!);
    if (path.startsWith(`/il/${citySlug}/`)) paths.add(path);
  }
  return Array.from(paths);
}

async function collectListingPath(path: string, context: FirmContext, items: Map<string, ListingFirm>): Promise<void> {
  const html = await fetchHtml(pathToUrl(path));
  for (const item of parseListing(html, context)) {
    const existing = items.get(item.externalId);
    if (existing) {
      existing.categories = mergeCategories(existing.categories, item.categories);
      existing.districtSlug ||= item.districtSlug;
      existing.citySlug ||= item.citySlug;
      continue;
    }
    items.set(item.externalId, item);
  }
}

export function parseListing(html: string, context: FirmContext): ListingFirm[] {
  const results: ListingFirm[] = [];
  const listHtml = extractRaw(html, /<div[^>]+class=["'][^"']*\bhalalt\b[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) || html;
  const re = /<a\s+[^>]*href=["']([^"']*\/hal\/(\d+)-([^"']+))["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(listHtml)) !== null) {
    const href = normalizePath(m[1]!);
    const externalId = m[2]!;
    const slug = m[3]!;
    const body = m[4]!;
    const name = cleanupText(extractFirst(body, /<span[^>]*>([\s\S]*?)<\/span>/i) || slug.replace(/-/g, " "));
    if (!name) continue;
    results.push({
      ...context,
      externalId,
      slug: `${externalId}-${slug}`.slice(0, 180),
      name,
      sourceUrl: pathToUrl(href),
      photoUrl: absoluteUrl(extractFirst(body, /<img[^>]+src=["']([^"']+)["']/i)),
      raw: {
        listingName: name,
        listingPath: href,
        listingContext: context,
      },
    });
  }
  return results;
}

function listingToFetchedFirm(listing: ListingFirm): FetchedFirm {
  return {
    ...listing,
    contactPerson: null,
    phone: null,
    address: null,
  };
}

async function fetchHtml(url: string, attempt = 1): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "tr-TR,tr;q=0.9,en;q=0.7",
        "user-agent": USER_AGENT,
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt < 3) {
      await sleep(400 * attempt);
      return fetchHtml(url, attempt + 1);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function extractTableFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const rowRe = /<tr>\s*<td(?:[^>]*)><b>([^<]+)<\/b><\/td>\s*(?:<td(?:[^>]*)><b>:?<\/b><\/td>\s*)?<td(?:[^>]*)>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(html)) !== null) {
    fields[cleanupText(m[1]!)] = cleanupText(m[2]!);
  }
  return fields;
}

function extractBreadcrumb(html: string): { citySlug?: string; districtSlug?: string; categorySlug?: string } {
  const crumb = extractRaw(html, /<div[^>]+class=["'][^"']*\bbaslik\b[^"']*["'][^>]*>\s*<p>([\s\S]*?)<\/p>/i) || "";
  const paths = Array.from(crumb.matchAll(/href=["'](\/il\/[^"']+)["']/gi)).map((m) => normalizePath(m[1]!));
  const cityPath = paths.find((p) => /^\/il\/[^/]+$/.test(p));
  const subPath = paths.find((p) => /^\/il\/[^/]+\/[^/]+$/.test(p));
  const citySlug = cityPath?.split("/")[2];
  const segment = subPath?.split("/")[3];
  return {
    citySlug,
    districtSlug: segment,
    categorySlug: segment,
  };
}

function parseCityDistrict(input?: string): { citySlug?: string; districtSlug?: string } {
  if (!input) return {};
  const [city, district] = input.split("/").map((part) => part?.trim()).filter(Boolean);
  return {
    citySlug: city ? slugify(city) : undefined,
    districtSlug: district ? slugify(district) : undefined,
  };
}

function slugify(input: string): string {
  return input
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractH1(html: string): string | null {
  return extractFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
}

function extractFirst(html: string, re: RegExp): string | null {
  const m = re.exec(html);
  return m?.[1] ? decodeHtml(stripTags(m[1])).trim() : null;
}

function extractRaw(html: string, re: RegExp): string | null {
  const m = re.exec(html);
  return m?.[1] ?? null;
}

function stripTags(input: string): string {
  return input.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ");
}

function cleanupText(input: string): string {
  return decodeHtml(stripTags(input)).replace(/\s+/g, " ").trim();
}

function decodeHtml(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function normalizePath(path: string): string {
  try {
    const url = new URL(path, BASE_URL);
    return `${url.pathname}${url.search}`;
  } catch {
    return path.startsWith("/") ? path : `/${path}`;
  }
}

function pathToUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, BASE_URL).toString();
}

function absoluteUrl(path?: string | null): string | null {
  if (!path) return null;
  return new URL(path, BASE_URL).toString();
}

function mergeCategories(a?: string[] | null, b?: string[] | null): string[] {
  return Array.from(new Set([...(a ?? []), ...(b ?? [])].filter(Boolean)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
