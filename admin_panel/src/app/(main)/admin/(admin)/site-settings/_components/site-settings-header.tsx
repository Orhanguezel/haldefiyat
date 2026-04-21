'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/_components/site-settings-header.tsx
// FINAL — Site Settings Header (shadcn/ui)
// - NO bootstrap classes
// - Tabs + Filters (UsersListClient style)
// - Locale select disabled on global tabs
// =============================================================

import * as React from 'react';
import { Search, RefreshCcw } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SITE_SETTINGS_TABS,
  isSiteSettingsGlobalTab,
  type SiteSettingsLocaleOption,
  type SiteSettingsTab,
} from '@/integrations/shared';

export type SiteSettingsHeaderProps = {
  search: string;
  onSearchChange: (v: string) => void;

  locale: string; // "" only while loading
  onLocaleChange: (v: string) => void;

  loading: boolean;
  onRefresh: () => void;

  activeTab: SiteSettingsTab;
  onTabChange: (tab: SiteSettingsTab) => void;

  locales: SiteSettingsLocaleOption[];
  localesLoading?: boolean;
};

export const SiteSettingsHeader: React.FC<SiteSettingsHeaderProps> = ({
  search,
  onSearchChange,
  locale,
  onLocaleChange,
  loading,
  onRefresh,
  activeTab,
  onTabChange,
  locales,
  localesLoading,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const localeDisabled = loading || !!localesLoading || isSiteSettingsGlobalTab(activeTab);

  return (
    <div className="space-y-6">
      {/* Title (UsersListClient style) */}
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t('admin.siteSettings.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('admin.siteSettings.description')}
        </p>
      </div>

      {/* Tabs (no bootstrap) */}
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as SiteSettingsTab)}>
        <TabsList className="flex flex-wrap justify-start">
          {SITE_SETTINGS_TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.id === 'list' ? t('admin.siteSettings.tabs.list') : null}
              {tab.id === 'global_list' ? t('admin.siteSettings.tabs.globalList') : null}
              {tab.id === 'general' ? t('admin.siteSettings.tabs.general') : null}
              {tab.id === 'seo' ? t('admin.siteSettings.tabs.seo') : null}
              {tab.id === 'smtp' ? t('admin.siteSettings.tabs.smtp') : null}
              {tab.id === 'cloudinary' ? t('admin.siteSettings.tabs.cloudinary') : null}
              {tab.id === 'brand_media' ? t('admin.siteSettings.tabs.brandMedia') : null}
              {tab.id === 'api' ? t('admin.siteSettings.tabs.api') : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters Card (UsersListClient style) */}
      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-base">{t('admin.siteSettings.filters.title')}</CardTitle>
              <CardDescription>{t('admin.siteSettings.filters.description')}</CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {isSiteSettingsGlobalTab(activeTab) ? (
                <Badge variant="secondary">{t('admin.siteSettings.badges.global')}</Badge>
              ) : null}
              {!isSiteSettingsGlobalTab(activeTab) && locale ? (
                <Badge variant="secondary">{locale}</Badge>
              ) : null}
              {loading ? <Badge variant="outline">{t('admin.siteSettings.messages.loading')}</Badge> : null}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="site-settings-q">{t('admin.siteSettings.filters.search')}</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="site-settings-q"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t('admin.siteSettings.filters.searchPlaceholder')}
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="w-full space-y-2 lg:w-56">
              <Label>{t('admin.siteSettings.filters.language')}</Label>
              <Select
                value={locale || ''}
                onValueChange={(v) => onLocaleChange(v)}
                disabled={localeDisabled}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      localeDisabled
                        ? t('admin.siteSettings.filters.globalPlaceholder')
                        : t('admin.siteSettings.filters.selectLanguage')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(locales ?? []).map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {localeDisabled ? (
                <div className="text-xs text-muted-foreground">
                  {t('admin.siteSettings.filters.languageDisabledNote')}
                </div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onRefresh}
                disabled={loading}
                title={t('admin.siteSettings.filters.refreshButton')}
              >
                <RefreshCcw className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

SiteSettingsHeader.displayName = 'SiteSettingsHeader';
