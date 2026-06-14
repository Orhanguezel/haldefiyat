// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/google-ads-report-panel.tsx
// Raporlama: mevcut dönem vs önceki dönem + CSV dışa aktarma
// =============================================================

'use client';

import * as React from 'react';
import { Download, TrendingDown, TrendingUp } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGoogleAdsReportQuery } from '@/integrations/hooks';
import {
  GOOGLE_ADS_DATE_RANGES,
  formatCpa,
  formatNumber,
  formatRoas,
  microsToUnit,
  pctDelta,
  type GoogleAdsDateRange,
  type GoogleAdsReportResp,
  type GoogleAdsTotals,
} from '@/integrations/shared';

type Props = { hasCredentials: boolean; customerId?: string };

function Delta({ cur, prev, goodWhenUp }: { cur: number; prev: number; goodWhenUp: boolean }) {
  const d = pctDelta(cur, prev);
  if (d === null) return <span className="text-muted-foreground text-xs">—</span>;
  const up = d >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${good ? 'text-green-600' : 'text-red-500'}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(d).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%
    </span>
  );
}

function metricCards(t: (k: string) => string, cur: GoogleAdsTotals, prev: GoogleAdsTotals) {
  return [
    { key: 'cost', label: t('report.cost'), val: microsToUnit(cur.cost_micros), cur: cur.cost_micros, prev: prev.cost_micros, up: false },
    { key: 'conv', label: t('report.conversions'), val: formatNumber(cur.conversions), cur: cur.conversions, prev: prev.conversions, up: true },
    { key: 'cpa', label: t('report.cpa'), val: formatCpa(cur.cost_micros, cur.conversions), cur: cur.conversions ? cur.cost_micros / cur.conversions : 0, prev: prev.conversions ? prev.cost_micros / prev.conversions : 0, up: false },
    { key: 'value', label: t('report.value'), val: formatNumber(cur.conversions_value), cur: cur.conversions_value, prev: prev.conversions_value, up: true },
    { key: 'roas', label: t('report.roas'), val: formatRoas(cur.conversions_value, cur.cost_micros), cur: cur.cost_micros ? cur.conversions_value / (cur.cost_micros / 1e6) : 0, prev: prev.cost_micros ? prev.conversions_value / (prev.cost_micros / 1e6) : 0, up: true },
    { key: 'clicks', label: t('report.clicks'), val: formatNumber(cur.clicks), cur: cur.clicks, prev: prev.clicks, up: true },
  ];
}

function exportCsv(report: GoogleAdsReportResp) {
  const head = ['Kampanya', 'Gosterim', 'Tiklama', 'Maliyet', 'Donusum', 'Deger', 'CPA', 'ROAS'];
  const rows = report.campaigns.map((c) => [
    `"${c.name.replace(/"/g, '""')}"`,
    c.impressions,
    c.clicks,
    (c.cost_micros / 1e6).toFixed(2),
    c.conversions,
    c.conversions_value.toFixed(2),
    c.conversions ? (c.cost_micros / 1e6 / c.conversions).toFixed(2) : '',
    c.cost_micros ? (c.conversions_value / (c.cost_micros / 1e6)).toFixed(2) : '',
  ]);
  const csv = [head, ...rows].map((r) => r.join(';')).join('\n');
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `google-ads-rapor-${report.range}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GoogleAdsReportPanel({ hasCredentials, customerId }: Props) {
  const t = useAdminT('admin.googleAds');
  const [range, setRange] = React.useState<GoogleAdsDateRange>('LAST_30_DAYS');
  const { data, isFetching } = useGoogleAdsReportQuery(
    { range, customer_id: customerId || undefined },
    { skip: !hasCredentials },
  );

  if (!hasCredentials) {
    return <Card><CardContent className="py-6 text-muted-foreground text-sm">{t('campaigns.needCredentials')}</CardContent></Card>;
  }

  const cards = data ? metricCards(t, data.current, data.previous) : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{t('report.title')}</CardTitle>
          {data ? (
            <p className="text-muted-foreground text-xs">
              {data.current_dates.start} → {data.current_dates.end} · {t('report.vsPrevious')} {data.previous_dates.start} → {data.previous_dates.end}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as GoogleAdsDateRange)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GOOGLE_ADS_DATE_RANGES.map((item) => (
                <SelectItem key={item} value={item}>{t(`campaigns.ranges.${item}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={!data} onClick={() => data && exportCsv(data)}>
            <Download className="mr-2 h-4 w-4" />
            {t('report.exportCsv')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFetching && !data ? (
          <p className="py-6 text-muted-foreground text-sm">{t('campaigns.loading')}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {cards.map((c) => (
                <div key={c.key} className="rounded-md border border-border p-3">
                  <div className="text-muted-foreground text-xs">{c.label}</div>
                  <div className="font-semibold text-lg">{c.val}</div>
                  <Delta cur={c.cur} prev={c.prev} goodWhenUp={c.up} />
                </div>
              ))}
            </div>
            {data && data.campaigns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-border border-b text-left text-muted-foreground text-xs">
                      <th className="py-2 pr-3">{t('campaigns.columns.name')}</th>
                      <th className="py-2 pr-3 text-right">{t('campaigns.columns.cost')}</th>
                      <th className="py-2 pr-3 text-right">{t('campaigns.columns.conversions')}</th>
                      <th className="py-2 pr-3 text-right">{t('campaigns.columns.cpa')}</th>
                      <th className="py-2 pr-3 text-right">{t('campaigns.columns.convValue')}</th>
                      <th className="py-2 text-right">{t('campaigns.columns.roas')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c) => (
                      <tr key={c.name} className="border-border/60 border-b">
                        <td className="py-2 pr-3 font-medium">{c.name}</td>
                        <td className="py-2 pr-3 text-right">{microsToUnit(c.cost_micros)}</td>
                        <td className="py-2 pr-3 text-right">{formatNumber(c.conversions)}</td>
                        <td className="py-2 pr-3 text-right">{formatCpa(c.cost_micros, c.conversions)}</td>
                        <td className="py-2 pr-3 text-right">{formatNumber(c.conversions_value)}</td>
                        <td className="py-2 text-right">{formatRoas(c.conversions_value, c.cost_micros)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
