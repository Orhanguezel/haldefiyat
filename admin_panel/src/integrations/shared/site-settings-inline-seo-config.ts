import { trimStr, tryParseJsonVal, type UnknownRow } from '@/integrations/shared/common';
import { ensureLeadingSlash } from '@/integrations/shared/network';

export const SITE_SETTINGS_INLINE_SEO_PAGES = [
  { key: 'home', path: '/' },
  { key: 'fiyatlar', path: '/fiyatlar' },
  { key: 'hal', path: '/hal' },
  { key: 'urun', path: '/urun' },
  { key: 'endeks', path: '/endeks' },
  { key: 'karsilastirma', path: '/karsilastirma' },
  { key: 'uyarilar', path: '/uyarilar' },
  { key: 'hakkimizda', path: '/hakkimizda' },
  { key: 'iletisim', path: '/iletisim' },
  { key: 'giris', path: '/giris' },
  { key: 'kayit', path: '/kayit' },
  { key: 'favoriler', path: '/favoriler' },
  { key: 'api_docs', path: '/api-docs' },
  { key: 'gizlilik_politikasi', path: '/gizlilik-politikasi' },
  { key: 'kullanim_kosullari', path: '/kullanim-kosullari' },
  { key: 'kvkk', path: '/kvkk' },
] as const;

export const SITE_SETTINGS_INLINE_SEO_DEFAULT_EXPANDED_KEYS = ['home'] as const;
export const SITE_SETTINGS_INLINE_SEO_PREVIEW_HOST = 'haldefiyat.com';
export const SITE_SETTINGS_INLINE_SEO_PREVIEW_HOST_WWW = `www.${SITE_SETTINGS_INLINE_SEO_PREVIEW_HOST}`;

export type SiteSettingsInlineSeoPageKey = (typeof SITE_SETTINGS_INLINE_SEO_PAGES)[number]['key'];

export type SiteSettingsInlineSeoPage = {
  title: string;
  description: string;
  og_image: string;
  no_index: boolean;
};

export type SiteSettingsInlineSeoPages = Record<SiteSettingsInlineSeoPageKey, SiteSettingsInlineSeoPage>;

const EMPTY_SITE_SETTINGS_INLINE_SEO_PAGE: SiteSettingsInlineSeoPage = {
  title: '',
  description: '',
  og_image: '',
  no_index: false,
};

export function createEmptySiteSettingsInlineSeoPage(): SiteSettingsInlineSeoPage {
  return { ...EMPTY_SITE_SETTINGS_INLINE_SEO_PAGE };
}

export function coerceSiteSettingsInlineSeoValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return tryParseJsonVal(value);
}

export function extractSiteSettingsInlineSeoPages(raw: unknown): SiteSettingsInlineSeoPages {
  const row = raw && typeof raw === 'object' ? (raw as UnknownRow) : {};
  const source = coerceSiteSettingsInlineSeoValue(row.value ?? raw);
  const input = source && typeof source === 'object' ? (source as UnknownRow) : {};

  return SITE_SETTINGS_INLINE_SEO_PAGES.reduce((acc, config) => {
    const page = input[config.key];
    const pageRow = page && typeof page === 'object' ? (page as UnknownRow) : {};

    acc[config.key] = {
      title: trimStr(pageRow.title),
      description: trimStr(pageRow.description),
      og_image: trimStr(pageRow.og_image),
      no_index: Boolean(pageRow.no_index),
    };

    return acc;
  }, {} as SiteSettingsInlineSeoPages);
}

export function buildSiteSettingsInlineSeoPreviewPath(locale: string, pagePath: string): string {
  const cleanLocale = trimStr(locale) || 'tr';
  const cleanPath = pagePath === '/' ? '' : ensureLeadingSlash(pagePath);
  return `${cleanLocale}${cleanPath}`;
}
