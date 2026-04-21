'use client';

import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { useMemo } from 'react';
import { useAdminTranslations, type TranslateFn } from '@/i18n';
import { bindAdminTranslatePrefix } from '@/integrations/shared';

/**
 * Convenience hook: reads admin locale from preferences store
 * and returns a translation function bound to that locale.
 *
 * Usage: const t = useAdminT();
 */
export function useAdminT(prefix?: string): TranslateFn {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  return useMemo(() => bindAdminTranslatePrefix(t, prefix), [t, prefix]);
}
