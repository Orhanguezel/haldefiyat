'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatGa4Number, type Ga4DeepReportResp, type Ga4OverviewResp } from '@/integrations/shared';
import { Bars, MetricTable, TrendChart } from './ga4-widgets';

type T = (k: string) => string;

function Delta({ value }: { value: number }) {
  const flat = Math.abs(value) < 0.1;
  const up = value > 0;
  return <span className={flat ? 'text-muted-foreground' : up ? 'text-emerald-700' : 'text-red-700'}>{flat ? '0%' : `${up ? '▲' : '▼'} ${Math.abs(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`}</span>;
}

export function OverviewTab({ ov, report, loading, t }: { ov?: Ga4OverviewResp; report?: Ga4DeepReportResp; loading: boolean; t: T }) {
  const totals = report?.totals ?? ov?.totals;
  const cards = [
    { key: 'users', label: t('cards.users'), value: formatGa4Number(totals?.users ?? 0), delta: report?.delta.users ?? 0 },
    { key: 'sessions', label: t('cards.sessions'), value: formatGa4Number(totals?.sessions ?? 0), delta: report?.delta.sessions ?? 0 },
    { key: 'views', label: t('cards.views'), value: formatGa4Number(totals?.views ?? 0), delta: report?.delta.views ?? 0 },
    { key: 'conversions', label: t('cards.conversions'), value: formatGa4Number(totals?.conversions ?? 0), delta: report?.delta.conversions ?? 0 },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => <div key={c.key} className="rounded-md border border-border p-3">
          <div className="text-muted-foreground text-xs">{c.label}</div>
          <div className="font-semibold text-lg tabular-nums">{loading ? '...' : c.value}</div>
          <div className="mt-1 text-xs"><Delta value={c.delta} /></div>
        </div>)}
      </div>
      <Card><CardHeader><CardTitle className="text-sm">{t('charts.sessions')}</CardTitle></CardHeader><CardContent><TrendChart rows={ov?.byDate ?? []} label={t('cards.sessions')} /></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">{t('channels')}</CardTitle></CardHeader><CardContent><Bars rows={ov?.channels ?? []} t={t} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('devices')}</CardTitle></CardHeader><CardContent><Bars rows={ov?.devices ?? []} t={t} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('geo.title')}</CardTitle></CardHeader><CardContent><MetricTable rows={report?.geo.slice(0, 8) ?? []} t={t} /></CardContent></Card>
      </div>
    </div>
  );
}
