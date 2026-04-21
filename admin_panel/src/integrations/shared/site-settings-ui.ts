import { getErrorMessage } from '@/integrations/shared/common';
import type { SettingValue } from '@/integrations/shared/site-settings';

export function isSiteSettingsSeoKey(key: string): boolean {
  const normalizedKey = String(key || '').trim().toLowerCase();
  if (!normalizedKey) return false;

  return (
    normalizedKey === 'seo' ||
    normalizedKey === 'site_seo' ||
    normalizedKey === 'site_meta_default' ||
    normalizedKey.startsWith('seo_') ||
    normalizedKey.startsWith('seo|') ||
    normalizedKey.startsWith('site_seo|') ||
    normalizedKey.startsWith('ui_seo') ||
    normalizedKey.startsWith('ui_seo_')
  );
}

export function coerceSiteSettingsPreviewValue(input: SettingValue): SettingValue {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return input;

    const looksJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));

    if (!looksJson) return input;

    try {
      return JSON.parse(trimmed) as SettingValue;
    } catch {
      return input;
    }
  }

  return input;
}

export function prettyStringifySiteSettingValue(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return '';
  }
}

export function coerceSiteSettingsValue(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input === 'object') return input;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return input;

    const looksJson =
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));

    if (!looksJson) return input;

    try {
      return JSON.parse(trimmed);
    } catch {
      return input;
    }
  }

  return input;
}

export function parseSiteSettingsRawValue(text: string): SettingValue {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed) as SettingValue;
  } catch {
    return trimmed;
  }
}

export function getSiteSettingsActionErrorMessage(error: unknown, fallback: string): string {
  return getErrorMessage(error, fallback);
}
