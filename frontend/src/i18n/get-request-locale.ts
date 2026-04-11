import { headers } from "next/headers";
import { defaultLocale, isAppLocale, type AppLocale } from "@/i18n/routing";

/** Keep separate from `i18n/request.ts` (next-intl) so SEO/metadata does not bundle the full message catalog. */
export async function getRequestLocale(): Promise<AppLocale> {
  try {
    const headerList = await headers();
    const requested = headerList.get("x-hal-locale");
    return requested && isAppLocale(requested) ? requested : defaultLocale;
  } catch {
    return defaultLocale;
  }
}
