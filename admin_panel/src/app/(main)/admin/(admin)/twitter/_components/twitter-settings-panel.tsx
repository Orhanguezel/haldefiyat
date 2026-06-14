// =============================================================
// FILE: src/app/(main)/admin/(admin)/twitter/_components/twitter-settings-panel.tsx
// Twitter/X Settings Panel (site_settings bulk upsert)
// =============================================================

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import {
  useListSiteSettingsAdminQuery,
  useBulkUpsertSiteSettingsAdminMutation,
} from '@/integrations/hooks';
import {
  TWITTER_BOOLEAN_SETTINGS_KEYS,
  TWITTER_CREDENTIAL_FIELDS,
  TWITTER_SETTINGS_KEYS,
  createTwitterSettingsDefaults,
  toBool,
  toDbBoolString,
  type SiteSettingRow,
  type TwitterSettingsKey,
  type TwitterSettingsModel,
  type UpsertSettingBody,
  type ValueType,
} from '@/integrations/shared';

export default function TwitterSettingsPanel() {
  const t = useAdminT('admin.twitter');
  const { data: rows, isLoading, isFetching } = useListSiteSettingsAdminQuery(undefined);
  const [bulkUpsert, { isLoading: saving }] = useBulkUpsertSiteSettingsAdminMutation();

  const [model, setModel] = React.useState<TwitterSettingsModel>(createTwitterSettingsDefaults);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!rows || initialized) return;

    const m = createTwitterSettingsDefaults();

    for (const item of rows as SiteSettingRow[]) {
      const k = String(item.key ?? '') as TwitterSettingsKey;
      if (!TWITTER_SETTINGS_KEYS.includes(k)) continue;

      if (TWITTER_BOOLEAN_SETTINGS_KEYS.has(k)) {
        m[k] = toDbBoolString(toBool(item.value));
      } else {
        m[k] = String(item.value ?? '').trim();
      }
    }

    setModel(m);
    setInitialized(true);
  }, [rows, initialized]);

  const initialLoading = !initialized && (isLoading || isFetching);

  const setStr = (key: TwitterSettingsKey, v: string) => {
    setModel((prev) => ({ ...prev, [key]: v }));
  };

  const handleSave = async () => {
    try {
      const items: UpsertSettingBody[] = (
        Object.entries(model) as Array<[TwitterSettingsKey, string]>
      ).map(([key, value]) => ({
        key,
        value: TWITTER_BOOLEAN_SETTINGS_KEYS.has(key) ? toDbBoolString(toBool(value)) : value,
        value_type: 'string' as ValueType,
        group: null,
        description: null,
      }));

      await bulkUpsert({ items }).unwrap();
      toast.success(t('settings.saved'));
    } catch (e) {
      console.error(e);
      toast.error((e as { message?: string })?.message || t('settings.saveError'));
    }
  };

  if (initialLoading) {
    return <div className="py-8 text-sm text-muted-foreground">{t('settings.loading')}</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.title')}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Label className="text-base font-medium">{t('settings.enable')}</Label>
                <p className="text-xs text-muted-foreground">{t('settings.enableDesc')}</p>
              </div>
              <Switch
                checked={toBool(model.twitter_enabled)}
                onCheckedChange={(v: boolean) => setStr('twitter_enabled', toDbBoolString(v))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.credentials.title')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.credentials.desc')}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {TWITTER_CREDENTIAL_FIELDS.map((field) => (
                <div key={field.settingsKey} className="space-y-2">
                  <Label>{t(`settings.credentials.${field.i18nKey}`)}</Label>
                  <Input
                    type="password"
                    value={model[field.settingsKey]}
                    onChange={(e) => setStr(field.settingsKey, e.target.value)}
                    placeholder={t('settings.credentials.placeholder')}
                    autoComplete="new-password"
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
