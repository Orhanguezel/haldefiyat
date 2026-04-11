// src/common/middleware/locale.ts

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  resolveLocaleFromHeaders,
  fallbackChain,
  ensureLocalesLoadedFromSettings,
  type Locale,
} from "../core/i18n";

export async function localeMiddleware(
  req: FastifyRequest,
  _reply: FastifyReply,
) {
  // 🔄 Her istekte (veya 60sn cache süresi dolduysa) siteSettings.app_locales'i kontrol et
  await ensureLocalesLoadedFromSettings();

  const { locale } = resolveLocaleFromHeaders(
    req.headers as Record<string, unknown>,
  );

  (req as any).locale = locale as Locale;
  (req as any).localeFallbacks = fallbackChain(locale as Locale);

  // İstersen debug log:
  // req.log?.debug?.({ locale, fallbacks: (req as any).localeFallbacks }, "locale_resolved");
}
