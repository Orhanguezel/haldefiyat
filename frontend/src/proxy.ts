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

/** Next.js 16+: `proxy.ts` varsayılan dışa aktarımı kullanmalı; aksi halde i18n middleware hiç çalışmaz. */
export default async function proxy(request: NextRequest) {
  const lowerRedirect = lowercaseSlugRedirect(request);
  if (lowerRedirect) return lowerRedirect;

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
