import type { AdminLocaleOption } from '@/integrations/shared/admin-locales';
import {
  SITE_SETTINGS_BRAND,
  SITE_SETTINGS_BRAND_PREFIX,
  isSiteSettingsGeneralKey,
} from '@/integrations/shared/site-settings-config';

export type SiteSettingsStructuredRendererKey =
  | 'json'
  | 'seo'
  | 'app_locales'
  | 'hero'
  | 'home_backgrounds'
  | 'seo_pages'
  | 'contact_info'
  | 'socials'
  | 'company_profile'
  | 'ui_header'
  | 'businessHours';

export function toShortSiteSettingsLocale(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace('_', '-')
    .split('-')[0]
    .trim();
}

export function isSeoSiteSettingsKey(key: string): boolean {
  const normalizedKey = String(key || '').trim().toLowerCase();
  return normalizedKey === 'seo' || normalizedKey === 'site_seo' || normalizedKey === 'site_meta_default';
}

export function coerceSiteSettingsDetailValue<T = unknown>(input: T): T {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const normalized = input.trim();
    if (!normalized) return input;

    const looksJson =
      (normalized.startsWith('{') && normalized.endsWith('}')) ||
      (normalized.startsWith('[') && normalized.endsWith(']'));

    if (!looksJson) return input;

    try {
      return JSON.parse(normalized) as T;
    } catch {
      return input;
    }
  }

  return input;
}

export function buildSiteSettingsDetailLocaleOptions(
  localeOptions: AdminLocaleOption[],
  globalLabel: string,
): AdminLocaleOption[] {
  return [{ value: '*', label: globalLabel }, ...localeOptions];
}

export function pickInitialSiteSettingsDetailLocale(input: {
  localeFromQuery?: string;
  localeOptions: AdminLocaleOption[];
  defaultLocaleFromDb?: string;
}): string {
  const queryLocale =
    input.localeFromQuery === '*' ? '*' : toShortSiteSettingsLocale(input.localeFromQuery);

  if (queryLocale && input.localeOptions.some((option) => option.value === queryLocale)) {
    return queryLocale;
  }

  if (
    input.defaultLocaleFromDb &&
    input.localeOptions.some((option) => option.value === input.defaultLocaleFromDb)
  ) {
    return input.defaultLocaleFromDb;
  }

  const firstNonGlobal = input.localeOptions.find((option) => option.value !== '*');
  return firstNonGlobal?.value || input.localeOptions[0]?.value || '';
}

export function resolveSiteSettingsStructuredRendererKey(
  settingKey: string,
): SiteSettingsStructuredRendererKey {
  if (!settingKey) return 'json';

  if (isSeoSiteSettingsKey(settingKey)) {
    return String(settingKey).toLowerCase() === 'site_meta_default' ? 'json' : 'seo';
  }

  if (!isSiteSettingsGeneralKey(settingKey)) return 'json';

  if (settingKey === 'app_locales') return 'app_locales';
  if (settingKey === 'hero') return 'hero';
  if (settingKey === 'home_backgrounds') return 'home_backgrounds';
  if (settingKey === 'seo_pages') return 'seo_pages';
  if (settingKey === 'contact_info') return 'contact_info';
  if (settingKey === 'socials') return 'socials';
  if (settingKey === 'company_profile') return 'company_profile';
  if (settingKey === 'ui_header') return 'ui_header';
  if (settingKey === 'businessHours') return 'businessHours';

  return 'json';
}

export {
  SITE_SETTINGS_BRAND,
  SITE_SETTINGS_BRAND_PREFIX,
};
