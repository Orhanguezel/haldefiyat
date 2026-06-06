import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { isAppLocale, routing } from "@/i18n/routing";
import { MAKALELER } from "@/lib/analiz";

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
});

const LOWERCASE_SLUG_SECTIONS = new Set(["urun", "hal", "analiz"]);
const BORSA_PRODUCT_SLUGS = new Set(["bugday", "arpa", "misir", "aycicegi", "pamuk"]);
const API_URL = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8091"
).replace(/\/$/, "");

function redirectWithPath(request: NextRequest, pathname: string, status: 301 | 308) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url, status);
}

function lowercaseSlugRedirect(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const parts = pathname.split("/");
  const offset = isAppLocale(parts[1] ?? "") ? 2 : 1;
  const section = parts[offset];
  const slug = parts[offset + 1];

  if (!section || !slug || !LOWERCASE_SLUG_SECTIONS.has(section)) return null;

  const lowerSlug = slug.toLocaleLowerCase("tr");
  if (slug === lowerSlug) return null;

  const nextParts = [...parts];
  nextParts[offset + 1] = lowerSlug;
  return redirectWithPath(request, nextParts.join("/") || "/", 301);
}

async function fetchItems(path: string): Promise<Array<Record<string, unknown>>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    if (data?.data && typeof data.data === "object") return [data.data];
    return [];
  } catch {
    return [];
  }
}

async function fetchProductBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const products = await fetchItems(`/api/v1/prices/products?q=${encodeURIComponent(slug)}`);
  return products.find((product) => product.slug === slug) ?? null;
}

async function slugExists(section: string, slug: string): Promise<boolean> {
  if (section === "urun") {
    if (BORSA_PRODUCT_SLUGS.has(slug)) return true;
    return Boolean(await fetchProductBySlug(slug));
  }

  if (section === "hal") {
    const markets = await fetchItems("/api/v1/prices/markets");
    return markets.some((market) => market.slug === slug);
  }

  if (section === "analiz") {
    if (MAKALELER.some((makale) => makale.slug === slug)) return true;
    const reports = await fetchItems(`/api/v1/analysis/weekly-reports/${encodeURIComponent(slug)}`);
    return reports.some((report) => report.slug === slug);
  }

  return true;
}

async function productCanonicalRedirectResponse(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const parts = pathname.split("/");
  const offset = isAppLocale(parts[1] ?? "") ? 2 : 1;
  const section = parts[offset];
  const slug = parts[offset + 1];

  if (section !== "urun" || !slug) return null;

  const product = await fetchProductBySlug(slug);
  const canonicalSlug = typeof product?.canonicalSlug === "string"
    ? product.canonicalSlug
    : null;

  return canonicalSlug && canonicalSlug !== slug
    ? redirectWithPath(request, `/urun/${canonicalSlug}`, 301)
    : null;
}

async function slugNotFoundResponse(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const parts = pathname.split("/");
  const offset = isAppLocale(parts[1] ?? "") ? 2 : 1;
  const section = parts[offset];
  const slug = parts[offset + 1];

  if (!section || !slug || !LOWERCASE_SLUG_SECTIONS.has(section)) return null;
  return await slugExists(section, slug)
    ? null
    : new NextResponse("Not Found", { status: 404 });
}

const APP_LOCALES_SET = new Set(["tr", "en"]);

/** Backend normalizePath ile birebir: locale prefix + sondaki slash atılır. */
function normalizeRedirectPath(pathname: string): string {
  const parts = pathname.split("/");
  if (parts[1] && APP_LOCALES_SET.has(parts[1])) parts.splice(1, 1);
  let path = parts.join("/") || "/";
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path;
}

type ManagedRedirect = { type: "301" | "410"; targetUrl: string | null; id: number };
let redirectCache: { at: number; map: Map<string, ManagedRedirect> } | null = null;
const REDIRECT_TTL_MS = 60_000;

