'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/_components/admin-site-settings-client.tsx
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import {
  Activity,
  BadgeCheck,
  ChevronRight,
  Cloud,
  Database,
  Globe,
  ImageIcon,
  Languages,
  Mail,
  RefreshCcw,
  Search,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
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

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

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
  const brandPrefix = SITE_SETTINGS_BRAND_PREFIX;
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

  const menuItems = React.useMemo(
    () => [
      {
        value: 'general' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.general', undefined, 'Genel Ayarlar'),
        description: t('admin.siteSettings.menu.generalDescription', undefined, 'Temel site bilgileri ve ana içerik blokları.'),
        icon: Settings,
      },
      {
        value: 'branding' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.branding', undefined, 'Marka & Kimlik'),
        description: t('admin.siteSettings.menu.brandingDescription', undefined, 'Panel kimliği, meta ve marka davranışları.'),
        icon: BadgeCheck,
      },
      {
        value: 'brand_media' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.brandMedia', undefined, 'Logo & Medya'),
        description: t('admin.siteSettings.menu.brandMediaDescription', undefined, 'Logo, ikon ve varsayılan medya dosyaları.'),
        icon: ImageIcon,
      },
      {
        value: 'seo' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.seo', undefined, 'SEO & Meta'),
        description: t('admin.siteSettings.menu.seoDescription', undefined, 'Arama motoru ve sosyal paylaşım ayarları.'),
        icon: Globe,
      },
      {
        value: 'api' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.apiServices', undefined, 'API & Entegrasyon'),
        description: t('admin.siteSettings.menu.apiDescription', undefined, 'Harici servis anahtarları ve bağlantı ayarları.'),
        icon: SlidersHorizontal,
      },
      {
        value: 'smtp' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.smtp', undefined, 'E-posta SMTP'),
        description: t('admin.siteSettings.menu.smtpDescription', undefined, 'E-posta gönderim altyapısı.'),
        icon: Mail,
      },
      {
        value: 'cloudinary' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.cloudinary', undefined, 'Cloudinary'),
        description: t('admin.siteSettings.menu.cloudinaryDescription', undefined, 'Görsel depolama ve dönüşüm servisi.'),
        icon: Cloud,
      },
      {
        value: 'locales' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.locales', undefined, 'Diller'),
        description: t('admin.siteSettings.menu.localesDescription', undefined, 'Aktif diller ve varsayılan dil ayarı.'),
        icon: Languages,
      },
      {
        value: 'list' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.list', undefined, 'Yerel Kayıtlar'),
        description: t('admin.siteSettings.menu.listDescription', undefined, 'Seçili dile ait ham ayar kayıtları.'),
        icon: Database,
      },
      {
        value: 'global_list' as SiteSettingsTab,
        label: t('admin.siteSettings.tabs.globalList', undefined, 'Global Kayıtlar'),
        description: t('admin.siteSettings.menu.globalListDescription', undefined, 'Tüm diller için ortak ayar kayıtları.'),
        icon: Activity,
      },
    ],
    [t],
  );

  const activeMenu = menuItems.find((item) => item.value === tab) ?? menuItems[0];
  const ActiveIcon = activeMenu.icon;

  return (
    <div className="w-full min-w-0 space-y-6 overflow-hidden pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
              {t('admin.siteSettings.kicker', undefined, 'Sistem Yapılandırması')}
            </span>
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t('admin.siteSettings.title')}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {t('admin.siteSettings.description')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGlobalTab ? (
            <Badge variant="secondary" className="gap-1.5">
              <Globe className="size-3.5" />
              {t('admin.siteSettings.badges.global', undefined, 'Global')}
            </Badge>
          ) : localeReady ? (
            <Badge variant="outline" className="gap-1.5">
              <Languages className="size-3.5" />
              {locale}
            </Badge>
          ) : null}
          {disabled ? (
            <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={disabled}
            title={t('admin.siteSettings.filters.refreshButton')}
          >
            <RefreshCcw className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="space-y-1 p-4">
              <CardTitle className="text-sm">{t('admin.siteSettings.filters.title')}</CardTitle>
              <CardDescription>
                {t('admin.siteSettings.management.title', undefined, 'Ayar modülünü seçin.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
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

              {(tab === 'list' || tab === 'global_list') ? (
                <div className="space-y-2">
                  <Label htmlFor="site-settings-search" className="text-sm">
                    {t('admin.siteSettings.filters.search')}
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="site-settings-search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('admin.siteSettings.filters.searchPlaceholder')}
                      className="pl-9"
                      disabled={disabled}
                    />
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.value === tab;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTab(item.value)}
                      className={cx(
                        'group flex w-full items-center justify-between rounded-md border px-3 py-3 text-left transition-colors',
                        active
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon className={cx('size-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold uppercase tracking-wide">
                            {item.label}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </span>
                      <ChevronRight className={cx('size-4 shrink-0', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60')} />
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
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
            </CardContent>
          </Card>

          <div className="rounded-md border bg-muted/30 p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Globe className="size-5" />
            </div>
            <div className="text-sm font-medium">
              {t('admin.siteSettings.globalInfoTitle', undefined, 'Global Ayarlar')}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t(
                'admin.siteSettings.globalInfoDescription',
                undefined,
                'Global işaretli alanlar tüm diller için ortak kaydedilir; diğer alanlar seçili dile göre düzenlenir.',
              )}
            </p>
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-md border bg-card">
          <div className="border-b bg-muted/30 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-background text-primary shadow-sm">
                  <ActiveIcon className="size-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <h2 className="truncate text-xl font-semibold">{activeMenu.label}</h2>
                  <p className="text-sm text-muted-foreground">{activeMenu.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isGlobalTab ? (
                  <Badge variant="secondary">{t('admin.siteSettings.badges.global', undefined, 'Global')}</Badge>
                ) : localeReady ? (
                  <Badge variant="outline">{locale}</Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="min-w-0 p-4 sm:p-6">
            {!localeReady ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {t('admin.siteSettings.management.loadingMeta')}
              </div>
            ) : (
              <div className="min-w-0">
                {tab === 'list' ? (
                  <ListPanel locale={locale} search={search} prefix={brandPrefix} onDeleteRow={handleDeleteRow} />
                ) : null}
                {tab === 'global_list' ? (
                  <ListPanel locale="*" search={search} prefix={brandPrefix} onDeleteRow={handleDeleteRow} />
                ) : null}
                {tab === 'general' ? <GeneralSettingsTab locale={locale} settingPrefix={brandPrefix} /> : null}
                {tab === 'seo' ? <SeoSettingsTab locale={locale} settingPrefix={brandPrefix} /> : null}
                {tab === 'smtp' ? <SmtpSettingsTab locale={locale} /> : null}
                {tab === 'cloudinary' ? <CloudinarySettingsTab locale={locale} /> : null}
                {tab === 'brand_media' ? <BrandMediaTab locale={locale} /> : null}
                {tab === 'branding' ? <BrandingSettingsTab /> : null}
                {tab === 'api' ? <ApiSettingsTab locale={locale} /> : null}
                {tab === 'locales' ? <LocalesSettingsTab settingPrefix={brandPrefix} /> : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
