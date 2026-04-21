import { normLocaleTag } from '@/i18n';
import { FALLBACK_LOCALE } from '@/i18n/config';
import type { SettingValue, SiteSetting } from '@/integrations/shared/site-settings';

export type SiteSettingsTab =
  | 'list'
  | 'global_list'
  | 'general'
  | 'seo'
  | 'smtp'
  | 'cloudinary'
  | 'brand_media'
  | 'api'
  | 'locales'
  | 'branding';

export type SiteSettingsScope = 'localized' | 'global' | 'mixed';

export type SiteSettingsTabItem = {
  id: SiteSettingsTab;
  scope: SiteSettingsScope;
};

export type SiteSettingsLocaleOption = {
  value: string;
  label: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export type SiteSettingsLocaleRow = {
  code: string;
  label: string;
  is_active: boolean;
};

export const SITE_SETTINGS_TABS: SiteSettingsTabItem[] = [
  { id: 'list', scope: 'mixed' },
  { id: 'global_list', scope: 'global' },
  { id: 'general', scope: 'localized' },
  { id: 'seo', scope: 'localized' },
  { id: 'smtp', scope: 'global' },
  { id: 'cloudinary', scope: 'global' },
  { id: 'brand_media', scope: 'global' },
  { id: 'api', scope: 'global' },
];

export const SITE_SETTINGS_GLOBAL_TABS: SiteSettingsTab[] = [
  'global_list',
  'smtp',
  'cloudinary',
  'brand_media',
  'api',
  'locales',
];

export const SITE_SETTINGS_GENERAL_KEYS = [
  'app_locales',
  'hero',
  'home_backgrounds',
  'seo_pages',
  'contact_info',
  'socials',
  'businessHours',
  'company_profile',
  'ui_header',
  'about_page',
] as const;

export type SiteSettingsGeneralKey = (typeof SITE_SETTINGS_GENERAL_KEYS)[number];

export type SiteSettingsGeneralRow = {
  key: SiteSettingsGeneralKey;
  hasValue: boolean;
  editLocale: string;
  value: SettingValue | undefined;
};

export const SITE_SETTINGS_DEFAULTS_BY_KEY: Record<SiteSettingsGeneralKey, SettingValue> = {
  app_locales: [
    { code: 'tr', label: 'Türkçe', is_default: true, is_active: true },
    { code: 'en', label: 'English', is_default: false, is_active: true },
  ],
  hero: { video_desktop: '', video_mobile: '', headline_tr: '', headline_en: '' },
  seo_pages: {},
  contact_info: { phone: '', email: '', address: '', company_name: '' },
  socials: { instagram: '', facebook: '', linkedin: '', youtube: '', x: '' },
  businessHours: [
    { day: 'mon', open: '09:00', close: '18:00', closed: false },
    { day: 'tue', open: '09:00', close: '18:00', closed: false },
    { day: 'wed', open: '09:00', close: '18:00', closed: false },
    { day: 'thu', open: '09:00', close: '18:00', closed: false },
    { day: 'fri', open: '09:00', close: '18:00', closed: false },
    { day: 'sat', open: '10:00', close: '14:00', closed: false },
    { day: 'sun', open: '00:00', close: '00:00', closed: true },
  ],
  company_profile: { company_name: '', slogan: '', about: '' },
  ui_header: {
    nav_home: 'Home',
    nav_products: 'Products',
    nav_services: 'Services',
    nav_contact: 'Contact',
    cta_label: 'Get Offer',
  },
  home_backgrounds: [],
  about_page: {
    hero: { title: '', description: '', image_url: '', image_alt: '' },
    intro: { title: '', subtitle: '', content: '' },
    vision: { title: '', content: '' },
    mission: { title: '', content: '' },
    values: [],
    stats: [],
    timeline: [],
    activities: { title: '', items: [] },
    feature_panels: [],
    memberships: { title: 'Üyesi Olduğumuz Kuruluşlar', items: [] },
  },
};

export const SITE_SETTINGS_BRAND = (process.env.NEXT_PUBLIC_SITE_BRAND || 'hal-fiyatlari').trim();
export const SITE_SETTINGS_BRAND_PREFIX = `${SITE_SETTINGS_BRAND}__`;

function buildLocaleOptionLabel(code: string, label?: string): string {
  const normalizedCode = String(code || '').trim().toLowerCase();
  const normalizedLabel = String(label || '').trim();
  if (normalizedLabel) return `${normalizedLabel} (${normalizedCode})`;

  try {
    const displayNames = new Intl.DisplayNames([FALLBACK_LOCALE], { type: 'language' });
    const displayName = String(displayNames.of(normalizedCode) || '').trim();
    if (displayName) return `${displayName} (${normalizedCode})`;
  } catch {}

  return `${normalizedCode.toUpperCase()} (${normalizedCode})`;
}

export function isSiteSettingsGlobalTab(tab: SiteSettingsTab): boolean {
  return SITE_SETTINGS_GLOBAL_TABS.includes(tab);
}

export function isSiteSettingsGeneralKey(key: string): key is SiteSettingsGeneralKey {
  return (SITE_SETTINGS_GENERAL_KEYS as readonly string[]).includes(String(key || '').trim());
}

export function buildSiteSettingsEditHref(key: string, locale: string): string {
  return `/admin/site-settings/${encodeURIComponent(key)}?locale=${encodeURIComponent(locale)}`;
}

export function buildSiteSettingsLocalesOptions(
  appLocales: Array<{ code?: string; label?: string; is_active?: boolean; is_default?: boolean }> | undefined,
): SiteSettingsLocaleOption[] {
  const items = Array.isArray(appLocales) ? appLocales : [];
  const active = items.filter((item) => item?.code && item?.is_active !== false);
  const seen = new Set<string>();

  const mapped = active
    .filter((item) => {
      const code = String(item.code);
      if (seen.has(code)) return false;
      seen.add(code);
      return true;
    })
    .map((item) => {
      const code = String(item.code);
      return {
        value: code,
        label: buildLocaleOptionLabel(code, item.label),
        isDefault: item.is_default === true,
        isActive: true,
      };
    });

  if (!mapped.length) {
    const fallbackLocale = normLocaleTag(FALLBACK_LOCALE) || 'tr';
    return [{
      value: fallbackLocale,
      label: buildLocaleOptionLabel(fallbackLocale),
      isDefault: true,
      isActive: true,
    }];
  }

  mapped.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.value.localeCompare(b.value);
  });

  return mapped;
}