async function getRedirectMap(): Promise<Map<string, ManagedRedirect>> {
  const now = Date.now();
  if (redirectCache && now - redirectCache.at < REDIRECT_TTL_MS) return redirectCache.map;
  const items = await fetchItems("/api/v1/redirects");
  const map = new Map<string, ManagedRedirect>();
  for (const r of items) {
    const src = typeof r.sourcePath === "string" ? normalizeRedirectPath(r.sourcePath) : null;
    if (src) map.set(src, { type: r.type as "301" | "410", targetUrl: (r.targetUrl as string) ?? null, id: Number(r.id) });
  }
  redirectCache = { at: now, map };
  return map;
}

const GONE_HTML = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>410 — İçerik kaldırıldı</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;max-width:640px;margin:12vh auto;padding:0 24px;color:#1e293b;text-align:center}a{color:#16a34a}</style></head><body><h1>410 — İçerik kalıcı olarak kaldırıldı</h1><p>Bu sayfa artık mevcut değil ve geri gelmeyecek.</p><p><a href="/">Ana sayfaya dön</a></p></body></html>`;

async function managedRedirectResponse(request: NextRequest): Promise<NextResponse | null> {
  const source = normalizeRedirectPath(request.nextUrl.pathname);
  if (source === "/" || source.length < 2) return null;
  const map = await getRedirectMap();
  const hit = map.get(source);
  if (!hit) return null;

  void fetch(`${API_URL}/api/v1/redirects/hit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: hit.id }),
  }).catch(() => {});

  if (hit.type === "301" && hit.targetUrl) {
    const target = hit.targetUrl.startsWith("http")
      ? hit.targetUrl
      : new URL(hit.targetUrl, request.nextUrl.origin).toString();
    return NextResponse.redirect(target, 301);
  }
  return new NextResponse(GONE_HTML, {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
  });
}

/** Next.js 16+: `proxy.ts` varsayılan dışa aktarımı kullanmalı; aksi halde i18n middleware hiç çalışmaz. */
export default async function proxy(request: NextRequest) {
  const lowerRedirect = lowercaseSlugRedirect(request);
  if (lowerRedirect) return lowerRedirect;

  // Admin tanimli 301/410 yonlendirmeleri en yuksek oncelik (acik editoryel niyet).
  const managed = await managedRedirectResponse(request);
  if (managed) return managed;

  const pathname = request.nextUrl.pathname;
  const parts = pathname.split("/");

  const canonicalRedirect = await productCanonicalRedirectResponse(request);
  if (canonicalRedirect) return canonicalRedirect;

  if (parts[1] && isAppLocale(parts[1])) {
    const withoutLocale = `/${parts.slice(2).join("/")}`.replace(/\/$/, "") || "/";
    return redirectWithPath(request, withoutLocale, 308);
  }

  const notFoundResponse = await slugNotFoundResponse(request);
  if (notFoundResponse) return notFoundResponse;

  const res = await Promise.resolve(intlMiddleware(request));
  const first = pathname.split("/").filter(Boolean)[0];
  if (first && isAppLocale(first)) {
    res.headers.set("x-hal-locale", first);
  }
  return res;
}

export const config = {
  // metadata route'larini i18n'e sokma — aksi halde 404 / 307 yonlendirme dongusu.
  // `icon`/`apple-icon`: kok seviye (path basi). `opengraph-image`/`twitter-image`:
  // dinamik OG route'lari `[locale]` altinda nested URL uretir (orn.
  // /urun/domates/opengraph-image) — path-basi alternatifi yakalamaz; nokta
  // deseni (`.*\..*`) gibi "her yerde" eslesen `.*opengraph-image.*` gerekir.
  // `og/` = i18n-bağımsız dinamik OG route handler'ları (/og/urun/[slug] vb.)
  // — nginx `/api/`yi backend'e yolladığı için OG namespace'i `/og/`; bunlar
  // i18n'e sokulmamalı (aksi halde 307). `og/` (slash'lı) → /oguz gibi gerçek
  // sayfaları yanlışlıkla dışlamaz.
  matcher: [
    "/",
    "/(tr)/:path*",
    "/((?!api/|_next|_vercel|icon|apple-icon|offline|og/|.*opengraph-image.*|.*twitter-image.*|.*\\..*).*)",
  ],
};
