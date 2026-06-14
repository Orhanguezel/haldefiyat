'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatGa4Duration, formatGa4Number, formatGa4Percent, type Ga4DeepReportResp } from '@/integrations/shared';
import { MetricBarChart, MetricTable } from './ga4-widgets';

type T = (k: string) => string;

export function AcquisitionTab({ report, t }: { report?: Ga4DeepReportResp; t: T }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-sm">{t('acq.sources')}</CardTitle></CardHeader><CardContent><MetricBarChart rows={report?.acquisition.sources ?? []} /></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">{t('acq.sourceMediums')}</CardTitle></CardHeader><CardContent><MetricTable rows={report?.acquisition.sourceMediums ?? []} t={t} /></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">{t('acq.channels')}</CardTitle></CardHeader><CardContent><MetricTable rows={report?.acquisition.channels ?? []} t={t} /></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm">{t('acq.newReturning')}</CardTitle></CardHeader><CardContent><MetricTable rows={report?.acquisition.newReturning ?? []} t={t} /></CardContent></Card>
    </div>
  );
}

export function EngagementTab({ report, t }: { report?: Ga4DeepReportResp; t: T }) {
  const engagement = report?.engagement;
  const cards = [
    { label: t('engagement.rate'), value: formatGa4Percent(engagement?.engagementRate ?? 0) },
    { label: t('engagement.avgDuration'), value: formatGa4Duration(engagement?.averageSessionDuration ?? 0) },
    { label: t('engagement.bounce'), value: formatGa4Percent(engagement?.bounceRate ?? 0) },
    { label: t('engagement.engagedSessions'), value: formatGa4Number(engagement?.engagedSessions ?? 0) },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => <div key={card.label} className="rounded-md border border-border p-3">
          <div className="text-muted-foreground text-xs">{card.label}</div><div className="font-semibold text-lg tabular-nums">{card.value}</div>
        </div>)}
      </div>
      <Card><CardHeader><CardTitle className="text-sm">{t('engagement.userDuration')}</CardTitle></CardHeader>
        <CardContent className="text-2xl font-semibold tabular-nums">{formatGa4Duration(engagement?.userEngagementDuration ?? 0)}</CardContent></Card>
    </div>
  );
}

export function EventsTab({ report, t, onMakeKey }: { report?: Ga4DeepReportResp; t: T; onMakeKey: (name: string) => void }) {
  return <Card><CardHeader><CardTitle className="text-sm">{t('events.title')}</CardTitle></CardHeader><CardContent><MetricTable rows={report?.events ?? []} t={t} action={onMakeKey} /></CardContent></Card>;
}

export function EcommerceTab({ report, t }: { report?: Ga4DeepReportResp; t: T }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-md border border-border p-3"><div className="text-muted-foreground text-xs">{t('ecommerce.revenue')}</div><div className="font-semibold text-lg tabular-nums">{formatGa4Number(report?.ecommerce.totals.revenue ?? 0)}</div></div>
        <div className="rounded-md border border-border p-3"><div className="text-muted-foreground text-xs">{t('ecommerce.transactions')}</div><div className="font-semibold text-lg tabular-nums">{formatGa4Number(report?.ecommerce.totals.transactions ?? 0)}</div></div>
      </div>
      <Card><CardHeader><CardTitle className="text-sm">{t('ecommerce.items')}</CardTitle></CardHeader><CardContent><MetricTable rows={report?.ecommerce.items ?? []} t={t} /></CardContent></Card>
    </div>
  );
}
