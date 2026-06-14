'use client';

import * as React from 'react';
import { Copy, Link2, Power, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGoogleConnectCredentialsMutation, useGoogleConnectDisconnectMutation, useGoogleConnectExchangeMutation, useGoogleConnectRedirectQuery, useGoogleConnectStatusQuery, useLazyGoogleConnectAuthUrlQuery } from '@/integrations/hooks';
import { GOOGLE_SERVICE_LABELS, adsLabel, getErrorMessage, type GoogleServiceKey } from '@/integrations/shared';

const SERVICES: GoogleServiceKey[] = ['ads', 'ga4', 'gtm', 'gsc'];

export default function GoogleConnectPage() {
  const t = useAdminT('admin.googleConnect');
  const { data: status, refetch } = useGoogleConnectStatusQuery();
  const { data: redirect } = useGoogleConnectRedirectQuery();
  const [fetchAuthUrl, { isFetching: opening }] = useLazyGoogleConnectAuthUrlQuery();
  const [exchange, { isLoading: saving }] = useGoogleConnectExchangeMutation();
  const [disconnect, disconnectState] = useGoogleConnectDisconnectMutation();
  const [saveCredentials, credentialState] = useGoogleConnectCredentialsMutation();
  const [code, setCode] = React.useState('');
  const [manualRedirect, setManualRedirect] = React.useState('');
  const [clientSecret, setClientSecret] = React.useState('');
  const [developerToken, setDeveloperToken] = React.useState('');

  const openAuth = async (redirect_uri?: string) => {
    try {
      const res = await fetchAuthUrl(redirect_uri ? { redirect_uri } : undefined).unwrap();
      setManualRedirect(res.redirect_uri);
      window.open(res.url, '_blank', 'noopener');
    } catch (err) {
      toast.error(`${t('failed')}: ${getErrorMessage(err)}`);
    }
  };

  const copyRedirect = async () => {
    try {
      await navigator.clipboard.writeText(redirect?.callback_uri ?? '');
      toast.success(t('copied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const handleSave = async () => {
    if (!code.trim()) return;
    try {
      await exchange({ code: code.trim(), redirect_uri: manualRedirect || redirect?.playground_uri }).unwrap();
      toast.success(t('saved'));
      setCode('');
      void refetch();
    } catch (err) {
      toast.error(`${t('failed')}: ${getErrorMessage(err)}`);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(t('disconnectConfirm'))) return;
    try {
      await disconnect().unwrap();
      toast.success(t('disconnectedNow'));
      void refetch();
    } catch (err) {
      toast.error(`${t('failed')}: ${getErrorMessage(err)}`);
    }
  };

  const handleCredentialSave = async () => {
    try {
      await saveCredentials({
        ...(clientSecret.trim() ? { client_secret: clientSecret.trim() } : {}),
        ...(developerToken.trim() ? { developer_token: developerToken.trim() } : {}),
      }).unwrap();
      toast.success(t('credentialsSaved'));
      setClientSecret('');
      setDeveloperToken('');
    } catch (err) {
      toast.error(`${t('failed')}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div><CardTitle className="text-base">{t('title')}</CardTitle><CardDescription>{t('description')}</CardDescription></div>
            <Badge variant={status?.connected ? 'default' : 'destructive'}>{status?.connected ? t('connected') : t('disconnected')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border p-3 text-sm">
            <div className="font-medium">{t('redirectTitle')}</div>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{redirect?.callback_uri ?? '-'}</code>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={copyRedirect}><Copy className="h-4 w-4" /></Button>
            </div>
            <p className="mt-2 text-muted-foreground text-xs">{t('redirectNote')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => openAuth()} disabled={opening}><ShieldCheck className="mr-2 h-4 w-4" />{opening ? t('opening') : t('reconnect')}</Button>
            <Button size="sm" variant="outline" onClick={() => openAuth(redirect?.playground_uri)} disabled={opening}>{t('playground')}</Button>
            <Button size="sm" variant="destructive" onClick={handleDisconnect} disabled={disconnectState.isLoading || !status?.connected}><Power className="mr-2 h-4 w-4" />{t('disconnect')}</Button>
          </div>
          <p className="text-muted-foreground text-xs">{t('note')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('services')}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {SERVICES.map((svc) => {
            const health = status?.health?.[svc];
            return (
              <div key={svc} className="rounded-md border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2"><span className="font-medium">{adsLabel(GOOGLE_SERVICE_LABELS, svc)}</span><Badge variant={health?.ok ? 'default' : 'destructive'}>{health?.ok ? t('ok') : t('error')}</Badge></div>
                <div className="mt-2 text-muted-foreground text-xs">{t('lastCheck')}: {health?.checked_at ? new Date(health.checked_at).toLocaleString('tr-TR') : '-'}</div>
                {health?.error ? <div className="mt-1 line-clamp-2 text-red-600 text-xs">{health.error}</div> : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('health')}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border border-border p-3"><div className="text-muted-foreground text-xs">{t('connectedAt')}</div><div className="text-sm">{status?.connected_at ? new Date(status.connected_at).toLocaleString('tr-TR') : '-'}</div></div>
          <div className="rounded-md border border-border p-3"><div className="text-muted-foreground text-xs">{t('expiresIn')}</div><div className="text-sm">{status?.expires_in ? `${status.expires_in} sn` : '-'}</div></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('manualTitle')}</CardTitle><CardDescription>{t('manualDescription')}</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('codePlaceholder')} className="h-9 text-sm" />
            <Button size="sm" onClick={handleSave} disabled={saving || !code.trim()}><Link2 className="mr-2 h-4 w-4" />{saving ? t('saving') : t('save')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">{t('credentialsTitle')}</CardTitle><CardDescription>{t('credentialsDescription')}</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2">
            <Input value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder={t('clientSecret')} type="password" />
            <Input value={developerToken} onChange={(e) => setDeveloperToken(e.target.value)} placeholder={t('developerToken')} type="password" />
          </div>
          <Button size="sm" onClick={handleCredentialSave} disabled={credentialState.isLoading || (!clientSecret.trim() && !developerToken.trim())}>{t('credentialsSave')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
