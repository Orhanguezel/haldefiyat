// src/modules/slider/helpers/locale.ts
import type { FastifyRequest } from 'fastify';
import {
  LOCALES,
  DEFAULT_LOCALE,
  normalizeLocale,
  ensureLocalesLoadedFromSettings,
} from '../../../core/i18n';

type LocaleQueryLike = { locale?: string; default_locale?: string };

function normalizeLooseLocale(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  return normalizeLocale(s) || s.toLowerCase();
}

function pickSupportedLocale(raw?: unknown): string | null {
  const n = normalizeLooseLocale(raw);
  if (!n) return null;
  return LOCALES.includes(n) ? n : null;
}

export async function resolveLocales(
  req: FastifyRequest,
  query?: LocaleQueryLike,
): Promise<{ locale: string; def: string }> {
  await ensureLocalesLoadedFromSettings();

  const q = query ?? ((req.query ?? {}) as LocaleQueryLike);
  const reqObj = req as FastifyRequest & { locale?: string };

  const reqCandidate =
    pickSupportedLocale(q.locale) || pickSupportedLocale(reqObj.locale) || null;
  const defCandidate = pickSupportedLocale(q.default_locale) || null;

  const safeDefault =
    defCandidate ||
    (LOCALES.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : null) ||
    LOCALES[0];

  const safeLocale = reqCandidate || safeDefault;

  return { locale: safeLocale, def: safeDefault };
}
