'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { RefreshCcw, Plus, ChevronRight } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { FALLBACK_LOCALE } from '@/i18n/config';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import {
  SITE_SETTINGS_DEFAULTS_BY_KEY,
  SITE_SETTINGS_GENERAL_KEYS,
  buildSiteSettingsEditHref,
  buildSiteSettingsGeneralRows,
  getErrorMessage,
  summariseSiteSettingsValue,
  type SiteSetting,
} from '@/integrations/shared';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ----------------------------- component ----------------------------- */

export type GeneralSettingsTabProps = {
  locale: string;
  settingPrefix?: string;
};

export const GeneralSettingsTab: React.FC<GeneralSettingsTabProps> = ({ locale, settingPrefix }) => {
  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const adminLocale = usePreferencesStore((s) => s.adminLocale) || FALLBACK_LOCALE;
  const t = useAdminTranslations(adminLocale || undefined);

  const withPrefix = React.useCallback((key: string) => `${settingPrefix || ''}${key}`, [settingPrefix]);
  const stripPrefix = React.useCallback(
    (key: string) => (settingPrefix && key.startsWith(settingPrefix) ? key.slice(settingPrefix.length) : key),
    [settingPrefix],
  );

  const listArgsGlobal = React.useMemo(
    () => ({ locale: '*', keys: SITE_SETTINGS_GENERAL_KEYS.map((key) => withPrefix(key)) as unknown as string[] }),
    [withPrefix],
  );
  const listArgsLocale = React.useMemo(
    () => ({ locale, keys: SITE_SETTINGS_GENERAL_KEYS.map((key) => withPrefix(key)) as unknown as string[] }),
    [locale, withPrefix],
  );

  const qGlobal = useListSiteSettingsAdminQuery(listArgsGlobal, { skip: !locale });
  const qLocale = useListSiteSettingsAdminQuery(listArgsLocale, { skip: !locale });

  const rowsMerged = React.useMemo(() => {
    const g = Array.isArray(qGlobal.data) ? qGlobal.data : [];
    const l = Array.isArray(qLocale.data) ? qLocale.data : [];
    return [...g, ...l].map((row) => ({ ...row, key: stripPrefix(String(row.key || '')) }));
  }, [qGlobal.data, qLocale.data, stripPrefix]);

  const rows = React.useMemo(
    () => buildSiteSettingsGeneralRows(rowsMerged as SiteSetting[], locale),
    [rowsMerged, locale],
  );

  const busy = qGlobal.isLoading || qLocale.isLoading || qGlobal.isFetching || qLocale.isFetching || isSaving;

  const refetchAll = async () => {
    await Promise.all([qGlobal.refetch(), qLocale.refetch()]);
  };

  const hasAnyMissing = rows.some((r) => !r.hasValue);

  const createMissing = async () => {
    try {
      for (const r of rows) {
        if (r.hasValue) continue;
        await updateSetting({ key: withPrefix(r.key), locale: '*', value: SITE_SETTINGS_DEFAULTS_BY_KEY[r.key] as any }).unwrap();
      }
      toast.success(t('admin.siteSettings.general.globalBootstrapSuccess'));
      await refetchAll();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || t('admin.siteSettings.messages.error'));
    }
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('admin.siteSettings.general.description', { locale })}
        </p>
        <Button type="button" variant="ghost" size="icon" onClick={refetchAll} disabled={busy} title={t('admin.siteSettings.filters.refreshButton')}>
          <RefreshCcw className="size-4" />
        </Button>
      </div>

      {/* Settings list */}
      <div className="space-y-2">
        {rows.map((r) => {
          const summary = summariseSiteSettingsValue(r.value, t('admin.siteSettings.general.recordCount'));

          return (
            <Link
              key={r.key}
              href={r.hasValue ? buildSiteSettingsEditHref(withPrefix(r.key), r.editLocale) : '#'}
              prefetch={false}
              className={`group flex items-center gap-3 rounded-lg border p-3 transition-colors sm:p-4 ${
                r.hasValue ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60'
              }`}
              onClick={r.hasValue ? undefined : (e) => e.preventDefault()}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{t(`admin.siteSettings.general.keyLabels.${r.key}`)}</span>
                  {!r.hasValue ? (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {t('admin.siteSettings.general.sourceNone')}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{t(`admin.siteSettings.general.keyDescriptions.${r.key}`)}</p>
                {summary ? (
                  <p className="mt-1 truncate text-xs text-foreground/70">{summary}</p>
                ) : null}
              </div>

              {r.hasValue ? (
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* Create missing button */}
      {hasAnyMissing ? (
        <Button type="button" variant="outline" size="sm" onClick={createMissing} disabled={busy} className="w-full sm:w-auto">
          <Plus className="mr-1.5 size-3.5" />
          {t('admin.siteSettings.general.globalBootstrap')}
        </Button>
      ) : null}
    </div>
  );
};

GeneralSettingsTab.displayName = 'GeneralSettingsTab';