export function pickInitialSiteSettingsLocale(
  appLocales: Array<{ code?: string; is_active?: boolean; is_default?: boolean }> | undefined,
): string {
  const items = Array.isArray(appLocales) ? appLocales : [];
  const defaultActive = items.find((item) => item?.is_default === true && item?.is_active !== false && item?.code);
  if (defaultActive?.code) return String(defaultActive.code);

  const firstActive = items.find((item) => item?.is_active !== false && item?.code);
  if (firstActive?.code) return String(firstActive.code);

  return normLocaleTag(FALLBACK_LOCALE) || 'tr';
}

export function summariseSiteSettingsValue(
  value: SettingValue | undefined,
  recordCountLabel: string,
): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return recordCountLabel.replace('{count}', String(value.length));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const filled = entries.filter(([, item]) => item !== '' && item !== null && item !== undefined);
    if (!filled.length) return '';
    const parts = filled.slice(0, 2).map(([key, item]) => (item && typeof item === 'object' ? key : String(item)));
    return parts.join(', ') + (filled.length > 2 ? ` +${filled.length - 2}` : '');
  }
  return '';
}

export function buildSiteSettingsGeneralRows(
  rows: SiteSetting[],
  locale: string,
): SiteSettingsGeneralRow[] {
  const filtered = rows.filter((row) => row && isSiteSettingsGeneralKey(String(row.key || '')));
  const byKey = new Map<SiteSettingsGeneralKey, { global?: SiteSetting; local?: SiteSetting }>();

  for (const row of filtered) {
    const key = row.key as SiteSettingsGeneralKey;
    const entry = byKey.get(key) || {};
    if (row.locale === '*') entry.global = row;
    if (row.locale === locale) entry.local = row;
    byKey.set(key, entry);
  }

  return SITE_SETTINGS_GENERAL_KEYS.map((key) => {
    const entry = byKey.get(key) || {};
    const hasLocal = Boolean(entry.local);
    const hasGlobal = Boolean(entry.global);
    const value = hasLocal ? entry.local?.value : hasGlobal ? entry.global?.value : undefined;
    const editLocale = hasLocal ? locale : '*';

    return { key, hasValue: hasLocal || hasGlobal, editLocale, value };
  });
}

export function normalizeSiteSettingsLocaleRows(raw: unknown): SiteSettingsLocaleRow[] {
  const items = Array.isArray(raw) ? raw : [];
  const seen = new Set<string>();
  const rows: SiteSettingsLocaleRow[] = [];

  for (const item of items as Array<{ code?: unknown; label?: unknown; is_active?: unknown }>) {
    const code = normLocaleTag(item?.code ?? item);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    rows.push({
      code,
      label: String(item?.label || '').trim() || code.toUpperCase(),
      is_active: item?.is_active === undefined ? true : Boolean(item?.is_active),
    });
  }

  return rows.sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.code.localeCompare(b.code);
  });
}

export function buildSiteSettingsLocalePayload(rows: SiteSettingsLocaleRow[]) {
  return rows.map((row, index) => ({
    code: row.code,
    label: row.label,
    is_default: index === 0 && row.is_active,
    is_active: row.is_active,
  }));
}
