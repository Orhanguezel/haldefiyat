'use client';

// =============================================================
// FILE: site-settings/tabs/branding-settings-tab.tsx
// Admin Panel Branding Ayarları (GLOBAL)
// - Site adı, copyright, html lang, favicon, meta/OG bilgileri
// - ui_admin_config.branding alt-objesi olarak saklanır
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';
import {
  EMPTY_SITE_SETTINGS_BRANDING_FORM,
  SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS,
  type SiteSettingsBrandingForm,
  brandingToSiteSettingsForm,
  getSiteSettingsBrandingErrorMessage,
  mergeSiteSettingsBrandingConfig,
  normalizeSiteSettingsBrandingConfig,
  siteSettingsFormToBranding,
} from '@/integrations/shared';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type BrandingSettingsTabProps = {
  locale: string;
};

export const BrandingSettingsTab: React.FC<BrandingSettingsTabProps> = ({ locale }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const {
    data: configRow,
    isLoading,
    isFetching,
    refetch,
  } = useGetSiteSettingAdminByKeyQuery({ key: 'ui_admin_config', locale }, { refetchOnMountOrArgChange: true });

  React.useEffect(() => {
    if (locale) void refetch();
  }, [locale, refetch]);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [form, setForm] = React.useState<SiteSettingsBrandingForm>(EMPTY_SITE_SETTINGS_BRANDING_FORM);

  // Parse existing config and extract branding
  const fullConfig = React.useMemo(() => {
    return configRow?.value ?? null;
  }, [configRow]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  React.useEffect(() => {
    if (loading) return; // Wait during fetch

    if (!fullConfig) {
       setForm(brandingToSiteSettingsForm(normalizeSiteSettingsBrandingConfig(null)));
       return;
    }

    setForm(brandingToSiteSettingsForm(normalizeSiteSettingsBrandingConfig(fullConfig)));
  }, [fullConfig, loading, locale]); // ✅ Added locale to ensure it resets on lang change

  const handleChange = (field: keyof SiteSettingsBrandingForm, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    try {
      // Merge branding back into full config
      const newBranding = siteSettingsFormToBranding(form);
      const merged = mergeSiteSettingsBrandingConfig(fullConfig, newBranding);

      await updateSetting({
        key: 'ui_admin_config',
        value: merged,
        locale: locale,
      }).unwrap();

      toast.success(t('admin.siteSettings.branding.saved'));
      await refetch();
    } catch (err: unknown) {
      toast.error(getSiteSettingsBrandingErrorMessage(err, t('admin.siteSettings.branding.saveError')));
    }
  };

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.branding.title')}</CardTitle>
            <CardDescription>{t('admin.siteSettings.branding.description')}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {configRow?.locale === '*' ? (
              <Badge variant="secondary" className="gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-500" />
                {t('admin.siteSettings.badges.global')}
              </Badge>
            ) : (
              <Badge variant="default" className="gap-1.5">
                <span className="size-1.5 rounded-full bg-green-500" />
                {t('admin.siteSettings.seo.override')} ({configRow?.locale})
              </Badge>
            )}
            
            {/* Show a hint if we are on a locale but seeing global values */}
            {locale !== '*' && configRow?.locale === '*' && (
              <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700">
                {t('admin.siteSettings.messages.usingGlobalFallback')}
              </Badge>
            )}

            {busy && <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge>}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={busy}
              title={t('admin.siteSettings.actions.refresh')}
            >
              <RefreshCcw className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Identity */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t('admin.siteSettings.branding.identity')}
          </legend>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="branding_app_name">
                {t('admin.siteSettings.branding.fields.appName')}
              </Label>
                <Input
                  id="branding_app_name"
                  value={form.app_name}
                  onChange={(e) => handleChange('app_name', e.target.value)}
                  placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.app_name}`)}
                  disabled={busy}
                />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding_app_copyright">
                {t('admin.siteSettings.branding.fields.copyright')}
              </Label>
                <Input
                  id="branding_app_copyright"
                  value={form.app_copyright}
                  onChange={(e) => handleChange('app_copyright', e.target.value)}
                  placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.app_copyright}`)}
                  disabled={busy}
                />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding_html_lang">
                {t('admin.siteSettings.branding.fields.htmlLang')}
              </Label>
                <Input
                  id="branding_html_lang"
                  value={form.html_lang}
                  onChange={(e) => handleChange('html_lang', e.target.value)}
                  placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.html_lang}`)}
                  disabled={busy}
                />
              <p className="text-xs text-muted-foreground">
                {t('admin.siteSettings.branding.fields.htmlLangHelp')}
              </p>
            </div>
          </div>
        </fieldset>

        {/* Visual */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t('admin.siteSettings.branding.visual')}
          </legend>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branding_theme_color">
                {t('admin.siteSettings.branding.fields.themeColor')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="branding_theme_color"
                  value={form.theme_color}
                  onChange={(e) => handleChange('theme_color', e.target.value)}
                  placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.theme_color}`)}
                  disabled={busy}
                  className="flex-1"
                />
                {form.theme_color && (
                  <div
                    className="size-9 shrink-0 rounded-md border"
                    style={{ backgroundColor: form.theme_color }}
                  />
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('admin.siteSettings.branding.mediaHint')}
          </p>
        </fieldset>

        {/* Meta / SEO */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-foreground">
            {t('admin.siteSettings.branding.metaSeo')}
          </legend>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branding_meta_title">
                {t('admin.siteSettings.branding.fields.metaTitle')}
              </Label>
              <Input
                id="branding_meta_title"
                value={form.meta_title}
                onChange={(e) => handleChange('meta_title', e.target.value)}
                placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.meta_title}`)}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding_og_url">
                {t('admin.siteSettings.branding.fields.ogUrl')}
              </Label>
              <Input
                id="branding_og_url"
                value={form.og_url}
                onChange={(e) => handleChange('og_url', e.target.value)}
                placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.og_url}`)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branding_meta_description">
              {t('admin.siteSettings.branding.fields.metaDescription')}
            </Label>
            <Textarea
              id="branding_meta_description"
              rows={3}
              value={form.meta_description}
              onChange={(e) => handleChange('meta_description', e.target.value)}
              placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.meta_description}`)}
              disabled={busy}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branding_og_title">
                {t('admin.siteSettings.branding.fields.ogTitle')}
              </Label>
              <Input
                id="branding_og_title"
                value={form.og_title}
                onChange={(e) => handleChange('og_title', e.target.value)}
                placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.og_title}`)}
                disabled={busy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branding_twitter_card">
                {t('admin.siteSettings.branding.fields.twitterCard')}
              </Label>
              <Input
                id="branding_twitter_card"
                value={form.twitter_card}
                onChange={(e) => handleChange('twitter_card', e.target.value)}
                placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.twitter_card}`)}
                disabled={busy}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="branding_og_description">
              {t('admin.siteSettings.branding.fields.ogDescription')}
            </Label>
            <Textarea
              id="branding_og_description"
              rows={3}
              value={form.og_description}
              onChange={(e) => handleChange('og_description', e.target.value)}
              placeholder={t(`admin.siteSettings.branding.placeholders.${SITE_SETTINGS_BRANDING_PLACEHOLDER_KEYS.og_description}`)}
              disabled={busy}
            />
          </div>
        </fieldset>

        {/* Save */}
        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} disabled={busy}>
            {isSaving ? t('admin.siteSettings.actions.saving') : t('admin.siteSettings.actions.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
