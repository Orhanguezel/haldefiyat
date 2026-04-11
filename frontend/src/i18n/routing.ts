import { defineRouting } from "next-intl/routing";

export const appLocales = ["tr"] as const;
export type AppLocale = (typeof appLocales)[number];
export const defaultLocale: AppLocale = "tr";

export const routing = defineRouting({
  locales: appLocales,
  defaultLocale,
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/fiyatlar": "/fiyatlar",
    "/hal/[slug]": "/hal/[slug]",
    "/urun/[slug]": "/urun/[slug]",
    "/karsilastirma": "/karsilastirma",
    "/hakkimizda": "/hakkimizda",
    "/iletisim": "/iletisim",
    "/gizlilik-politikasi": "/gizlilik-politikasi",
  },
});

export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];

export function isAppLocale(value: string): value is AppLocale {
  return (appLocales as readonly string[]).includes(value);
}

export function getLocaleFromPathname(pathname: string): AppLocale {
  const first = pathname.split("/").filter(Boolean)[0];
  return first && isAppLocale(first) ? first : defaultLocale;
}

export function toLocalizedPath(pathname: string, locale: string): string {
  const safeLocale = isAppLocale(locale) ? locale : defaultLocale;
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (normalizedPathname === "/") {
    return `/${safeLocale}`;
  }

  return `/${safeLocale}${normalizedPathname}`;
}
