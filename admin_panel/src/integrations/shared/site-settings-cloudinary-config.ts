import { extractArray, getErrorMessage, toStr, trimStr, type UnknownRow } from '@/integrations/shared/common';
import type { SettingValue, SiteSetting } from '@/integrations/shared/site-settings';

export const SITE_SETTINGS_CLOUDINARY_KEYS = [
  'storage_driver',
  'storage_local_root',
  'storage_local_base_url',
  'storage_cdn_public_base',
  'storage_public_api_base',
  'cloudinary_cloud_name',
  'cloudinary_api_key',
  'cloudinary_api_secret',
  'cloudinary_folder',
  'cloudinary_unsigned_preset',
] as const;

export type SiteSettingsCloudinaryKey = (typeof SITE_SETTINGS_CLOUDINARY_KEYS)[number];
export type SiteSettingsCloudinaryForm = Record<SiteSettingsCloudinaryKey, string>;

export const EMPTY_SITE_SETTINGS_CLOUDINARY_FORM: SiteSettingsCloudinaryForm = {
  storage_driver: '',
  storage_local_root: '',
  storage_local_base_url: '',
  storage_cdn_public_base: '',
  storage_public_api_base: '',
  cloudinary_cloud_name: '',
  cloudinary_api_key: '',
  cloudinary_api_secret: '',
  cloudinary_folder: '',
  cloudinary_unsigned_preset: '',
};

export function createSiteSettingsCloudinaryForm(): SiteSettingsCloudinaryForm {
  return { ...EMPTY_SITE_SETTINGS_CLOUDINARY_FORM };
}

export function mapSiteSettingsToCloudinaryForm(
  settings?: SiteSetting[] | unknown,
): SiteSettingsCloudinaryForm {
  const form = createSiteSettingsCloudinaryForm();

  for (const item of extractArray(settings)) {
    const row = item as UnknownRow;
    const key = toStr(row.key) as SiteSettingsCloudinaryKey;
    if (key in form) form[key] = toStr(row.value);
  }

  return form;
}

export function buildSiteSettingsCloudinaryUpdates(
  form: SiteSettingsCloudinaryForm,
): Array<{ key: SiteSettingsCloudinaryKey; value: SettingValue }> {
  return SITE_SETTINGS_CLOUDINARY_KEYS.map((key) => ({
    key,
    value: trimStr(form[key]),
  }));
}

export function getSiteSettingsCloudinaryErrorMessage(err: unknown, fallback: string): string {
  return getErrorMessage(err) || fallback;
}
