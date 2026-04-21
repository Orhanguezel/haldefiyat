import type { TranslateFn } from '@/i18n';
import type { AdminUiCopy } from '@/integrations/shared/admin-ui';

export const ADMIN_UI_COPY_KEY = 'ui_admin';
export const ADMIN_TRANSLATIONS_PREFIX = 'admin';

export type UseAdminUiCopyResult = {
  copy: AdminUiCopy;
  loading: boolean;
  fetching: boolean;
  error?: unknown;
};

export function bindAdminTranslatePrefix(
  translate: TranslateFn,
  prefix?: string,
): TranslateFn {
  const normalizedPrefix = String(prefix || ADMIN_TRANSLATIONS_PREFIX).trim();
  if (!normalizedPrefix) return translate;

  return (key, params, fallback) => {
    const normalizedKey = String(key || '').trim();
    const fullKey =
      normalizedKey && !normalizedKey.startsWith(`${ADMIN_TRANSLATIONS_PREFIX}.`)
        ? `${normalizedPrefix}.${normalizedKey}`
        : normalizedKey;

    return translate(fullKey, params, fallback);
  };
}
