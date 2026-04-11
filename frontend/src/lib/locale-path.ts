import { defaultLocale, isAppLocale, type AppLocale } from "@/i18n/routing";

/** `/panel/...` gibi yolları `/${locale}/panel/...` yapar; zaten locale varsa dokunmaz. */
export function localePath(locale: string, path: string): string {
  if (!path.startsWith("/")) return path;
  const first = path.split("/").filter(Boolean)[0];
  if (first && isAppLocale(first)) return path;
  const loc = isAppLocale(locale) ? locale : defaultLocale;
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
