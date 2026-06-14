'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGa4ConfigQuery } from '@/integrations/hooks';

type T = (k: string) => string;

export function SettingsTab({ t }: { t: T }) {
  const { data } = useGa4ConfigQuery();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-sm">{t('settings.streams')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.dataStreams ?? []).map((s) => <div key={s.id} className="rounded-md border border-border p-3">
            <div className="font-medium">{s.displayName || s.name}</div>
            <div className="mt-1 flex flex-wrap gap-2"><Badge variant="outline">{s.measurementId || '-'}</Badge><Badge variant="secondary">{s.type}</Badge>{s.enhancedMeasurement ? <Badge>{t('settings.enhanced')}</Badge> : null}</div>
          </div>)}
          {(data?.dataStreams ?? []).length === 0 ? <p className="text-muted-foreground">{t('empty')}</p> : null}
        </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">{t('settings.adsLinks')}</CardTitle><CardDescription>{t('settings.adsHelp')}</CardDescription></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.googleAdsLinks ?? []).map((l) => <div key={l.id} className="flex items-center justify-between rounded-md border border-border p-3">
            <span className="font-medium">{l.customerId}</span><Badge variant={l.adsPersonalizationEnabled ? 'default' : 'secondary'}>{l.adsPersonalizationEnabled ? t('settings.linked') : t('settings.partial')}</Badge>
          </div>)}
          {(data?.googleAdsLinks ?? []).length === 0 ? <p className="text-muted-foreground">{t('settings.adsMissing')}</p> : null}
        </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">{t('settings.customDimensions')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.customDimensions ?? []).map((d) => <div key={d.id} className="rounded-md border border-border p-3"><div className="font-medium">{d.displayName || d.parameterName}</div><div className="text-muted-foreground">{d.scope} · {d.parameterName}</div></div>)}
          {(data?.customDimensions ?? []).length === 0 ? <p className="text-muted-foreground">{t('empty')}</p> : null}
        </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">{t('settings.audiences')}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(data?.audiences ?? []).map((a) => <div key={a.id} className="rounded-md border border-border p-3"><div className="font-medium">{a.displayName}</div><div className="text-muted-foreground">{a.description || '-'}</div></div>)}
          {(data?.audiences ?? []).length === 0 ? <p className="text-muted-foreground">{t('empty')}</p> : null}
        </CardContent></Card>
    </div>
  );
}
