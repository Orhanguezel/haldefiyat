'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import {
  getSiteSettingsApiErrorMessage,
  type SiteSettingsApiTestResult,
} from '@/integrations/shared';
import { Button } from '@/components/ui/button';

export type ApiTestButtonProps = {
  endpoint: string;
  label: string;
};

export function ApiTestButton({ endpoint, label }: ApiTestButtonProps) {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);

  const [testing, setTesting] = React.useState(false);
  const [result, setResult] = React.useState<SiteSettingsApiTestResult | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}',
      });
      const data = await res.json();
      const ok = data.ok === true;
      const message =
        data.message ||
        (ok ? t('admin.siteSettings.api.inline.testSuccess') : t('admin.siteSettings.api.inline.testError'));

      setResult({ ok, message });

      if (ok) toast.success(`${label}: ${message}`);
      else toast.error(`${label}: ${message}`);
    } catch (err: unknown) {
      const message = getSiteSettingsApiErrorMessage(err, t('admin.siteSettings.api.inline.connectionError'));
      setResult({ ok: false, message });
      toast.error(`${label}: ${t('admin.siteSettings.api.inline.connectionError')}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {result ? (
        <span className={`text-[10px] ${result.ok ? 'text-green-600' : 'text-destructive'}`}>
          {result.ok ? t('admin.siteSettings.api.inline.okShort') : t('admin.siteSettings.api.inline.errorShort')}{' '}
          {result.message.slice(0, 50)}
        </span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-6 px-2 text-[10px]"
        onClick={handleTest}
        disabled={testing}
      >
        {testing ? t('admin.siteSettings.api.inline.testBusy') : t('admin.siteSettings.api.inline.test')}
      </Button>
    </div>
  );
}
