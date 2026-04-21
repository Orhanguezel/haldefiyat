import { getErrorMessage, toStr, trimStr, tryParseJsonVal, type UnknownRow } from '@/integrations/shared/common';

export type SiteSettingsBrandMediaKey =
  | 'site_logo'
  | 'site_logo_dark'
  | 'site_logo_light'
  | 'site_favicon'
  | 'site_apple_touch_icon'
  | 'site_app_icon_512'
  | 'site_og_default_image';

export type SiteSettingsBrandMediaValue = {
  url: string;
  alt: string;
};

export type SiteSettingsBrandMediaItem = {
  key: SiteSettingsBrandMediaKey;
  labelKey: string;
  folder: string;
};

export const SITE_SETTINGS_BRAND_MEDIA_ITEMS: SiteSettingsBrandMediaItem[] = [
  { key: 'site_logo',             labelKey: 'site_logo',             folder: 'logo' },
  { key: 'site_logo_dark',        labelKey: 'site_logo_dark',        folder: 'logo' },
  { key: 'site_logo_light',       labelKey: 'site_logo_light',       folder: 'logo' },
  { key: 'site_favicon',          labelKey: 'site_favicon',          folder: 'logo' },
  { key: 'site_apple_touch_icon', labelKey: 'site_apple_touch_icon', folder: 'logo' },
  { key: 'site_app_icon_512',     labelKey: 'site_app_icon_512',     folder: 'logo' },
  { key: 'site_og_default_image', labelKey: 'site_og_default_image', folder: 'hero' },
];

export const SITE_SETTINGS_BRAND_MEDIA_KEYS: SiteSettingsBrandMediaKey[] =
  SITE_SETTINGS_BRAND_MEDIA_ITEMS.map((i) => i.key);

export const EMPTY_SITE_SETTINGS_BRAND_MEDIA_VALUE: SiteSettingsBrandMediaValue = {
  url: '',
  alt: '',
};

export type SiteSettingsBrandMediaMap = Record<SiteSettingsBrandMediaKey, SiteSettingsBrandMediaValue>;

export function createEmptySiteSettingsBrandMediaMap(): SiteSettingsBrandMediaMap {
  return SITE_SETTINGS_BRAND_MEDIA_KEYS.reduce((acc, key) => {
    acc[key] = { ...EMPTY_SITE_SETTINGS_BRAND_MEDIA_VALUE };
    return acc;
  }, {} as SiteSettingsBrandMediaMap);
}

export function extractSiteSettingsBrandMediaValue(raw: unknown): SiteSettingsBrandMediaValue {
  const row = raw && typeof raw === 'object' ? (raw as UnknownRow) : null;
  const source = row && 'value' in row
    ? (typeof row.value === 'string' ? tryParseJsonVal(row.value) : row.value)
    : raw;
  const input = source && typeof source === 'object' ? (source as UnknownRow) : {};
  return {
    url: toStr(input.url),
    alt: trimStr(input.alt),
  };
}

export function mapSiteSettingsListToBrandMediaMap(
  rows: ReadonlyArray<{ key?: string; value?: unknown } | null | undefined> | null | undefined,
): SiteSettingsBrandMediaMap {
  const map = createEmptySiteSettingsBrandMediaMap();
  if (!rows) return map;
  for (const row of rows) {
    const key = String(row?.key ?? '').trim() as SiteSettingsBrandMediaKey;
    if (!SITE_SETTINGS_BRAND_MEDIA_KEYS.includes(key)) continue;
    map[key] = extractSiteSettingsBrandMediaValue(row);
  }
  return map;
}

export function getSiteSettingsBrandMediaErrorMessage(err: unknown, fallback: string): string {
  return getErrorMessage(err) || fallback;
}
