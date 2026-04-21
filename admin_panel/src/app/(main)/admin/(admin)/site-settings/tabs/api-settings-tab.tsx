'use client';

// =============================================================
// API & 3. Taraf Servisler Tab
// Google OAuth, Cloudinary, reCAPTCHA, AI Modelleri, Analytics
// =============================================================

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Save } from 'lucide-react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';

import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import {
  SITE_SETTINGS_API_KEYS,
  SITE_SETTINGS_API_SECTIONS,
  type SiteSettingsApiForm,
  buildSiteSettingsApiUpdates,
  createSiteSettingsApiForm,
  getSiteSettingsApiErrorMessage,
  mapSiteSettingsToApiForm,
} from '@/integrations/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiTestButton } from './_components/api-test-button';

/* ── component ── */

export type ApiSettingsTabProps = { locale: string };

export const ApiSettingsTab: React.FC<ApiSettingsTabProps> = () => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const { data: settings, isLoading, isFetching, refetch } = useListSiteSettingsAdminQuery({
    keys: SITE_SETTINGS_API_KEYS as unknown as string[],
    locale: '*',
  } as any);

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [form, setForm] = React.useState<SiteSettingsApiForm>(createSiteSettingsApiForm);

  React.useEffect(() => {
    setForm(mapSiteSettingsToApiForm(settings));
  }, [settings]);

  const busy = isLoading || isFetching || isSaving;

  const handleSave = async () => {
    try {
      for (const update of buildSiteSettingsApiUpdates(form)) {
        await updateSetting({ key: update.key, value: update.value, locale: '*' }).unwrap();
      }
      toast.success(t('admin.siteSettings.api.inline.saved'));
      await refetch();
    } catch (err: unknown) {
      toast.error(getSiteSettingsApiErrorMessage(err, t('admin.siteSettings.api.inline.saveError')));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">{t('admin.siteSettings.api.inline.title')}</CardTitle>
          <div className="flex items-center gap-2">
            {busy && <Badge variant="outline">{t('admin.siteSettings.api.inline.loading')}</Badge>}
            <Button type="button" size="sm" onClick={handleSave} disabled={busy}>
              <Save className="mr-2 h-3.5 w-3.5" />
              {t('admin.siteSettings.api.inline.save')}
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()} disabled={busy}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Provider sırası — AI bölümünden önce */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('admin.siteSettings.api.inline.providerOrderLabel')}</Label>
          <Input
            value={form.ai_provider_order}
            onChange={(e) => setForm((p) => ({ ...p, ai_provider_order: e.target.value }))}
            disabled={busy}
            className="h-8"
            placeholder={t('admin.siteSettings.api.inline.placeholders.providerOrder')}
          />
          <p className="text-[10px] text-muted-foreground">
            {t('admin.siteSettings.api.inline.providerOrderHelp')}
          </p>
        </div>

        {SITE_SETTINGS_API_SECTIONS.map((section) => {
          const sectionTitle = t(`admin.siteSettings.api.inline.sections.${section.titleKey}`);
          return (
            <div key={section.titleKey} className="space-y-3">
              <div className="flex items-center justify-between border-b pb-1">
                <h3 className="text-sm font-medium">{sectionTitle}</h3>
                {section.testEndpoint && (
                  <ApiTestButton endpoint={section.testEndpoint} label={sectionTitle} />
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t(`admin.siteSettings.api.inline.fields.${f.labelKey}`)}</Label>
                    <Input
                      type={f.type || 'text'}
                      value={form[f.key]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      disabled={busy}
                      className="h-8"
                      placeholder={
                        f.placeholderKey
                          ? t(`admin.siteSettings.api.inline.placeholders.${f.placeholderKey}`)
                          : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
