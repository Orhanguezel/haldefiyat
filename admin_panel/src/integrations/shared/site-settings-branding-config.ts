import { getErrorMessage, trimStr, tryParseJsonVal, type UnknownRow } from '@/integrations/shared/common';
import { DEFAULT_BRANDING, type AdminBrandingConfig } from '@/config/app-config';

export type SiteSettingsBrandingForm = {
  app_name: string;
  app_copyright: string;
  html_lang: string;
  theme_color: string;
  meta_title: string;
  meta_description: string;
  og_url: string;
  og_title: string;
  og_description: string;
  twitter_card: string;
};

export const EMPTY_SITE_SETTINGS_BRANDING_FORM: SiteSettingsBrandingForm = {
  app_name: '',
  app_copyright: '',
  html_lang: '',
  theme_color: '',
  meta_title: '',
  meta_description: '',
  og_url: '',
  og_title: '',
  og_description: '',
  twitter_card: '',
};

export const SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS = {
  app_name: 'appName',
  app_copyright: 'copyright',
  html_lang: 'htmlLang',
  theme_color: 'themeColor',
  meta_title: 'metaTitle',
  og_url: 'ogUrl',
  meta_description: 'metaDescription',
  og_title: 'ogTitle',
  twitter_card: 'twitterCard',
  og_description: 'ogDescription',
} as const;

export function brandingToSiteSettingsForm(
  branding: AdminBrandingConfig,
): SiteSettingsBrandingForm {
  return {
    app_name: branding.app_name || '',
    app_copyright: branding.app_copyright || '',
    html_lang: branding.html_lang || '',
    theme_color: branding.theme_color || '',
    meta_title: branding.meta?.title || '',
    meta_description: branding.meta?.description || '',
    og_url: branding.meta?.og_url || '',
    og_title: branding.meta?.og_title || '',
    og_description: branding.meta?.og_description || '',
    twitter_card: branding.meta?.twitter_card || '',
  };
}

export function siteSettingsFormToBranding(
  form: SiteSettingsBrandingForm,
): AdminBrandingConfig {
  return {
    app_name: trimStr(form.app_name),
    app_copyright: trimStr(form.app_copyright),
    html_lang: trimStr(form.html_lang),
    theme_color: trimStr(form.theme_color),
    meta: {
      title: trimStr(form.meta_title),
      description: trimStr(form.meta_description),
      og_url: trimStr(form.og_url),
      og_title: trimStr(form.og_title),
      og_description: trimStr(form.og_description),
      twitter_card: trimStr(form.twitter_card),
    },
  };
}

export function normalizeSiteSettingsBrandingConfig(
  raw: unknown,
): AdminBrandingConfig {
  const row = raw && typeof raw === 'object' ? (raw as UnknownRow) : {};
  const source = typeof row.value === 'string' ? tryParseJsonVal(row.value) : row.value ?? raw;
  const config = source && typeof source === 'object' ? (source as UnknownRow) : {};
  const branding = config.branding && typeof config.branding === 'object' ? (config.branding as UnknownRow) : {};
  const brandingMeta =
    branding.meta && typeof branding.meta === 'object' ? (branding.meta as UnknownRow) : {};

  return {
    ...DEFAULT_BRANDING,
    ...branding,
    meta: {
      ...DEFAULT_BRANDING.meta,
      ...brandingMeta,
    },
  };
}

export function mergeSiteSettingsBrandingConfig(
  rawConfig: unknown,
  branding: AdminBrandingConfig,
) {
  const source =
    rawConfig && typeof rawConfig === 'object'
      ? (rawConfig as UnknownRow)
      : {};

  return {
    ...source,
    branding,
  };
}

export function getSiteSettingsBrandingErrorMessage(err: unknown, fallback: string): string {
  return getErrorMessage(err) || fallback;
}
