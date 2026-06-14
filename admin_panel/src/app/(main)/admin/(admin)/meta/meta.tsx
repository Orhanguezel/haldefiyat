// =============================================================
// FILE: src/app/(main)/admin/(admin)/meta/meta.tsx
// Meta Pixel + Conversions API — ayarlar + durum + test
// =============================================================

'use client';

import * as React from 'react';
import { Save, Send } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useMetaSaveMutation, useMetaStatusQuery, useMetaTestMutation } from '@/integrations/hooks';
import { getErrorMessage } from '@/integrations/shared';

export default function MetaPage() {
  const t = useAdminT('admin.meta');
  const { data: status } = useMetaStatusQuery();
  const [save, { isLoading: saving }] = useMetaSaveMutation();
  const [test, { isLoading: testing }] = useMetaTestMutation();

  const [enabled, setEnabled] = React.useState(false);
  const [pixelId, setPixelId] = React.useState('');
  const [token, setToken] = React.useState('');
  const [testCode, setTestCode] = React.useState('');

  React.useEffect(() => {
    if (status) {
      setEnabled(status.enabled);
      setPixelId(status.pixel_id);
    }
  }, [status]);

  const handleSave = async () => {
    try {
      await save({
        meta_enabled: enabled,
        meta_pixel_id: pixelId.trim(),
        ...(token.trim() ? { meta_capi_token: token.trim() } : {}),
        meta_test_event_code: testCode.trim(),
      }).unwrap();
      toast.success(t('saved'));
      setToken('');
    } catch (err) {
      toast.error(`${t('saveFailed')}: ${getErrorMessage(err)}`);
    }
  };

  const handleTest = async () => {
    try {
      const res = await test().unwrap();
      if (res.skipped) toast.info(t('testSkipped'));
      else if (res.ok) toast.success(t('testOk').replace('{n}', String(res.events_received ?? 0)));
      else toast.error(`${t('testFailed')}: ${res.error ?? ''}`);
    } catch (err) {
      toast.error(`${t('testFailed')}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant={status?.enabled ? 'default' : 'secondary'}>{t('enabled')}: {status?.enabled ? '✓' : '×'}</Badge>
            <Badge variant={status?.pixel_configured ? 'default' : 'secondary'}>{t('pixelConfigured')}: {status?.pixel_configured ? '✓' : '×'}</Badge>
            <Badge variant={status?.capi_configured ? 'default' : 'destructive'}>{t('capiConfigured')}: {status?.capi_configured ? '✓' : '×'}</Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('settings')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between gap-2 text-sm">
            <span>{t('enabled')}</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </label>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">{t('pixelId')}</label>
            <Input value={pixelId} onChange={(e) => setPixelId(e.target.value)} placeholder="123456789012345" className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">{t('capiToken')}</label>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="EAAB..." className="h-9 text-sm" />
            <p className="text-muted-foreground text-xs">{t('capiTokenHint')}</p>
          </div>
          <div className="space-y-1">
            <label className="text-muted-foreground text-xs">{t('testCode')}</label>
            <Input value={testCode} onChange={(e) => setTestCode(e.target.value)} placeholder="TEST12345" className="h-9 w-48 text-sm" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />{saving ? t('saving') : t('save')}
            </Button>
            <Button size="sm" variant="outline" onClick={handleTest} disabled={testing || !status?.capi_configured}>
              <Send className="mr-2 h-4 w-4" />{testing ? t('testing') : t('test')}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">{t('note')}</p>
          <p className="text-muted-foreground text-xs">{t('help')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
