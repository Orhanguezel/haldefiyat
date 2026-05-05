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
  // `icon` / `apple-icon` / metadata route'lari i18n'e sokma — aksi halde /icon → /tr/icon olur, 404
  matcher: ["/", "/(tr)/:path*", "/((?!api|_next|_vercel|icon|apple-icon|.*\\..*).*)"],
};
