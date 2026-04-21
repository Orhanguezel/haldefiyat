'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/_components/admin-site-settings-client.tsx
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { Search, RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { useAppDispatch } from '@/stores/hooks';
import { useAdminLocales } from '@/components/common/use-admin-locales';
import { AdminLocaleSelect } from '@/components/common/admin-locale-select';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { SiteSettingsList } from './site-settings-list';

// tabs (content sources)
import { GeneralSettingsTab } from '../tabs/general-settings-tab';
import { SeoSettingsTab } from '../tabs/seo-settings-tab';
import { SmtpSettingsTab } from '../tabs/smtp-settings-tab';
import { CloudinarySettingsTab } from '../tabs/cloudinary-settings-tab';
import { BrandMediaTab } from '../tabs/brand-media-tab';
import { ApiSettingsTab } from '../tabs/api-settings-tab';
import { LocalesSettingsTab } from '../tabs/locales-settings-tab';
import { BrandingSettingsTab } from '../tabs/branding-settings-tab';

import type { SiteSetting } from '@/integrations/shared';
import {
  SITE_SETTINGS_BRAND,
  SITE_SETTINGS_BRAND_PREFIX,
  getErrorMessage,
  isSiteSettingsGlobalTab,
  type SiteSettingsTab,
} from '@/integrations/shared';
import {
  useListSiteSettingsAdminQuery,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';
import { siteSettingsAdminApi } from '@/integrations/endpoints/admin/site-settings-admin-endpoints';

/* ----------------------------- list panels ----------------------------- */

function ListPanel({
  locale,
  search,
  prefix,
  onDeleteRow,
}: {
  locale: string; // selected locale OR '*'
  search: string;
  prefix?: string;
  onDeleteRow: (row: SiteSetting) => void;
}) {
  const qArgs = React.useMemo(() => {
    const q = search.trim() || undefined;
    return {
      locale,
      q,
      prefix: prefix || undefined,
      sort: 'key' as const,
      order: 'asc' as const,
      limit: 200,
      offset: 0,
    };
  }, [locale, search, prefix]);

  const listQ = useListSiteSettingsAdminQuery(qArgs, {
    skip: !locale,
    refetchOnMountOrArgChange: true,
  });

  const loading = listQ.isLoading || listQ.isFetching;

  return (
    <SiteSettingsList
      settings={(listQ.data ?? []) as SiteSetting[]}
      loading={loading}
      selectedLocale={locale}
      onDelete={onDeleteRow}
      getEditHref={(s) => `/admin/site-settings/${encodeURIComponent(String(s.key || ''))}?locale=${encodeURIComponent(locale)}`}
    />
  );
}

/* ----------------------------- main component ----------------------------- */

export default function AdminSiteSettingsClient() {
  const dispatch = useAppDispatch();
  const brand = SITE_SETTINGS_BRAND;
  const brandPrefix = SITE_SETTINGS_BRAND_PREFIX;
  const isScopedBrand = true;
  const {
    localeOptions,
    defaultLocaleFromDb,
    loading: localesLoading,
    fetching: localesFetching,
    coerceLocale,
  } = useAdminLocales();

  const [tab, setTab] = React.useState<SiteSettingsTab>('general');
  const [search, setSearch] = React.useState('');
  const [locale, setLocale] = React.useState<string>('');
  const [localeTouched, setLocaleTouched] = React.useState<boolean>(false);

  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  // Otomatik dil seçimi: varsayılan aktif dili kullan
  React.useEffect(() => {
    if (localeTouched) return;
    const nextLocale = coerceLocale(defaultLocaleFromDb);
    if (nextLocale) {
      setLocale(nextLocale);
    }
  }, [coerceLocale, defaultLocaleFromDb, localeTouched]);

  const headerLoading =
    localesFetching ||
    localesLoading;

  const disabled = headerLoading || isDeleting;

  const onRefresh = async () => {
    try {
      dispatch(
        siteSettingsAdminApi.util.invalidateTags([
          { type: 'SiteSettings', id: 'LIST' },
          { type: 'SiteSettings', id: 'APP_LOCALES' },
          { type: 'SiteSettings', id: 'DEFAULT_LOCALE' },
        ]),
      );
      toast.success(t('admin.siteSettings.filters.refreshed'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('admin.siteSettings.messages.error')));
    }
  };

  const handleDeleteRow = async (row: SiteSetting) => {
    const key = String(row?.key || '').trim();
    const rowLocale = row?.locale ? String(row.locale) : undefined;
    if (!key) return;

    const ok = window.confirm(
      t('admin.siteSettings.list.deleteConfirm', { key, locale: rowLocale || locale || '—' }),
    );
    if (!ok) return;

    try {
      await deleteSetting({ key, locale: rowLocale ?? undefined }).unwrap();
      toast.success(t('admin.siteSettings.messages.deleted'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('admin.siteSettings.messages.error')));
    }
  };

  const localeReady = Boolean(locale && locale.trim());
  const isGlobalTab = isSiteSettingsGlobalTab(tab);

  return (
    <div className="w-full min-w-0 space-y-4 overflow-hidden pb-6 sm:space-y-6">
      {/* PAGE HEAD */}
      <div className="space-y-1 px-1 sm:px-0">
        <h1 className="text-lg font-semibold">{t('admin.siteSettings.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('admin.siteSettings.description')}
        </p>
      </div>

      {/* FILTERS */}
      <Card>
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-sm sm:text-base">{t('admin.siteSettings.filters.title')}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3 px-3 pb-3 sm:space-y-4 sm:px-6 sm:pb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_auto]">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="q" className="text-xs sm:text-sm">{t('admin.siteSettings.filters.search')}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="q"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('admin.siteSettings.filters.searchPlaceholder')}
                  className="w-full pl-9"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <AdminLocaleSelect
                value={localeReady ? locale : coerceLocale(defaultLocaleFromDb)}
                onChange={(nextLocale: string) => {
                  setLocaleTouched(true);
                  setLocale(coerceLocale(nextLocale, defaultLocaleFromDb));
                }}
                options={localeOptions}
                loading={localesLoading || localesFetching}
                disabled={disabled || isGlobalTab}
                label={t('admin.siteSettings.filters.language')}
                allowEmpty={false}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRefresh}
                disabled={disabled}
                title={t('admin.siteSettings.filters.refreshButton')}
              >
                <RefreshCcw className="size-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  if (!isGlobalTab) {
                    setLocaleTouched(false);
                    setLocale(coerceLocale(defaultLocaleFromDb));
                  }
                }}
                disabled={disabled}
              >
                {t('admin.siteSettings.filters.resetButton')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONTENT */}
      <Card className="overflow-hidden">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm sm:text-base">{t('admin.siteSettings.management.title')}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              {isGlobalTab ? <Badge variant="secondary" className="text-xs">{t('admin.siteSettings.badges.global')}</Badge> : null}
              {!isGlobalTab && localeReady ? <Badge variant="secondary" className="text-xs">{locale}</Badge> : null}
              {disabled ? <Badge variant="outline" className="text-xs">{t('admin.siteSettings.messages.loading')}</Badge> : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 space-y-4 px-3 pb-3 sm:px-6 sm:pb-6">
          {!localeReady ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              {t('admin.siteSettings.management.loadingMeta')}
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as SiteSettingsTab)}>
              <div className="overflow-x-auto">
                <TabsList className="inline-flex h-auto w-max gap-1 p-1">
                  <TabsTrigger value="list" className="whitespace-nowrap text-xs sm:text-sm">
                    {t('admin.siteSettings.tabs.list')}
                  </TabsTrigger>
                  <TabsTrigger value="global_list" className="whitespace-nowrap text-xs sm:text-sm">
                    {t('admin.siteSettings.tabs.globalList')}
                  </TabsTrigger>
                  <TabsTrigger value="general" className="whitespace-nowrap text-xs sm:text-sm">
                    {t('admin.siteSettings.tabs.general')}
                  </TabsTrigger>
                  <TabsTrigger value="seo" className="whitespace-nowrap text-xs sm:text-sm">
                    {t('admin.siteSettings.tabs.seo')}
                  </TabsTrigger>
                  <TabsTrigger value="smtp" className="whitespace-nowrap text-xs sm:text-sm">
                    {t('admin.siteSettings.tabs.smtp')}
                  </TabsTrigger>
                  <TabsTrigger value="brand_media" className="whitespace-nowrap text-xs sm:text-sm">
                    {t('admin.siteSettings.tabs.brandMedia')}
                  </TabsTrigger>
                  <TabsTrigger value="api" className="whitespace-nowrap text-xs sm:text-sm">
                    {t('admin.siteSettings.tabs.apiServices')}
                  </TabsTrigger>
                  <TabsTrigger value="locales" className="whitespace-nowrap text-xs sm:text-sm">
                    {t('admin.siteSettings.tabs.locales')}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="list" className="mt-3 sm:mt-4">
                <ListPanel locale={locale} search={search} prefix={brandPrefix} onDeleteRow={handleDeleteRow} />
              </TabsContent>

              <TabsContent value="global_list" className="mt-3 sm:mt-4">
                <ListPanel locale="*" search={search} prefix={brandPrefix} onDeleteRow={handleDeleteRow} />
              </TabsContent>

              <TabsContent value="general" className="mt-3 sm:mt-4">
                <GeneralSettingsTab locale={locale} settingPrefix={brandPrefix} />
              </TabsContent>

              <TabsContent value="seo" className="mt-3 sm:mt-4">
                <SeoSettingsTab locale={locale} settingPrefix={brandPrefix} />
              </TabsContent>

              <TabsContent value="smtp" className="mt-3 sm:mt-4">
                <SmtpSettingsTab locale={locale} />
              </TabsContent>

              <TabsContent value="brand_media" className="mt-3 sm:mt-4">
                <BrandMediaTab locale={locale} />
              </TabsContent>

              <TabsContent value="api" className="mt-3 sm:mt-4">
                <ApiSettingsTab locale={locale} />
              </TabsContent>

              <TabsContent value="locales" className="mt-3 sm:mt-4">
                <LocalesSettingsTab settingPrefix={brandPrefix} />
              </TabsContent>



            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
