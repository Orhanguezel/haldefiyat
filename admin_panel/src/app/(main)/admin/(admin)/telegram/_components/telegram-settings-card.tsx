// =============================================================
// FILE: src/app/(main)/admin/(admin)/telegram/_components/telegram-settings-card.tsx
// Telegram Settings Card
// =============================================================

'use client';

import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

import type { Dispatch, SetStateAction } from 'react';
import { useTelegramSendMutation } from '@/integrations/hooks';
import {
  TELEGRAM_EVENT_TOGGLES,
  TELEGRAM_TEMPLATE_DEFS,
  applyTelegramTemplate,
  buildTelegramPreviewVars,
  getErrorMessage,
  toBool,
  toDbBoolString,
  type TelegramSettingsModel,
} from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { getDefaultLocaleCode } from '@/i18n/locale-catalog';

type Props = {
  settings: TelegramSettingsModel;
  setSettings: Dispatch<SetStateAction<TelegramSettingsModel>>;
};

export default function TelegramSettingsCard({ settings, setSettings }: Props) {
  const t = useAdminT('admin.telegram');
  const [telegramSend, { isLoading: testing }] = useTelegramSendMutation();

  const previewVars = React.useMemo(
    () => buildTelegramPreviewVars(getDefaultLocaleCode()),
    [],
  );

  const telegramEnabled = toBool(settings.telegram_notifications_enabled);
  const webhookEnabled = toBool(settings.telegram_webhook_enabled);

  const targetChatId = (
    settings.telegram_chat_id ||
    settings.telegram_default_chat_id ||
    ''
  ).trim();
  const canTest =
    telegramEnabled && settings.telegram_bot_token.trim().length > 0 && targetChatId.length > 0;

  const setDbFlag = (key: keyof TelegramSettingsModel, v: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: toDbBoolString(v) }));
  };

  const setStr = (key: keyof TelegramSettingsModel, v: string) => {
    setSettings((prev) => ({ ...prev, [key]: v }));
  };

  const sendTest = async (text: string) => {
    const msg = String(text ?? '').trim();
    if (!msg) return toast.error(t('settings.testEmpty'));
    if (!canTest) return toast.error(t('settings.testRequirements'));

    try {
      const res = await telegramSend({
        title: t('settings.testTitle'),
        message: msg,
        type: 'test',
        chat_id: targetChatId,
        bot_token: settings.telegram_bot_token,
      }).unwrap();

      const ok =
        !!res && typeof res === 'object' && 'ok' in res && Boolean((res as { ok?: unknown }).ok);

      if (ok) toast.success(t('settings.testSent'));
      else toast.error(t('settings.testFailed'));
    } catch (err) {
      toast.error(`${t('settings.testFailed')}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.title')}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* --- Global toggles --- */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.enableNotifications')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.enableNotificationsDesc')}
              </p>
            </div>
            <Switch
              checked={telegramEnabled}
              onCheckedChange={(v: boolean) => setDbFlag('telegram_notifications_enabled', v)}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-base font-medium">{t('settings.enableWebhook')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('settings.enableWebhookDesc')}
              </p>
            </div>
            <Switch
              checked={webhookEnabled}
              onCheckedChange={(v: boolean) => setDbFlag('telegram_webhook_enabled', v)}
            />
          </div>
        </div>

        {/* --- Bot credentials --- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t('settings.botToken')}</Label>
            <Input
              type="password"
              value={settings.telegram_bot_token}
              onChange={(e) => setStr('telegram_bot_token', e.target.value)}
              placeholder={t('settings.botTokenPlaceholder')}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('settings.primaryChatId')}</Label>
            <Input
              value={settings.telegram_chat_id}
              onChange={(e) => setStr('telegram_chat_id', e.target.value)}
              placeholder={t('settings.chatIdPlaceholder')}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('settings.defaultChatId')}</Label>
            <Input
              value={settings.telegram_default_chat_id}
              onChange={(e) => setStr('telegram_default_chat_id', e.target.value)}
              placeholder={t('settings.chatIdPlaceholder')}
              autoComplete="off"
            />
          </div>
        </div>

        {/* --- Event toggles --- */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <Label className="text-base font-medium">{t('settings.events.title')}</Label>

          {TELEGRAM_EVENT_TOGGLES.map((ev) => (
            <div key={ev.settingsKey} className="flex items-center justify-between gap-3">
              <Label className="text-sm font-medium">{t(`settings.${ev.i18nKey}`)}</Label>
              <Switch
                checked={toBool(settings[ev.settingsKey])}
                onCheckedChange={(v: boolean) => setDbFlag(ev.settingsKey, v)}
              />
            </div>
          ))}
        </div>

        {/* --- Templates --- */}
        <div className="space-y-4">
          <Label className="text-base font-medium">{t('settings.templates.title')}</Label>

          {TELEGRAM_TEMPLATE_DEFS.map((def) => {
            const tpl = settings[def.settingsKey] ?? '';
            const preview = applyTelegramTemplate(tpl, previewVars);

            return (
              <div key={def.settingsKey} className="space-y-3 rounded-lg border border-border p-4">
                <div className="space-y-1">
                  <Label className="text-base font-medium">{t(`settings.${def.titleKey}`)}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.variables')}: {t(`settings.${def.varsKey}`)}
                  </p>
                </div>

                <Textarea
                  rows={8}
                  value={tpl}
                  onChange={(e) => setStr(def.settingsKey, e.target.value)}
                />

                <div className="space-y-2">
                  <Label>{t('settings.preview')}</Label>
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs text-muted-foreground">
                    {preview}
                  </pre>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    disabled={!canTest || testing}
                    onClick={() => void sendTest(preview)}
                  >
                    {testing ? t('settings.testSending') : t('settings.testSend')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
