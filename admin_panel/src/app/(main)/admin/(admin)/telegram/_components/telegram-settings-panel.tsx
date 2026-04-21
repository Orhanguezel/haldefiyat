// =============================================================
// FILE: src/app/(main)/admin/(admin)/telegram/_components/telegram-settings-panel.tsx
// Telegram Settings Panel
// =============================================================

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import TelegramSettingsCard from './telegram-settings-card';

import {
  useListSiteSettingsAdminQuery,
  useBulkUpsertSiteSettingsAdminMutation,
} from '@/integrations/hooks';

import {
  TELEGRAM_BOOLEAN_SETTINGS_KEYS,
  TELEGRAM_SETTINGS_KEYS,
  createTelegramSettingsDefaults,
  normalizeTelegramTemplateValue,
  toBool,
  toDbBoolString,
  type SiteSettingRow,
  type TelegramSettingsKey,
  type TelegramSettingsModel,
  type UpsertSettingBody,
  type ValueType,
} from '@/integrations/shared';

export default function TelegramSettingsPanel() {
  const t = useAdminT('admin.telegram');
  const { data: rows, isLoading, isFetching } = useListSiteSettingsAdminQuery(undefined);
  const [bulkUpsert, { isLoading: saving }] = useBulkUpsertSiteSettingsAdminMutation();

  const defaults = React.useMemo<TelegramSettingsModel>(() => createTelegramSettingsDefaults(t), [t]);

  const [model, setModel] = React.useState<TelegramSettingsModel>(defaults);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!rows || initialized) return;

    const m: TelegramSettingsModel = { ...defaults };

    for (const item of rows as SiteSettingRow[]) {
      const k = String(item.key ?? '') as TelegramSettingsKey;
      if (!TELEGRAM_SETTINGS_KEYS.includes(k)) continue;

      let v: unknown = item.value;

      if (k.startsWith('telegram_template_')) v = normalizeTelegramTemplateValue(v);

      if (TELEGRAM_BOOLEAN_SETTINGS_KEYS.has(k)) {
        m[k] = toDbBoolString(toBool(v));
      } else {
        m[k] = normalizeTelegramTemplateValue(v);
      }
    }

    setModel(m);
    setInitialized(true);
  }, [rows, initialized]);

  const initialLoading = !initialized && (isLoading || isFetching);

  const handleSave = async () => {
    try {
      const items: UpsertSettingBody[] = (
        Object.entries(model) as Array<[TelegramSettingsKey, string]>
      ).map(([key, value]) => ({
        key,
        value: TELEGRAM_BOOLEAN_SETTINGS_KEYS.has(key) ? toDbBoolString(toBool(value)) : value,
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
      <TelegramSettingsCard settings={model} setSettings={setModel} />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
