'use client';

export { LocaleProvider, useLocaleContext } from './locale-provider';
export type { TranslateFn } from './translation-utils';
export { normLocaleTag, pickFromAcceptLanguage, pickFromCookie } from './locale-utils';
export {
  computeActiveLocales,
  normalizeAppLocalesMeta,
  normalizeDefaultLocaleValue,
  type AppLocaleMeta,
} from './app-locales-meta';
export {
  ADMIN_LOCALE_LIST,
  ADMIN_LOCALE_OPTIONS,
  getAdminSection,
  getAdminTranslations,
  useAdminTranslations,
  type AdminLocale,
} from './admin-ui';
