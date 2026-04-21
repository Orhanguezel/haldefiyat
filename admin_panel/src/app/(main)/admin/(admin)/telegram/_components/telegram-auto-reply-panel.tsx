// =============================================================
// FILE: src/app/(main)/admin/(admin)/telegram/_components/telegram-auto-reply-panel.tsx
// AutoReply config (i18n, theme tokens)
// =============================================================

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

import {
  useGetTelegramAutoReplyQuery,
  useUpdateTelegramAutoReplyMutation,
} from '@/integrations/hooks';

import { getErrorMessage, toBool, toStr } from '@/integrations/shared';
import type { TelegramAutoReplyMode, TelegramAutoReplyUpdateBody } from '@/integrations/shared';

export default function TelegramAutoReplyPanel() {
  const t = useAdminT('admin.telegram');
  const { data, isLoading, isFetching } = useGetTelegramAutoReplyQuery();
  const [update, { isLoading: saving }] = useUpdateTelegramAutoReplyMutation();
  const defaultTemplate = t('autoreply.defaultTemplate');

  const [enabled, setEnabled] = React.useState(false);
  const [mode, setMode] = React.useState<TelegramAutoReplyMode>('simple');
  const [template, setTemplate] = React.useState(defaultTemplate);

  React.useEffect(() => {
    if (!data) return;

    setEnabled(toBool((data as Record<string, unknown>).enabled));

    const rawMode = toStr((data as unknown as Record<string, unknown>).mode).trim();
    const m: TelegramAutoReplyMode = rawMode === 'ai' ? 'ai' : 'simple';
    setMode(m);

    const tpl = toStr((data as unknown as Record<string, unknown>).template).trim();
    setTemplate(tpl || defaultTemplate);
  }, [data, defaultTemplate]);

  const handleSave = async () => {
    const tpl = template.trim();
    if (!tpl) {
      toast.error(t('autoreply.emptyError'));
      return;
    }

    const body: TelegramAutoReplyUpdateBody = {
      enabled,
      mode: 'simple',
      template: tpl,
    };

    try {
      await update(body).unwrap();
      toast.success(t('autoreply.saved'));
    } catch (e) {
      console.error(e);
      toast.error(getErrorMessage(e, t('autoreply.saveError')));
    }
  };

  if (isLoading || isFetching) {
    return <div className="py-8 text-sm text-muted-foreground">{t('autoreply.loading')}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('autoreply.title')}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
          <div className="space-y-1">
            <Label className="text-base font-medium">{t('autoreply.enable')}</Label>
            <p className="text-xs text-muted-foreground">
              {t('autoreply.enableDesc')}
            </p>
          </div>

          <Switch checked={enabled} onCheckedChange={(v: boolean) => setEnabled(v)} />
        </div>

        <div className="space-y-2">
          <Label>{t('autoreply.templateLabel')}</Label>
          <Textarea rows={6} value={template} onChange={(e) => setTemplate(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            {t('autoreply.modeInfo', { mode })}
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? t('autoreply.saving') : t('autoreply.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
