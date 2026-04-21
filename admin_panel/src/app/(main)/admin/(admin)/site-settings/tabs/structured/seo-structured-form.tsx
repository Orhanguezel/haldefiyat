// =============================================================
// FILE: seo-structured-form.tsx
// SEO Structured Form — supports both simple and advanced modes
// =============================================================

'use client';

import React, { useMemo } from 'react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/admin-image-upload-field';
import {
  type SettingValue,
  type SiteSettingsAdvancedSeo,
  type SiteSettingsSimpleSeo,
  SITE_SETTINGS_SEO_OG_TYPE_OPTIONS,
  SITE_SETTINGS_SEO_TWITTER_CARD_OPTIONS,
  coerceSiteSettingsStructuredValue,
  isSiteSettingsSimpleSeoValue,
  normalizeSiteSettingsAdvancedSeo,
  normalizeSiteSettingsSimpleSeo,
  toSiteSettingsAdvancedSeoObject,
} from '@/integrations/shared';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

/* ── props ── */

export type SeoStructuredFormProps = {
  settingKey: string;
  locale: string;
  value: SettingValue;
  setValue: (next: any) => void;
  disabled?: boolean;
};

/* ── component ── */

export const SeoStructuredForm: React.FC<SeoStructuredFormProps> = ({
  settingKey,
  locale,
  value,
  setValue,
  disabled,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const raw = useMemo(() => coerceSiteSettingsStructuredValue(value) ?? {}, [value]);
  const simple = isSiteSettingsSimpleSeoValue(raw);

  if (simple) {
    return (
      <SimpleSeoForm
        value={normalizeSiteSettingsSimpleSeo(raw)}
        onChange={(next) => setValue(next)}
        disabled={disabled}
      />
    );
  }

  return (
    <AdvancedSeoForm
      value={normalizeSiteSettingsAdvancedSeo(raw)}
      onChange={(next) => setValue(toSiteSettingsAdvancedSeoObject(next))}
      disabled={disabled}
      settingKey={settingKey}
      locale={locale}
    />
  );
};

SeoStructuredForm.displayName = 'SeoStructuredForm';

/* ── Simple SEO Form (vistaseeds__seo) ── */

function SimpleSeoForm({
  value: v,
  onChange,
  disabled,
}: {
  value: SiteSettingsSimpleSeo;
  onChange: (next: SiteSettingsSimpleSeo) => void;
  disabled?: boolean;
}) {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const set = (patch: Partial<SiteSettingsSimpleSeo>) => onChange({ ...v, ...patch });

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t('admin.siteSettings.structured.seo.description')}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="seo-title" className="text-sm">{t('admin.siteSettings.structured.seo.fields.siteTitle')}</Label>
          <Input
            id="seo-title"
            value={v.site_title}
            onChange={(e) => set({ site_title: e.target.value })}
            disabled={disabled}
            placeholder={t('admin.siteSettings.structured.seo.placeholders.siteTitle')}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="seo-desc" className="text-sm">{t('admin.siteSettings.structured.seo.fields.siteDescription')}</Label>
          <Textarea
            id="seo-desc"
            rows={3}
            value={v.site_description}
            onChange={(e) => set({ site_description: e.target.value })}
            disabled={disabled}
            className="text-sm"
            placeholder={t('admin.siteSettings.structured.seo.placeholders.siteDescription')}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="seo-keywords" className="text-sm">{t('admin.siteSettings.structured.seo.fields.keywords')}</Label>
          <Input
            id="seo-keywords"
            value={v.keywords}
            onChange={(e) => set({ keywords: e.target.value })}
            disabled={disabled}
            placeholder={t('admin.siteSettings.structured.seo.placeholders.keywords')}
          />
          <p className="text-xs text-muted-foreground">{t('admin.siteSettings.structured.seo.keywordsHelp')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-og-type" className="text-sm">{t('admin.siteSettings.structured.seo.fields.ogType')}</Label>
          <Select
            value={v.og_type || 'website'}
            onValueChange={(val) => set({ og_type: val })}
            disabled={disabled}
          >
            <SelectTrigger id="seo-og-type" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITE_SETTINGS_SEO_OG_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`admin.siteSettings.structured.seo.options.ogType.${option.labelKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-og-image" className="text-sm">{t('admin.siteSettings.structured.seo.fields.ogImage')}</Label>
          <Input
            id="seo-og-image"
            value={v.og_image}
            onChange={(e) => set({ og_image: e.target.value })}
            disabled={disabled}
            placeholder={t('admin.siteSettings.structured.seo.placeholders.ogImage')}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Advanced SEO Form (global seo/site_seo) ── */

function AdvancedSeoForm({
  value: v,
  onChange,
  disabled,
  settingKey,
  locale,
}: {
  value: SiteSettingsAdvancedSeo;
  onChange: (next: SiteSettingsAdvancedSeo) => void;
  disabled?: boolean;
  settingKey: string;
  locale: string;
}) {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const set = (patch: Partial<SiteSettingsAdvancedSeo>) => onChange({ ...v, ...patch });

  return (
    <div className="space-y-4">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t('admin.siteSettings.structured.seoAdvanced.description')}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="seo-site-name" className="text-sm">{t('admin.siteSettings.structured.seoAdvanced.fields.siteName')}</Label>
          <Input
            id="seo-site-name"
            value={v.site_name}
            onChange={(e) => set({ site_name: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-title-default" className="text-sm">{t('admin.siteSettings.structured.seoAdvanced.fields.titleDefault')}</Label>
          <Input
            id="seo-title-default"
            value={v.title_default}
            onChange={(e) => set({ title_default: e.target.value })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-title-template" className="text-sm">{t('admin.siteSettings.structured.seoAdvanced.fields.titleTemplate')}</Label>
          <Input
            id="seo-title-template"
            value={v.title_template}
            onChange={(e) => set({ title_template: e.target.value })}
            disabled={disabled}
            placeholder={t('admin.siteSettings.structured.seoAdvanced.placeholders.titleTemplate')}
          />
          <p className="text-xs text-muted-foreground">{t('admin.siteSettings.structured.seoAdvanced.titleTemplateHelp')}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-og-type" className="text-sm">{t('admin.siteSettings.structured.seoAdvanced.fields.ogType')}</Label>
          <Select
            value={v.og_type || 'website'}
            onValueChange={(val) => set({ og_type: val })}
            disabled={disabled}
          >
            <SelectTrigger id="seo-og-type" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITE_SETTINGS_SEO_OG_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`admin.siteSettings.structured.seoAdvanced.options.ogType.${option.labelKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="seo-description" className="text-sm">{t('admin.siteSettings.structured.seoAdvanced.fields.description')}</Label>
          <Textarea
            id="seo-description"
            rows={3}
            value={v.description}
            onChange={(e) => set({ description: e.target.value })}
            disabled={disabled}
            className="text-sm"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <AdminImageUploadField
            label={t('admin.siteSettings.structured.seoAdvanced.fields.ogImage')}
            folder="seo"
            bucket="public"
            metadata={{ module_key: 'seo', locale, key: settingKey }}
            value={v.og_image}
            onChange={(url) => set({ og_image: url })}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo-twitter-card" className="text-sm">{t('admin.siteSettings.structured.seoAdvanced.fields.twitterCard')}</Label>
          <Select
            value={v.twitter_card || 'summary_large_image'}
            onValueChange={(val) => set({ twitter_card: val })}
            disabled={disabled}
          >
            <SelectTrigger id="seo-twitter-card" className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITE_SETTINGS_SEO_TWITTER_CARD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(`admin.siteSettings.structured.seoAdvanced.options.twitterCard.${option.labelKey}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 pt-6">
          <Switch
            id="seo-noindex"
            checked={v.noindex}
            onCheckedChange={(checked) => set({ noindex: checked })}
            disabled={disabled}
          />
          <Label htmlFor="seo-noindex" className="text-sm">{t('admin.siteSettings.structured.seoAdvanced.fields.noIndex')}</Label>
        </div>
      </div>
    </div>
  );
}
