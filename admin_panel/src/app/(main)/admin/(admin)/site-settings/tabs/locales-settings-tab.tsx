'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw } from 'lucide-react';
import {
  useListSiteSettingsAdminQuery,
  useUpdateSiteSettingAdminMutation,
} from '@/integrations/hooks';
import {
  buildSiteSettingsLocalePayload,
  getErrorMessage,
  normalizeSiteSettingsLocaleRows,
  type SiteSettingsLocaleRow,
} from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

export function LocalesSettingsTab({ settingPrefix }: { settingPrefix?: string }) {
  const t = useAdminT('admin.siteSettings.locales');
  const appLocalesKey = `${settingPrefix || ''}app_locales`;

  const localesQ = useListSiteSettingsAdminQuery({
    locale: '*',
    keys: [appLocalesKey],
    limit: 20,
    offset: 0,
    sort: 'key',
    order: 'asc',
  });

  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();
  const [rows, setRows] = React.useState<SiteSettingsLocaleRow[]>([]);
  const [touched, setTouched] = React.useState(false);

  React.useEffect(() => {
    if (touched) return;
    const row = (localesQ.data ?? []).find((r) => r.key === appLocalesKey);
    setRows(normalizeSiteSettingsLocaleRows(row?.value));
  }, [localesQ.data, appLocalesKey, touched]);

  const busy = isSaving || localesQ.isFetching || localesQ.isLoading;

  const persist = async (nextRows: SiteSettingsLocaleRow[]) => {
    const payload = buildSiteSettingsLocalePayload(nextRows);
    try {
      await updateSetting({ key: appLocalesKey, locale: '*', value: payload }).unwrap();
      toast.success(t('saved'));
    } catch (err) {
      toast.error(getErrorMessage(err, t('saveError')));
      throw err;
    }
  };

  const onToggleActive = async (code: string, val: boolean) => {
    const prev = rows;
    setTouched(true);
    const next = rows.map((r) => (r.code === code ? { ...r, is_active: val } : r));
    setRows(next);
    try { await persist(next); } catch { setRows(prev); setTouched(false); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <div className="flex items-center gap-2">
            {busy && <Badge variant="outline">{t('loading')}</Badge>}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={busy}
              onClick={() => localesQ.refetch()}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('emptyRows')}</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div
                key={r.code}
                className="flex items-center justify-between rounded-md border px-4 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 text-center font-mono text-sm font-medium uppercase">{r.code}</span>
                  <span className="text-sm">{r.label}</span>
                </div>
                <Switch
                  checked={r.is_active}
                  onCheckedChange={(v) => onToggleActive(r.code, Boolean(v))}
                  disabled={busy}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
