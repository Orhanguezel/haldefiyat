// =============================================================
// FILE: src/app/(main)/admin/(admin)/site-settings/tabs/smtp-settings-tab.tsx
// SMTP / E-posta Ayarları Tab (GLOBAL) – style aligned
// ✅ i18n enabled
// =============================================================

import React from 'react';
import { toast } from 'sonner';
import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';

import {
  SITE_SETTINGS_SMTP_KEYS,
  type SiteSettingsSmtpForm,
  type SiteSettingsSmtpKey,
  buildSiteSettingsSmtpUpdates,
  createSiteSettingsSmtpForm,
  getSiteSettingsSmtpErrorMessage,
  mapSiteSettingsToSmtpForm,
} from '@/integrations/shared';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { SmtpTestSection } from './_components/smtp-test-section';

export type SmtpSettingsTabProps = {
  locale: string; // UI badge için dursun, GLOBAL tab
};

export const SmtpSettingsTab: React.FC<SmtpSettingsTabProps> = ({ locale }) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const {
    data: settings,
    isLoading,
    isFetching,
    refetch,
  } = useListSiteSettingsAdminQuery({
    keys: SITE_SETTINGS_SMTP_KEYS as unknown as string[],
    // GLOBAL => locale göndermiyoruz
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [form, setForm] = React.useState<SiteSettingsSmtpForm>(createSiteSettingsSmtpForm);

  React.useEffect(() => {
    setForm(mapSiteSettingsToSmtpForm(settings));
  }, [settings]);

  const loading = isLoading || isFetching;
  const busy = loading || isSaving;

  const handleChange = (field: Exclude<SiteSettingsSmtpKey, 'smtp_ssl'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleSsl = () => {
    setForm((prev) => ({ ...prev, smtp_ssl: !prev.smtp_ssl }));
  };

  const handleSave = async () => {
    try {
      for (const u of buildSiteSettingsSmtpUpdates(form)) {
        await updateSetting({ key: u.key, locale: '*', value: u.value }).unwrap();
      }

      toast.success(t('admin.siteSettings.smtp.saved'));
      await refetch();
    } catch (err: unknown) {
      toast.error(getSiteSettingsSmtpErrorMessage(err, t('admin.siteSettings.smtp.saveError')));
    }
  };

  return (
    <Card>
      <CardHeader className="gap-2 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm sm:text-base">{t('admin.siteSettings.smtp.title')}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t('admin.siteSettings.smtp.description')}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">{t('admin.siteSettings.smtp.badge', { locale: locale || '—' })}</Badge>
            <Button type="button" variant="outline" size="sm" onClick={refetch} disabled={busy}>
              {t('admin.common.refresh')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-3 pb-3 sm:space-y-6 sm:px-6 sm:pb-6">
        {busy && (
          <div>
            <Badge variant="secondary">{t('admin.common.loading')}</Badge>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-12">
          <div className="space-y-2 sm:col-span-6">
            <Label htmlFor="smtp-host" className="text-sm">
              {t('admin.siteSettings.smtp.host')}
            </Label>
            <Input
              id="smtp-host"
              value={form.smtp_host}
              onChange={(e) => handleChange('smtp_host', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.hostPlaceholder')}
              disabled={busy}
            />
          </div>

          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="smtp-port" className="text-sm">
              {t('admin.siteSettings.smtp.port')}
            </Label>
            <Input
              id="smtp-port"
              value={form.smtp_port}
              onChange={(e) => handleChange('smtp_port', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.portPlaceholder')}
              disabled={busy}
            />
          </div>

          <div className="flex items-end sm:col-span-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="smtp-ssl"
                checked={form.smtp_ssl}
                onCheckedChange={handleToggleSsl}
                disabled={busy}
              />
              <Label htmlFor="smtp-ssl" className="text-sm">
                {t('admin.siteSettings.smtp.ssl')}
              </Label>
            </div>
          </div>

          <div className="space-y-2 sm:col-span-6">
            <Label htmlFor="smtp-username" className="text-sm">
              {t('admin.siteSettings.smtp.username')}
            </Label>
            <Input
              id="smtp-username"
              value={form.smtp_username}
              onChange={(e) => handleChange('smtp_username', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.usernamePlaceholder')}
              disabled={busy}
            />
          </div>

          <div className="space-y-2 sm:col-span-6">
            <Label htmlFor="smtp-password" className="text-sm">
              {t('admin.siteSettings.smtp.password')}
            </Label>
            <Input
              id="smtp-password"
              type="password"
              value={form.smtp_password}
              onChange={(e) => handleChange('smtp_password', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.passwordPlaceholder')}
              disabled={busy}
            />
          </div>

          <div className="space-y-2 sm:col-span-6">
            <Label htmlFor="smtp-from-email" className="text-sm">
              {t('admin.siteSettings.smtp.fromEmail')}
            </Label>
            <Input
              id="smtp-from-email"
              value={form.smtp_from_email}
              onChange={(e) => handleChange('smtp_from_email', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.fromEmailPlaceholder')}
              disabled={busy}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin.siteSettings.smtp.fromEmailHelp')}
            </p>
          </div>

          <div className="space-y-2 sm:col-span-6">
            <Label htmlFor="smtp-from-name" className="text-sm">
              {t('admin.siteSettings.smtp.fromName')}
            </Label>
            <Input
              id="smtp-from-name"
              value={form.smtp_from_name}
              onChange={(e) => handleChange('smtp_from_name', e.target.value)}
              placeholder={t('admin.siteSettings.smtp.fromNamePlaceholder')}
              disabled={busy}
            />
          </div>
        </div>

        <Separator />

        <SmtpTestSection busy={busy} />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="default" disabled={busy} onClick={handleSave}>
            {isSaving ? t('admin.common.saving') : t('admin.common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
