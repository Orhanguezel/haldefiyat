'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BreakdownChart, SeriesChart } from './gsc-tables';
import { formatGscCtr, formatGscNumber, formatGscPosition, type GscAnalyticsResp } from '@/integrations/shared';

type T = (k: string) => string;

function Delta({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const up = inverse ? value < 0 : value > 0;
  const flat = Math.abs(value) < 0.1;
  return (
    <span className={flat ? 'text-muted-foreground' : up ? 'text-emerald-700' : 'text-red-700'}>
      {flat ? '0%' : `${up ? '▲' : '▼'} ${Math.abs(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`}
    </span>
  );
}

export function OverviewTab({ data, loading, t }: { data?: GscAnalyticsResp; loading: boolean; t: T }) {
  const totals = data?.totals;
  const cards = [
    { key: 'clicks', label: t('cards.clicks'), value: formatGscNumber(totals?.clicks ?? 0), delta: data?.delta.clicks ?? 0 },
    { key: 'impressions', label: t('cards.impressions'), value: formatGscNumber(totals?.impressions ?? 0), delta: data?.delta.impressions ?? 0 },
    { key: 'ctr', label: t('cards.ctr'), value: formatGscCtr(totals?.ctr ?? 0), delta: data?.delta.ctr ?? 0 },
    { key: 'position', label: t('cards.position'), value: formatGscPosition(totals?.position ?? 0), delta: data?.delta.position ?? 0, inverse: true },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.key} className="rounded-md border border-border p-3">
            <div className="text-muted-foreground text-xs">{card.label}</div>
            <div className="font-semibold text-lg tabular-nums">{loading ? '...' : card.value}</div>
            <div className="mt-1 text-xs"><Delta value={card.delta} inverse={card.inverse} /></div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm">{t('charts.series')}</CardTitle>
          <Badge variant="outline">{t('charts.clicksImpressions')}</Badge>
        </CardHeader>
        <CardContent><SeriesChart data={data?.series ?? []} /></CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('charts.devices')}</CardTitle></CardHeader>
          <CardContent><BreakdownChart data={data?.devices ?? []} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">{t('charts.countries')}</CardTitle></CardHeader>
          <CardContent><BreakdownChart data={data?.countries ?? []} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
