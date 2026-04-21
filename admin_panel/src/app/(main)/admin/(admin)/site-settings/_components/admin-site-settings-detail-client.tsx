'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/_components/admin-site-settings-detail-client.tsx
// =============================================================

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { AdminLocaleSelect } from '@/components/common/admin-locale-select';
import { useAdminLocales } from '@/components/common/use-admin-locales';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import type { SiteSetting, SettingValue } from '@/integrations/shared';
import {
  SITE_SETTINGS_BRAND,
  SITE_SETTINGS_BRAND_PREFIX,
  buildSiteSettingsDetailLocaleOptions,
  coerceSiteSettingsDetailValue,
  pickInitialSiteSettingsDetailLocale,
  resolveSiteSettingsStructuredRendererKey,
  toShortSiteSettingsLocale,
  type SiteSettingsStructuredRendererKey,
} from '@/integrations/shared';
import {
  useGetSiteSettingAdminByKeyQuery,
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
  useDeleteSiteSettingAdminMutation,
} from '@/integrations/hooks';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { SiteSettingsForm } from './site-settings-form';
import { AdminJsonEditor } from '@/app/(main)/admin/_components/common/admin-json-editor';
import { SeoStructuredForm } from '../tabs/structured/seo-structured-form';

import {
  ContactInfoStructuredForm,
  contactFormToObj,
  contactObjToForm,
  type ContactInfoFormState,
} from '../tabs/structured/contact-info-structured-form';

import {
  SocialsStructuredForm,
  socialsFormToObj,
  socialsObjToForm,
  type SocialsFormState,
} from '../tabs/structured/socials-structured-form';

import {
  CompanyProfileStructuredForm,
  companyFormToObj,
  companyObjToForm,
  type CompanyProfileFormState,
} from '../tabs/structured/company-profile-structured-form';

import {
  UiHeaderStructuredForm,
  uiHeaderFormToObj,
  uiHeaderObjToForm,
  type UiHeaderFormState,
} from '../tabs/structured/ui-header-structured-form';

import {
  BusinessHoursStructuredForm,
  businessHoursFormToObj,
  businessHoursObjToForm,
  type BusinessHoursFormState,
} from '../tabs/structured/business-hours-structured-form';

import {
  AppLocalesStructuredForm,
  appLocalesObjToForm,
  appLocalesFormToObj,
  type LocaleItem,
} from '../tabs/structured/app-locales-structured-form';

import {
  SeoPagesStructuredForm,
  seoPagesObjToForm,
  seoPagesFormToObj,
} from '../tabs/structured/seo-pages-structured-form';

import {
  HeroStructuredForm,
  heroObjToForm,
  heroFormToObj,
} from '../tabs/structured/hero-structured-form';

import {
  BackgroundsStructuredForm,
  type BackgroundItem,
} from '../tabs/structured/home-backgrounds-structured-form';

/* ----------------------------- structured renderers ----------------------------- */

type StructuredRenderProps = {
  value: SettingValue;
  setValue: (next: any) => void;
  disabled?: boolean;
  settingKey: string;
  locale: string;
};

const JsonStructuredRenderer: React.FC<StructuredRenderProps> = ({ value, setValue, disabled }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const v = coerceSiteSettingsDetailValue(value ?? {});

  // Plain string values (e.g. email, phone, URL) — render a simple text input
  // so the user doesn't need to type JSON quotes
  if (typeof v === 'string') {
    return (
      <div className="space-y-3">
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          {t('admin.siteSettings.detail.structuredJson.noRenderer')}
        </div>
        <Input
          value={v}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          className="font-mono"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border p-3 text-sm text-muted-foreground">
        {t('admin.siteSettings.detail.structuredJson.noRenderer')}
      </div>

      <AdminJsonEditor
        label={t('admin.siteSettings.detail.structuredJson.label')}
        value={v ?? {}}
        onChange={(next) => setValue(next)}
        disabled={disabled}
        helperText={t('admin.siteSettings.detail.structuredJson.helperText')}
        height={340}
      />
    </div>
  );
};

const SeoStructuredRenderer: React.FC<StructuredRenderProps> = (p) => (
  <SeoStructuredForm
    settingKey={p.settingKey}
    locale={p.locale}
    value={p.value}
    setValue={p.setValue}
    disabled={p.disabled}
  />
);

const HeroStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const data = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value);
    return heroObjToForm(v && typeof v === "object" ? v : {});
  }, [value]);

  return (
    <HeroStructuredForm
      value={data}
      onChange={(next) => setValue(heroFormToObj(next))}
      disabled={!!disabled}
    />
  );
};

const BackgroundsStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const data = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value);
    return (Array.isArray(v) ? v : []) as BackgroundItem[];
  }, [value]);

  return (
    <BackgroundsStructuredForm
      value={data}
      onChange={(next) => setValue(next)}
      disabled={!!disabled}
    />
  );
};

const SeoPagesStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const data = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value);
    return seoPagesObjToForm(v && typeof v === 'object' ? v : {});
  }, [value]);

  return (
    <SeoPagesStructuredForm
      value={data}
      onChange={(next) => setValue(seoPagesFormToObj(next))}
      disabled={!!disabled}
    />
  );
};

const AppLocalesStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const items = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value);
    return appLocalesObjToForm(Array.isArray(v) ? v : []);
  }, [value]);

  return (
    <AppLocalesStructuredForm
      value={items}
      onChange={(next) => setValue(appLocalesFormToObj(next))}
      disabled={!!disabled}
    />
  );
};

const ContactStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ phone: '', email: '', address: '', whatsapp: '' }) as any,
    [],
  );
  const [form, setForm] = React.useState<ContactInfoFormState>(() => contactObjToForm(base, seed));

  React.useEffect(() => setForm(contactObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: ContactInfoFormState) => {
    setForm(next);
    setValue(contactFormToObj(next));
  };

  return (
    <ContactInfoStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const SocialsStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ instagram: '', facebook: '', linkedin: '', youtube: '', x: '' }) as any,
    [],
  );
  const [form, setForm] = React.useState<SocialsFormState>(() => socialsObjToForm(base, seed));

  React.useEffect(() => setForm(socialsObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: SocialsFormState) => {
    setForm(next);
    setValue(socialsFormToObj(next));
  };

  return (
    <SocialsStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const CompanyStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () => ({ company_name: 'guezelwebdesign', slogan: '', about: '' }) as any,
    [],
  );

  const [form, setForm] = React.useState<CompanyProfileFormState>(() =>
    companyObjToForm(base, seed),
  );
  React.useEffect(() => setForm(companyObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: CompanyProfileFormState) => {
    setForm(next);
    setValue(companyFormToObj(next));
  };

  return (
    <CompanyProfileStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const UiHeaderStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value) ?? {};
    return typeof v === 'object' && v ? v : {};
  }, [value]);

  const seed = React.useMemo(
    () =>
      ({
        nav_home: 'Home',
        nav_products: 'Products',
        nav_services: 'Services',
        nav_contact: 'Contact',
        cta_label: 'Get Offer',
      }) as any,
    [],
  );

  const [form, setForm] = React.useState<UiHeaderFormState>(() => uiHeaderObjToForm(base, seed));
  React.useEffect(() => setForm(uiHeaderObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: UiHeaderFormState) => {
    setForm(next);
    setValue(uiHeaderFormToObj(next));
  };

  return (
    <UiHeaderStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

const BusinessHoursStructuredRenderer: React.FC<StructuredRenderProps> = ({
  value,
  setValue,
  disabled,
}) => {
  const base = React.useMemo(() => {
    const v = coerceSiteSettingsDetailValue(value);
    return Array.isArray(v) ? v : [];
  }, [value]);

  const seed = React.useMemo(
    () =>
      [
        { day: 'mon', open: '09:00', close: '18:00', closed: false },
        { day: 'tue', open: '09:00', close: '18:00', closed: false },
        { day: 'wed', open: '09:00', close: '18:00', closed: false },
        { day: 'thu', open: '09:00', close: '18:00', closed: false },
        { day: 'fri', open: '09:00', close: '18:00', closed: false },
        { day: 'sat', open: '10:00', close: '14:00', closed: false },
        { day: 'sun', open: '00:00', close: '00:00', closed: true },
      ] as any,
    [],
  );

  const [form, setForm] = React.useState<BusinessHoursFormState>(() =>
    businessHoursObjToForm(base, seed),
  );
  React.useEffect(() => setForm(businessHoursObjToForm(base, seed)), [base, seed]);

  const handleChange = (next: BusinessHoursFormState) => {
    setForm(next);
    setValue(businessHoursFormToObj(next));
  };

  return (
    <BusinessHoursStructuredForm
      value={form}
      onChange={handleChange}
      errors={{}}
      disabled={!!disabled}
      seed={seed}
    />
  );
};

/* ----------------------------- component ----------------------------- */

export default function SiteSettingsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const brand = SITE_SETTINGS_BRAND;
  const settingPrefix = SITE_SETTINGS_BRAND_PREFIX;
  const stripPrefix = React.useCallback(
    (key: string) => (settingPrefix && key.startsWith(settingPrefix) ? key.slice(settingPrefix.length) : key),
    [settingPrefix],
  );
  const withPrefix = React.useCallback(
    (key: string) => `${settingPrefix}${key}`,
    [settingPrefix],
  );

  const rawSettingKey = React.useMemo(() => String(id || '').trim(), [id]);
  const settingKey = React.useMemo(() => stripPrefix(rawSettingKey), [rawSettingKey, stripPrefix]);

  const {
    localeOptions: appLocaleOptions,
    defaultLocaleFromDb,
    loading: isLocalesLoading,
    fetching: isLocalesFetching,
  } = useAdminLocales();

  const localeOptions = React.useMemo(
    () => buildSiteSettingsDetailLocaleOptions(appLocaleOptions, t('admin.siteSettings.detail.globalOption')),
    [appLocaleOptions, t],
  );

  const localeFromQuery = React.useMemo(() => {
    const q = sp.get('locale');
    return (q ?? '').trim();
  }, [sp]);

  const initialLocale = React.useMemo(
    () =>
      pickInitialSiteSettingsDetailLocale({
        localeFromQuery,
        localeOptions,
        defaultLocaleFromDb,
      }),
    [localeFromQuery, localeOptions, defaultLocaleFromDb],
  );

  const [selectedLocale, setSelectedLocale] = React.useState<string>('');

  // init/repair selectedLocale
  React.useEffect(() => {
    if (!localeOptions.length) return;

    setSelectedLocale((prev) => {
      if (prev && localeOptions.some((x) => x.value === prev)) return prev;
      return initialLocale || '';
    });
  }, [localeOptions, initialLocale]);

  // keep URL in sync
  React.useEffect(() => {
    if (!settingKey || !selectedLocale) return;

    const cur = localeFromQuery === '*' ? '*' : toShortSiteSettingsLocale(localeFromQuery);
    if (cur === selectedLocale) return;

    const qs = new URLSearchParams(Array.from(sp.entries()));
    qs.set('locale', selectedLocale);
    router.replace(`/admin/site-settings/${encodeURIComponent(rawSettingKey)}?${qs.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSettingKey, selectedLocale]);

  // load row for key+locale (same pattern as /pages)
  const listArgs = React.useMemo(() => {
    if (!settingKey || !selectedLocale) return undefined;
    return { keys: [withPrefix(settingKey)], locale: selectedLocale, limit: 10, offset: 0 };
  }, [settingKey, selectedLocale, withPrefix]);

  const {
    data: rows,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery(listArgs as any, { skip: !listArgs });

  const rowFromList: SiteSetting | null = React.useMemo(() => {
    const arr = Array.isArray(rows) ? (rows as SiteSetting[]) : [];
    const exact = arr.find(
      (r) => stripPrefix(String(r?.key || '')) === settingKey && String(r?.locale || '') === selectedLocale,
    );
    if (exact) return exact;

    const byKey = arr.find((r) => stripPrefix(String(r?.key || '')) === settingKey);
    return byKey || null;
  }, [rows, settingKey, selectedLocale, stripPrefix]);

  // fallback-aware single read (shows effective locale row if selected locale doesn't exist)
  const resolvedQ = useGetSiteSettingAdminByKeyQuery(
    { key: withPrefix(settingKey), locale: selectedLocale },
    { skip: !settingKey || !selectedLocale },
  );

  const resolvedRow = React.useMemo(
    () =>
      resolvedQ.data
        ? ({
            ...(resolvedQ.data as SiteSetting),
            key: stripPrefix(String((resolvedQ.data as SiteSetting).key || '')),
          } as SiteSetting)
        : null,
    [resolvedQ.data, stripPrefix],
  );

  const row: SiteSetting | null = rowFromList ?? resolvedRow;

  const effectiveLocale = React.useMemo(() => {
    const loc = (resolvedRow as any)?.locale;
    return loc === null || loc === undefined ? '' : String(loc).trim();
  }, [resolvedRow]);

  const isFallback =
    !rowFromList && !!resolvedRow && effectiveLocale && effectiveLocale !== selectedLocale;

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [deleteSetting, { isLoading: isDeleting }] = useDeleteSiteSettingAdminMutation();

  const busy =
    isLoading ||
    isFetching ||
    resolvedQ.isLoading ||
    resolvedQ.isFetching ||
    isSaving ||
    isDeleting ||
    isLocalesLoading ||
    isLocalesFetching;

  const handleSave = async (args: { key: string; locale: string; value: SettingValue }) => {
    try {
      if (String(args.key).toLowerCase() === 'site_meta_default' && args.locale === '*') {
        toast.error(t('admin.siteSettings.detail.siteMetaDefaultGlobalGuard'));
        return;
      }
      await updateSetting({ key: withPrefix(args.key), locale: args.locale, value: args.value }).unwrap();
      toast.success(t('admin.siteSettings.detail.updated', { key: args.key, locale: args.locale }));
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.messages.error');
      toast.error(msg);
    }
  };

  const handleDelete = async (args: { key: string; locale?: string }) => {
    try {
      await deleteSetting({ key: withPrefix(args.key), locale: args.locale }).unwrap();
      toast.success(
        t('admin.siteSettings.detail.deleted', { key: args.key, locale: args.locale || '' }),
      );
      await refetch();
    } catch (err: any) {
      const msg =
        err?.data?.error?.message || err?.message || t('admin.siteSettings.messages.error');
      toast.error(msg);
    }
  };

  const renderStructuredKey = React.useMemo<SiteSettingsStructuredRendererKey>(
    () => resolveSiteSettingsStructuredRendererKey(settingKey),
    [settingKey],
  );

  const backHref = '/admin/site-settings';

  if (!settingKey) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.siteSettings.detail.keyMissingTitle')}</CardTitle>
            <CardDescription>{t('admin.siteSettings.detail.keyMissingDesc')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!busy && (!appLocaleOptions || appLocaleOptions.length === 0)) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.siteSettings.detail.localesMissingTitle')}</CardTitle>
            <CardDescription>
              {t('admin.siteSettings.detail.localesMissingDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link prefetch={false} href={backHref}>
                {t('admin.siteSettings.detail.localesMissingAction')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header — responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-lg font-semibold truncate">
            {settingKey}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link prefetch={false} href={backHref}>
              {t('admin.siteSettings.detail.backToList')}
            </Link>
          </Button>

          <div className="w-32 sm:w-40">
            <AdminLocaleSelect
              value={selectedLocale || ''}
              onChange={(value: string) => setSelectedLocale(value === '*' ? '*' : toShortSiteSettingsLocale(value))}
              options={localeOptions}
              loading={isLocalesLoading || isLocalesFetching}
              disabled={busy || !localeOptions.length}
              label={t('admin.siteSettings.detail.localeLabel')}
              allowEmpty={false}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={busy}
            title={t('admin.siteSettings.detail.inline.refresh')}
            className="h-8 w-8"
          >
            <RefreshCcw className="size-4" />
          </Button>

          {busy ? <Badge variant="outline">{t('admin.siteSettings.detail.inline.loading')}</Badge> : null}
        </div>
      </div>

      {!selectedLocale ? (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          {t('admin.siteSettings.detail.inline.loadingLocale')}
        </div>
      ) : (
        <div className="space-y-3">
          {isFallback ? (
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              {t('admin.siteSettings.detail.inline.fallbackInfo')}
            </div>
          ) : null}

          {!row && !busy ? (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              {t('admin.siteSettings.detail.inline.noRecord')}
            </div>
          ) : null}

          <SiteSettingsForm
            settingKey={settingKey}
            locale={selectedLocale}
            row={
              row
                ? ({
                    ...row,
                    value: coerceSiteSettingsDetailValue((row as any).value),
                  } as any)
                : null
            }
            disabled={busy}
            initialMode="structured"
            onSave={handleSave}
            onDelete={async ({ key, locale }) => handleDelete({ key, locale })}
            renderStructured={(ctx) => {
              const commonProps = {
                value: ctx.value,
                setValue: ctx.setValue,
                disabled: ctx.disabled,
                settingKey,
                locale: selectedLocale,
              };

              if (renderStructuredKey === 'seo') return React.createElement(SeoStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'app_locales') return React.createElement(AppLocalesStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'hero') return React.createElement(HeroStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'home_backgrounds') return React.createElement(BackgroundsStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'seo_pages') return React.createElement(SeoPagesStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'contact_info') return React.createElement(ContactStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'socials') return React.createElement(SocialsStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'company_profile') return React.createElement(CompanyStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'ui_header') return React.createElement(UiHeaderStructuredRenderer as any, commonProps);
              if (renderStructuredKey === 'businessHours') return React.createElement(BusinessHoursStructuredRenderer as any, commonProps);

              return React.createElement(JsonStructuredRenderer as any, commonProps);
            }}
          />
        </div>
      )}

    </div>
  );
}
