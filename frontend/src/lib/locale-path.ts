import { defaultLocale, isAppLocale, type AppLocale } from "@/i18n/routing";

/**
 * localePrefix: "as-needed" — default locale (tr) prefix ALMAZ (`/giris`), diğerleri prefixli
 * (`/en/giris`). Tek-locale sitede tüm linkler prefixsiz kalır; canonical ile tutarlı.
 */
export function localePath(locale: string, path: string): string {
  if (!path.startsWith("/")) return path;
  const first = path.split("/").filter(Boolean)[0];
  if (first && isAppLocale(first)) return path;
  const loc = isAppLocale(locale) ? locale : defaultLocale;
  if (loc === defaultLocale) return path;
  if (path === "/") return `/${loc}`;
  return `/${loc}${path}`;
}

/** `usePathname()` çıktısından locale segmentini çıkarır (`/tr/panel/...` → `/panel/...`). */
export function pathnameWithoutLocale(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] && isAppLocale(parts[0] as AppLocale)) {
    const rest = parts.slice(1);
    return rest.length ? `/${rest.join("/")}` : "/";
  }
  return pathname;
}
