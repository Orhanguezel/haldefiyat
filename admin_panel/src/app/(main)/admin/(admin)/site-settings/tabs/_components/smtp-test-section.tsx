'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import {
  getSiteSettingsSmtpErrorMessage,
  type SiteSettingsSmtpTestResult,
} from '@/integrations/shared';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export type SmtpTestSectionProps = {
  busy: boolean;
};

export function SmtpTestSection({ busy }: SmtpTestSectionProps) {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const [testEmail, setTestEmail] = React.useState('');
  const [testing, setTesting] = React.useState(false);
  const [result, setResult] = React.useState<SiteSettingsSmtpTestResult | null>(null);

  const handleTest = async () => {
    if (!testEmail.trim()) {
      toast.error(t('admin.siteSettings.smtp.testEmailRequired'));
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/site_settings/smtp-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ to: testEmail.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        const message = data.message || t('admin.siteSettings.smtp.testSent');
        setResult({ ok: true, message });
        toast.success(message);
      } else {
        const msg = data?.error?.message || t('admin.siteSettings.smtp.testError');
        setResult({ ok: false, message: msg });
        toast.error(msg);
      }
    } catch (err: unknown) {
      const msg = getSiteSettingsSmtpErrorMessage(err, t('admin.siteSettings.smtp.testError'));
      setResult({ ok: false, message: msg });
      toast.error(msg);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{t('admin.siteSettings.smtp.testEmail')}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder={t('admin.siteSettings.smtp.testEmailPlaceholder')}
          disabled={busy || testing}
          className="flex-1"
          type="email"
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={busy || testing || !testEmail.trim()}
        >
          {testing ? t('admin.siteSettings.smtp.sendingTest') : t('admin.siteSettings.smtp.sendTest')}
        </Button>
      </div>
      {result ? (
        <p className={`text-xs ${result.ok ? 'text-green-600' : 'text-destructive'}`}>
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
