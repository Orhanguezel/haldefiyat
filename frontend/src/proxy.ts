import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { isAppLocale, routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
});

/** Next.js 16+: `proxy.ts` varsayılan dışa aktarımı kullanmalı; aksi halde i18n middleware hiç çalışmaz. */
export default async function proxy(request: NextRequest) {
  const res = await Promise.resolve(intlMiddleware(request));
  const pathname = request.nextUrl.pathname;
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
    "/((?!api|_next|_vercel|icon|apple-icon|og/|.*opengraph-image.*|.*twitter-image.*|.*\\..*).*)",
  ],
};
