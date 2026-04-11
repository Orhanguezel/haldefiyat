// =============================================================
// FILE: src/modules/products/i18n.ts
// Products – Locale helpers (single source of truth)
//  - Locale request param parsing
//  - Default locale + app_locales are expected to be provided from DB via Fastify decorate
// =============================================================

export type SiteI18nConfig = {
  defaultLocale?: string; // e.g. "de"
  appLocales?: string[]; // e.g. ["de","en","de"]
};

const FALLBACK_DEFAULT = 'de';

export function normalizeLocale(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const [short] = s.split('-');
  const norm = (short || '').trim().toLowerCase();
  return norm || null;
}

/**
 * Fastify decorate ile DB’den beslenen i18n config’i okur.
 * Beklenen:
 *   app.siteI18n = { defaultLocale, appLocales }
 */
export function readSiteI18nFromServer(req: any): SiteI18nConfig {
  const s = (req as any)?.server ?? (req as any)?.raw?.server ?? null;

  const cfg =
    (s && (s as any).siteI18n) ||
    (s && (s as any).i18n) ||
    (s && (s as any).siteSettingsI18n) ||
    null;

  if (!cfg || typeof cfg !== 'object') return {};
  return {
    defaultLocale: normalizeLocale((cfg as any).defaultLocale) ?? undefined,
    appLocales: Array.isArray((cfg as any).appLocales)
      ? (cfg as any).appLocales.map(normalizeLocale).filter(Boolean)
      : undefined,
  };
}

export function getDefaultLocale(req: any): string {
  // 1) DB’den gelen global config (decorate)
  const cfg = readSiteI18nFromServer(req);
  const dl = normalizeLocale(cfg.defaultLocale);
  if (dl) return dl;

  // 2) Request üzerinde varsa (middleware/hook set etmiş olabilir)
  const rl =
    normalizeLocale((req as any)?.locale) ||
    normalizeLocale((req as any)?.resolvedLocale) ||
    normalizeLocale((req as any)?.i18n?.locale);
  if (rl) return rl;

  // 3) Son fallback
  return FALLBACK_DEFAULT;
}

export function getRequestedLocale(req: any): string | null {
  const q = (req?.query || {}) as any;
  const b = (req?.body || {}) as any;

  return (
    normalizeLocale(q.locale) ||
    normalizeLocale(b.locale) ||
    normalizeLocale((req as any)?.locale) ||
    null
  );
}

/** Aktif locale: request locale varsa onu alır; yoksa DB default_locale */
export function getEffectiveLocale(req: any): string {
  return getRequestedLocale(req) ?? getDefaultLocale(req);
}

/**
 * Create sırasında target locale listesi:
 *  - DB’den gelen app_locales
 *  - Yoksa [defaultLocale]
 *  - baseLocale listede yoksa başa eklenir
 */
export function getLocalesForCreate(req: any, baseLocale: string): string[] {
  const base = normalizeLocale(baseLocale) ?? getDefaultLocale(req);

  const cfg = readSiteI18nFromServer(req);
  const fromDb = (cfg.appLocales ?? []).map(normalizeLocale).filter(Boolean) as string[];

  let list = fromDb.length ? fromDb : [getDefaultLocale(req)];

  if (!list.includes(base)) list.unshift(base);
  list = Array.from(new Set(list));

  return list;
}
