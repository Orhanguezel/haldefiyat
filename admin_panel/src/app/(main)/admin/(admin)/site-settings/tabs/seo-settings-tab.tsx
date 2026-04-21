// =============================================================
// FILE: seo-settings-tab.tsx
// SEO Ayarları — Sayfa önizlemeli inline düzenleme
// =============================================================

'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import {
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';
import {
  SITE_SETTINGS_INLINE_SEO_DEFAULT_EXPANDED_KEYS,
  SITE_SETTINGS_INLINE_SEO_PAGES,
  SITE_SETTINGS_INLINE_SEO_PREVIEW_HOST,
  SITE_SETTINGS_INLINE_SEO_PREVIEW_HOST_WWW,
  type SiteSettingsInlineSeoPage,
  type SiteSettingsInlineSeoPageKey,
  type SiteSettingsInlineSeoPages,
  buildSiteSettingsInlineSeoPreviewPath,
  createEmptySiteSettingsInlineSeoPage,
  extractSiteSettingsInlineSeoPages,
  getErrorMessage,
} from '@/integrations/shared';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/admin-image-upload-field';

/* ── component ── */

export type SeoSettingsTabProps = {
  locale: string;
  settingPrefix?: string;
};

export const SeoSettingsTab: React.FC<SeoSettingsTabProps> = ({ locale, settingPrefix }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const fullKey = `${settingPrefix || ''}seo_pages`;

  const { data, isLoading, isFetching, refetch } = useGetSiteSettingAdminByKeyQuery(
    { key: fullKey, locale },
    { refetchOnMountOrArgChange: true },
  );

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const busy = isLoading || isFetching || isSaving;

  const serverPages = useMemo(() => extractSiteSettingsInlineSeoPages(data), [data]);
  const [localPages, setLocalPages] = useState<SiteSettingsInlineSeoPages | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<SiteSettingsInlineSeoPageKey>>(
    new Set(SITE_SETTINGS_INLINE_SEO_DEFAULT_EXPANDED_KEYS),
  );

  // Sync server → local when data arrives
  React.useEffect(() => {
    if (data) setLocalPages(extractSiteSettingsInlineSeoPages(data));
  }, [data]);

  const pages = localPages ?? serverPages;

  const toggleExpand = (key: SiteSettingsInlineSeoPageKey) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandAll = () =>
    setExpandedKeys(new Set<SiteSettingsInlineSeoPageKey>(SITE_SETTINGS_INLINE_SEO_PAGES.map((item) => item.key)));
  const collapseAll = () => setExpandedKeys(new Set());

  const updatePage = (key: SiteSettingsInlineSeoPageKey, patch: Partial<SiteSettingsInlineSeoPage>) => {
    setLocalPages((prev) => {
      const base = prev ?? serverPages;
      return { ...base, [key]: { ...base[key], ...patch } };
    });
  };

  const handleSave = async () => {
    if (!localPages) return;
    try {
      await updateSetting({ key: fullKey, locale, value: localPages as any }).unwrap();
      toast.success(t('admin.siteSettings.seo.inline.saved'));
      await refetch();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err) || t('admin.siteSettings.seo.inline.saveError'));
    }
  };

  const isDirty = localPages && JSON.stringify(localPages) !== JSON.stringify(serverPages);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{t('admin.siteSettings.seo.inline.title')}</CardTitle>
            <CardDescription>
              {t('admin.siteSettings.seo.inline.description')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{locale}</Badge>
            {isDirty && <Badge variant="default">{t('admin.siteSettings.seo.inline.dirty')}</Badge>}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={busy || !isDirty}
            >
              <Save className="mr-2 h-3.5 w-3.5" />
              {t('admin.siteSettings.seo.inline.save')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {busy && !localPages && <Badge variant="outline">{t('admin.siteSettings.seo.inline.loading')}</Badge>}

        <div className="flex gap-2 pb-2">
          <Button type="button" variant="ghost" size="sm" onClick={expandAll}>
            <ChevronDown className="mr-1 h-3.5 w-3.5" /> {t('admin.siteSettings.seo.inline.expandAll')}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={collapseAll}>
            <ChevronUp className="mr-1 h-3.5 w-3.5" /> {t('admin.siteSettings.seo.inline.collapseAll')}
          </Button>
        </div>

        {SITE_SETTINGS_INLINE_SEO_PAGES.map((cfg) => {
          const page = pages[cfg.key] || createEmptySiteSettingsInlineSeoPage();
          const isExpanded = expandedKeys.has(cfg.key);
          const pageLabel = t(`admin.siteSettings.seo.pageLabels.${cfg.key}`);
          const previewPath = buildSiteSettingsInlineSeoPreviewPath(locale, cfg.path);

          return (
            <div key={cfg.key} className="rounded-md border">
              {/* Header — always visible */}
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50"
                onClick={() => toggleExpand(cfg.key)}
              >
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{pageLabel}</span>
                      <span className="text-xs text-muted-foreground">{cfg.path}</span>
                      {page.no_index && (
                        <Badge variant="destructive" className="px-1 py-0 text-[10px]">
                          {t('admin.siteSettings.seo.inline.noindexBadge')}
                        </Badge>
                      )}
                    </div>
                    {/* Preview — collapsed state */}
                    {!isExpanded && page.title && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-lg">
                        {page.title}
                      </p>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {/* Expanded form + preview */}
              {isExpanded && (
                <div className="border-t px-4 pb-4 pt-3">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* Left: Form */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('admin.siteSettings.seo.inline.fieldTitle')}</Label>
                        <Input
                          value={page.title}
                          onChange={(e) => updatePage(cfg.key, { title: e.target.value })}
                          disabled={busy}
                          className="h-8"
                          placeholder={t('admin.siteSettings.seo.inline.placeholderTitle')}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">{t('admin.siteSettings.seo.inline.fieldDescription')}</Label>
                        <Textarea
                          value={page.description}
                          onChange={(e) => updatePage(cfg.key, { description: e.target.value })}
                          disabled={busy}
                          rows={3}
                          className="text-sm"
                          placeholder={t('admin.siteSettings.seo.inline.placeholderDescription')}
                        />
                        <p className="text-[10px] text-muted-foreground">
                          {t('admin.siteSettings.seo.inline.charCount', { count: page.description.length })}
                        </p>
                      </div>

                      <AdminImageUploadField
                        label={t('admin.siteSettings.seo.inline.ogImage')}
                        folder={`seo/${cfg.key}`}
                        bucket="public"
                        metadata={{ module_key: 'seo', page: cfg.key, locale }}
                        value={page.og_image}
                        onChange={(url) => updatePage(cfg.key, { og_image: url })}
                        disabled={busy}
                      />

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={page.no_index}
                          onCheckedChange={(v) => updatePage(cfg.key, { no_index: v })}
                          disabled={busy}
                        />
                        <Label className="text-xs">{t('admin.siteSettings.seo.inline.noindex')}</Label>
                      </div>
                    </div>

                    {/* Right: Google Preview */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">{t('admin.siteSettings.seo.inline.googlePreview')}</Label>
                      <div className="rounded-md border bg-background p-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground truncate">
                            {SITE_SETTINGS_INLINE_SEO_PREVIEW_HOST_WWW} › {previewPath}
                          </p>
                          <p className="text-sm font-medium text-[#1a0dab] truncate">
                            {page.title || t('admin.siteSettings.seo.inline.siteName')}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {page.description || t('admin.siteSettings.seo.inline.noDescription')}
                          </p>
                        </div>
                      </div>

                      <Label className="text-xs text-muted-foreground">{t('admin.siteSettings.seo.inline.socialPreview')}</Label>
                      <div className="overflow-hidden rounded-md border bg-background">
                        <div className="aspect-video bg-muted flex items-center justify-center">
                          {page.og_image ? (
                            <img
                              src={page.og_image}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">{t('admin.siteSettings.seo.inline.noOgImage')}</span>
                          )}
                        </div>
                        <div className="p-3 space-y-0.5">
                          <p className="text-[10px] text-muted-foreground uppercase">
                            {SITE_SETTINGS_INLINE_SEO_PREVIEW_HOST}
                          </p>
                          <p className="text-sm font-medium truncate">
                            {page.title || t('admin.siteSettings.seo.inline.siteName')}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {page.description || t('admin.siteSettings.seo.inline.noDescription')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom save */}
        {isDirty && (
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={handleSave} disabled={busy}>
              <Save className="mr-2 h-3.5 w-3.5" />
              {t('admin.siteSettings.seo.inline.saveAll')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
