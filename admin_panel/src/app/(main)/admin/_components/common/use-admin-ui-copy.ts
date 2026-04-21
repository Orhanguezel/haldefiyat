'use client';

// =============================================================
// FILE: src/app/(main)/admin/_components/common/use-admin-ui-copy.ts
// FINAL — Admin UI copy hook (site_settings.ui_admin)
// =============================================================

import { useMemo } from 'react';

import { useListSiteSettingsAdminQuery } from '@/integrations/hooks';
import {
  ADMIN_UI_COPY_KEY,
  normalizeAdminUiCopy,
  type UseAdminUiCopyResult,
} from '@/integrations/shared';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

export type { UseAdminUiCopyResult } from '@/integrations/shared';

export function useAdminUiCopy(): UseAdminUiCopyResult {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);

  const q = useListSiteSettingsAdminQuery({
    keys: [ADMIN_UI_COPY_KEY],
    locale: adminLocale,
    limit: 1,
    sort: 'updated_at',
    order: 'desc',
  });

  const copy = useMemo(() => {
    const row = (q.data ?? []).find((item) => item.key === ADMIN_UI_COPY_KEY);
    const val = row?.value;
    return normalizeAdminUiCopy(val);
  }, [q.data]);

  return {
    copy,
    loading: q.isLoading,
    fetching: q.isFetching,
    error: q.error,
  };
}
