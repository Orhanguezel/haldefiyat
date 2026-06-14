'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGa4RealtimeQuery } from '@/integrations/hooks';
import { formatGa4Number } from '@/integrations/shared';
import { MetricTable } from './ga4-widgets';

type T = (k: string) => string;

export function RealtimeTab({ t }: { t: T }) {
  const { data } = useGa4RealtimeQuery(undefined, { pollingInterval: 30000 });
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Activity className="h-4 w-4" />{t('realtime.activeUsers')}</div>
        <div className="mt-2 font-semibold text-3xl tabular-nums">{formatGa4Number(data?.activeUsers ?? 0)}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-sm">{t('realtime.screens')}</CardTitle></CardHeader><CardContent><MetricTable rows={data?.screens ?? []} t={t} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('realtime.countries')}</CardTitle></CardHeader><CardContent><MetricTable rows={data?.countries ?? []} t={t} /></CardContent></Card>
      </div>
    </div>
  );
}
