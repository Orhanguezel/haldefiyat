import { extractArray, getErrorMessage, toBool, toStr, trimStr, type UnknownRow } from '@/integrations/shared/common';
import type { SettingValue, SiteSetting } from '@/integrations/shared/site-settings';

export const SITE_SETTINGS_SMTP_KEYS = [
  'smtp_host',
  'smtp_port',
  'smtp_username',
  'smtp_password',
  'smtp_from_email',
  'smtp_from_name',
  'smtp_ssl',
] as const;

export type SiteSettingsSmtpKey = (typeof SITE_SETTINGS_SMTP_KEYS)[number];

export type SiteSettingsSmtpForm = {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  smtp_ssl: boolean;
};

export type SiteSettingsSmtpTestResult = {
  ok: boolean;
  message: string;
};

export const EMPTY_SITE_SETTINGS_SMTP_FORM: SiteSettingsSmtpForm = {
  smtp_host: '',
  smtp_port: '',
  smtp_username: '',
  smtp_password: '',
  smtp_from_email: '',
  smtp_from_name: '',
  smtp_ssl: false,
};

export function createSiteSettingsSmtpForm(): SiteSettingsSmtpForm {
  return { ...EMPTY_SITE_SETTINGS_SMTP_FORM };
}

export function mapSiteSettingsToSmtpForm(
  settings?: SiteSetting[] | unknown,
): SiteSettingsSmtpForm {
  const form = createSiteSettingsSmtpForm();

  for (const item of extractArray(settings)) {
    const row = item as UnknownRow;
    const key = toStr(row.key) as SiteSettingsSmtpKey;
    const value = row.value;

    switch (key) {
      case 'smtp_host':
      case 'smtp_port':
      case 'smtp_username':
      case 'smtp_password':
      case 'smtp_from_email':
      case 'smtp_from_name':
        form[key] = toStr(value);
        break;
      case 'smtp_ssl':
        form.smtp_ssl = toBool(value);
        break;
      default:
        break;
    }
  }

  return form;
}

export function buildSiteSettingsSmtpUpdates(
  form: SiteSettingsSmtpForm,
): Array<{ key: SiteSettingsSmtpKey; value: SettingValue }> {
  return [
    { key: 'smtp_host', value: trimStr(form.smtp_host) },
    { key: 'smtp_port', value: trimStr(form.smtp_port) },
    { key: 'smtp_username', value: trimStr(form.smtp_username) },
    { key: 'smtp_password', value: form.smtp_password },
    { key: 'smtp_from_email', value: trimStr(form.smtp_from_email) },
    { key: 'smtp_from_name', value: trimStr(form.smtp_from_name) },
    { key: 'smtp_ssl', value: form.smtp_ssl },
  ];
}

export function getSiteSettingsSmtpErrorMessage(err: unknown, fallback: string): string {
  return getErrorMessage(err) || fallback;
}
