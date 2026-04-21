'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/tabs/brand-media-tab.tsx
// Logo / Favicon / Apple-Touch / OG — her biri ayri site_settings key
// Degerler {"url","alt"} JSON. locale="*" global.
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { Copy, ExternalLink, RefreshCcw, Save } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useBulkUpsertSiteSettingsAdminMutation,
  useListSiteSettingsAdminQuery,
} from '@/integrations/hooks';
import {
  SITE_SETTINGS_BRAND_MEDIA_ITEMS,
  SITE_SETTINGS_BRAND_MEDIA_KEYS,
  type SiteSettingsBrandMediaKey,
  type SiteSettingsBrandMediaMap,
  createEmptySiteSettingsBrandMediaMap,
  getSiteSettingsBrandMediaErrorMessage,
  mapSiteSettingsListToBrandMediaMap,
} from '@/integrations/shared';

import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/admin-image-upload-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type BrandMediaTabProps = {
  locale: string;
};

export const BrandMediaTab: React.FC<BrandMediaTabProps> = () => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const listQ = useListSiteSettingsAdminQuery(
    {
      locale: '*',
      keys: [...SITE_SETTINGS_BRAND_MEDIA_KEYS],
      limit: SITE_SETTINGS_BRAND_MEDIA_KEYS.length,
      offset: 0,
      sort: 'key',
      order: 'asc',
    },
    { refetchOnMountOrArgChange: true },
  );

  const [bulkUpsert, { isLoading: isSaving }] = useBulkUpsertSiteSettingsAdminMutation();

  const serverMap = React.useMemo<SiteSettingsBrandMediaMap>(
    () => mapSiteSettingsListToBrandMediaMap(listQ.data),
    [listQ.data],
  );

  const [localMap, setLocalMap] = React.useState<SiteSettingsBrandMediaMap | null>(null);

  React.useEffect(() => {
    if (!listQ.isLoading && !listQ.isFetching) {
      setLocalMap(serverMap);
    }
  }, [serverMap, listQ.isLoading, listQ.isFetching]);

  const current = localMap ?? createEmptySiteSettingsBrandMediaMap();
  const loading = listQ.isLoading || listQ.isFetching;
  const busy = loading || isSaving;

  const updateField = (
    key: SiteSettingsBrandMediaKey,
    field: 'url' | 'alt',
    value: string,
  ) => {
    setLocalMap((prev) => {
      const base = prev ?? serverMap;
      return { ...base, [key]: { ...base[key], [field]: value } };
    });
  };

  const isDirty = React.useMemo(() => {
    if (!localMap) return false;
    return JSON.stringify(localMap) !== JSON.stringify(serverMap);
  }, [localMap, serverMap]);

  const handleSave = async () => {
    if (!localMap || !isDirty) return;
    try {
      const items = SITE_SETTINGS_BRAND_MEDIA_KEYS
        .filter((key) => {
          const next = localMap[key];
          const prev = serverMap[key];
          return next.url !== prev.url || next.alt !== prev.alt;
        })
        .map((key) => ({ key, value: localMap[key] }));

      if (!items.length) return;
      await bulkUpsert({ items }).unwrap();
      toast.success(t('admin.siteSettings.brandMedia.inline.saved'));
      await listQ.refetch();
    } catch (err) {
      toast.error(
        getSiteSettingsBrandMediaErrorMessage(
          err,
          t('admin.siteSettings.brandMedia.inline.saveError'),
        ),
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">
              {t('admin.siteSettings.brandMedia.title')}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {t('admin.siteSettings.brandMedia.description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {t('admin.siteSettings.brandMedia.badge')}
            </Badge>
            {busy && (
              <Badge variant="outline">
                {t('admin.siteSettings.brandMedia.inline.loading')}
              </Badge>
            )}
            {isDirty && (
              <Badge variant="default">
                {t('admin.siteSettings.brandMedia.inline.dirty')}
              </Badge>
            )}
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={busy || !isDirty}
            >
              <Save className="mr-2 h-3.5 w-3.5" />
              {t('admin.siteSettings.brandMedia.inline.save')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => listQ.refetch()}
              disabled={busy}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {SITE_SETTINGS_BRAND_MEDIA_ITEMS.map((item) => {
            const value = current[item.key];
            const label = t(`admin.siteSettings.brandMedia.labels.${item.labelKey}`);

            return (
              <div key={item.key} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{label}</span>
                    <code className="text-[10px] text-muted-foreground">{item.key}</code>
                  </div>
                  {value.url && (
                    <button
                      type="button"
                      className="text-[10px] text-destructive hover:underline"
                      onClick={() => updateField(item.key, 'url', '')}
                      disabled={busy}
                    >
                      {t('admin.siteSettings.brandMedia.inline.remove')}
                    </button>
                  )}
                </div>

                {value.url ? (
                  <div className="relative aspect-square w-full max-w-40 mx-auto overflow-hidden rounded border bg-muted/20">
                    <img
                      src={value.url}
                      alt={value.alt || label}
                      className="h-full w-full object-contain p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square w-full max-w-40 mx-auto items-center justify-center rounded border bg-muted/20">
                    <span className="text-[10px] text-muted-foreground">
                      {t('admin.siteSettings.brandMedia.inline.noImage')}
                    </span>
                  </div>
                )}

                <AdminImageUploadField
                  label=""
                  bucket="public"
                  folder={item.folder}
                  metadata={{ field: item.key, scope: 'brand-media' }}
                  value={value.url}
                  onChange={(url) => updateField(item.key, 'url', url)}
                  disabled={busy}
                  openLibraryHref="/admin/storage"
                  previewAspect="1x1"
                  previewObjectFit="contain"
                />

                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">
                    {t('admin.siteSettings.brandMedia.altLabel')}
                  </Label>
                  <Input
                    value={value.alt}
                    onChange={(e) => updateField(item.key, 'alt', e.target.value)}
                    disabled={busy}
                    placeholder={label}
                    className="h-8 text-xs"
                  />
                </div>

                {value.url && (
                  <div className="flex items-center gap-1">
                    <input
                      readOnly
                      value={value.url}
                      className="flex-1 truncate rounded border bg-muted/30 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded p-0.5 hover:bg-muted"
                      title={t('admin.siteSettings.brandMedia.inline.copy')}
                      onClick={() => {
                        navigator.clipboard.writeText(value.url);
                        toast.success(t('admin.siteSettings.brandMedia.inline.urlCopied'));
                      }}
                    >
                      <Copy className="size-3 text-muted-foreground" />
                    </button>
                    <a
                      href={value.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded p-0.5 hover:bg-muted"
                      title={t('admin.siteSettings.brandMedia.inline.openNewTab')}
                    >
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isDirty && (
          <div className="flex justify-end pt-4">
            <Button type="button" onClick={handleSave} disabled={busy}>
              <Save className="mr-2 h-3.5 w-3.5" />
              {t('admin.siteSettings.brandMedia.inline.save')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

BrandMediaTab.displayName = 'BrandMediaTab';
