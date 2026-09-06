'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, Printer, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TranslateFn } from '@/i18n';
import type { AdSlotAdmin, BannerConversionItem, BannerMetricItem, BannerRevenueReport } from '@/integrations/endpoints/banners-admin-endpoints';
import { useBannerConversionsAdminQuery, useBannerMetricsAdminQuery, useBannerRevenueAdminQuery } from '@/integrations/hooks';
import { fmtCtr, money, positionLabel } from '../_lib/banner-meta';
import { isValidReportRange, previousComparableRange, reportPeriodLabel, reportPresetRange, type ReportPreset, type ReportRange } from '../_lib/report-range';

type CampaignRow = {
  bannerId: number;
  title: string;
  advertiser: string | null;
  position: string | null;
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  revenue: number;
  collected: number;
  outstanding: number;
};

const number = new Intl.NumberFormat('tr-TR');

function percentDelta(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function Delta({ current, previous, inverse = false, t }: { current: number; previous: number; inverse?: boolean; t: TranslateFn }) {
  const delta = percentDelta(current, previous);
  if (delta === null) return <span className="text-xs text-muted-foreground">{t('reports.noComparison')}</span>;
  const up = delta >= 0;
  const positive = inverse ? !up : up;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${positive ? 'text-emerald-700' : 'text-rose-600'}`}>
      <Icon className="size-3" />%{Math.abs(delta).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} {t('reports.vsPrevious')}
    </span>
  );
}

function Metric({ label, value, delta }: { label: string; value: string; delta?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {delta ? <div className="mt-1">{delta}</div> : null}
    </div>
  );
}

function aggregateRows(metrics: BannerMetricItem[], conversions: BannerConversionItem[], revenue?: BannerRevenueReport): CampaignRow[] {
  const rows = new Map<number, CampaignRow>();
  for (const campaign of revenue?.campaigns ?? []) {
    rows.set(campaign.bannerId, {
      bannerId: campaign.bannerId,
      title: campaign.title,
      advertiser: campaign.advertiser,
      position: campaign.position,
      impressions: 0,
      uniqueImpressions: 0,
      clicks: 0,
      uniqueClicks: 0,
      conversions: campaign.conversions,
      revenue: campaign.revenue,
      collected: campaign.collected,
      outstanding: campaign.outstanding,
    });
  }
  for (const metric of metrics) {
    const row = rows.get(metric.bannerId) ?? {
      bannerId: metric.bannerId,
      title: metric.title,
      advertiser: metric.advertiser,
      position: metric.position,
      impressions: 0,
      uniqueImpressions: 0,
      clicks: 0,
      uniqueClicks: 0,
      conversions: 0,
      revenue: 0,
      collected: 0,
      outstanding: 0,
    };
    row.impressions += metric.impressions;
    row.clicks += metric.clicks;
    row.uniqueImpressions += metric.uniqueImpressions;
    row.uniqueClicks += metric.uniqueClicks;
    rows.set(metric.bannerId, row);
  }
  const conversionsByBanner = conversions.reduce<Map<number, number>>((result, item) => {
    result.set(item.bannerId, (result.get(item.bannerId) ?? 0) + Number(item.conversions));
    return result;
  }, new Map());
  for (const [bannerId, conversionCount] of conversionsByBanner) {
    const row = rows.get(bannerId);
    if (row) row.conversions = conversionCount;
  }
  return [...rows.values()].sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.title.localeCompare(b.title, 'tr'));
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function downloadCsv(range: ReportRange, rows: CampaignRow[]) {
  const records: unknown[][] = [
    ['HaldeFiyat Reklam Performans Raporu'],
    ['Dönem', reportPeriodLabel(range)],
    [],
    ['Kampanya', 'Reklam veren', 'Slot', 'Gösterim', 'Tekil gösterim', 'Tıklama', 'Tekil tıklama', 'CTR', 'Dönüşüm', 'Kampanya bedeli', 'Tahsilat', 'Kalan'],
    ...rows.map((row) => [
      row.title,
      row.advertiser ?? '',
      row.position ?? '',
      row.impressions,
      row.uniqueImpressions,
      row.clicks,
      row.uniqueClicks,
      row.impressions ? `${((row.clicks / row.impressions) * 100).toFixed(2)}%` : '0.00%',
      row.conversions,
      row.revenue.toFixed(2),
      row.collected.toFixed(2),
      row.outstanding.toFixed(2),
    ]),
  ];
  const csv = `\uFEFF${records.map((record) => record.map(csvCell).join(';')).join('\n')}`;
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `reklam-raporu-${range.from}-${range.to}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function printReport(range: ReportRange) {
  const previousTitle = document.title;
  document.title = `HaldeFiyat Reklam Raporu ${range.from} ${range.to}`;
  document.body.classList.add('banner-report-printing');
  window.print();
  document.body.classList.remove('banner-report-printing');
  document.title = previousTitle;
}

export function ReportsPanel({ slots, t }: { slots: AdSlotAdmin[]; t: TranslateFn }) {
  const [preset, setPreset] = useState<ReportPreset>('current_month');
  const [range, setRange] = useState<ReportRange>({ from: '', to: '' });
  const [generatedAt, setGeneratedAt] = useState('');
  useEffect(() => {
    setRange(reportPresetRange('current_month'));
    setGeneratedAt(new Date().toLocaleString('tr-TR'));
  }, []);
  const valid = isValidReportRange(range);
  const previousRange = useMemo(() => previousComparableRange(range), [range]);
  const queryOptions = { skip: !valid };
  const currentRevenue = useBannerRevenueAdminQuery(range, queryOptions);
  const previousRevenue = useBannerRevenueAdminQuery(previousRange, queryOptions);
  const metrics = useBannerMetricsAdminQuery(range, queryOptions);
  const conversions = useBannerConversionsAdminQuery(range, queryOptions);
  const loading = currentRevenue.isFetching || previousRevenue.isFetching || metrics.isFetching || conversions.isFetching;
  const failed = currentRevenue.isError || previousRevenue.isError || metrics.isError || conversions.isError;
  const report = currentRevenue.data?.data;
  const previous = previousRevenue.data?.data;
  const rows = useMemo(() => aggregateRows(metrics.data?.items ?? [], conversions.data?.items ?? [], report), [metrics.data, conversions.data, report]);
  const uniqueImpressions = (metrics.data?.items ?? []).reduce((sum, item) => sum + item.uniqueImpressions, 0);
  const uniqueClicks = (metrics.data?.items ?? []).reduce((sum, item) => sum + item.uniqueClicks, 0);
  const devices = useMemo(() => Object.entries((metrics.data?.items ?? []).reduce<Record<string, { impressions: number; clicks: number }>>((result, item) => {
    const current = result[item.device] ?? { impressions: 0, clicks: 0 };
    current.impressions += item.impressions;
    current.clicks += item.clicks;
    result[item.device] = current;
    return result;
  }, {})).sort((a, b) => b[1].impressions - a[1].impressions), [metrics.data]);
  const leader = rows.find((row) => row.impressions > 0);

  const onPresetChange = (value: ReportPreset) => {
    setPreset(value);
    if (value !== 'custom') {
      setRange(reportPresetRange(value));
      setGeneratedAt(new Date().toLocaleString('tr-TR'));
    }
  };
  const setCustomDate = (field: keyof ReportRange, value: string) => {
    setPreset('custom');
    setRange((current) => ({ ...current, [field]: value }));
    setGeneratedAt(new Date().toLocaleString('tr-TR'));
  };

  return (
    <div className="space-y-4">
      <Card className="banner-report-no-print">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('reports.controlsTitle')}</CardTitle>
          <CardDescription>{t('reports.controlsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs text-muted-foreground">
            {t('reports.period')}
            <Select value={preset} onValueChange={(value) => onPresetChange(value as ReportPreset)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">{t('reports.presets.currentMonth')}</SelectItem>
                <SelectItem value="previous_month">{t('reports.presets.previousMonth')}</SelectItem>
                <SelectItem value="last_30_days">{t('reports.presets.last30Days')}</SelectItem>
                <SelectItem value="custom">{t('reports.presets.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            {t('reports.from')}
            <Input type="date" className="w-40" value={range.from} onChange={(event) => setCustomDate('from', event.target.value)} />
          </label>
          <label className="grid gap-1 text-xs text-muted-foreground">
            {t('reports.to')}
            <Input type="date" className="w-40" value={range.to} onChange={(event) => setCustomDate('to', event.target.value)} />
          </label>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" disabled={!valid || loading || failed || !report} onClick={() => downloadCsv(range, rows)}><Download className="size-4" />{t('reports.csv')}</Button>
            <Button disabled={!valid || loading || failed || !report} onClick={() => printReport(range)}><Printer className="size-4" />{t('reports.print')}</Button>
          </div>
        </CardContent>
      </Card>

      {!valid ? (
        <div className="banner-report-no-print flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertCircle className="size-4" />{t('reports.invalidRange')}</div>
      ) : null}
      {failed ? (
        <div role="alert" className="banner-report-no-print flex items-center gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900"><AlertCircle className="size-4" />{t('reports.loadFailed')}</div>
      ) : null}

      <section className="banner-report-print-root rounded-xl border bg-background p-5 shadow-sm sm:p-7" aria-busy={loading}>
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-sm font-bold tracking-[0.16em] text-emerald-800">HALDEFİYAT.COM</p>
            <h2 className="mt-1 text-2xl font-semibold">{t('reports.title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{valid ? reportPeriodLabel(range) : '—'}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p>{t('reports.generatedAt')}</p>
            <p className="font-medium text-foreground">{generatedAt || '—'}</p>
          </div>
        </header>

        {loading && !report ? <p className="py-12 text-center text-sm text-muted-foreground">{t('reports.loading')}</p> : null}
        {!loading && report ? (
          <div className="space-y-7 pt-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              <Metric label={t('reports.metrics.campaigns')} value={number.format(rows.length)} />
              <Metric label={t('reports.metrics.impressions')} value={number.format(report.totals.impressions)} delta={<Delta current={report.totals.impressions} previous={previous?.totals.impressions ?? 0} t={t} />} />
              <Metric label={t('reports.metrics.uniqueImpressions')} value={number.format(uniqueImpressions)} />
              <Metric label={t('reports.metrics.clicks')} value={number.format(report.totals.clicks)} delta={<Delta current={report.totals.clicks} previous={previous?.totals.clicks ?? 0} t={t} />} />
              <Metric label="CTR" value={fmtCtr(report.totals.impressions ? (report.totals.clicks / report.totals.impressions) * 100 : null)} />
              <Metric label={t('reports.metrics.conversions')} value={number.format(report.totals.conversions)} delta={<Delta current={report.totals.conversions} previous={previous?.totals.conversions ?? 0} t={t} />} />
              <Metric label={t('reports.metrics.contractValue')} value={money(report.totals.revenue)} delta={<Delta current={report.totals.revenue} previous={previous?.totals.revenue ?? 0} t={t} />} />
              <Metric label={t('reports.metrics.collected')} value={money(report.totals.collected)} />
            </div>

            <div className="rounded-lg bg-muted/60 p-4 text-sm">
              <h3 className="font-semibold">{t('reports.summaryTitle')}</h3>
              <p className="mt-1 text-muted-foreground">
                {t('reports.summary', {
                  campaigns: rows.length,
                  impressions: number.format(report.totals.impressions),
                  clicks: number.format(report.totals.clicks),
                  ctr: fmtCtr(report.totals.impressions ? (report.totals.clicks / report.totals.impressions) * 100 : null),
                })}
                {leader ? ` ${t('reports.leader', { title: leader.title, impressions: number.format(leader.impressions) })}` : ''}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{t('reports.contractNote')}</p>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-semibold">{t('reports.campaignBreakdown')}</h3>
                <Badge variant="outline">{t('reports.rowCount', { count: rows.length })}</Badge>
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[920px] text-sm">
                  <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5">{t('reports.columns.campaign')}</th>
                      <th className="px-3 py-2.5">{t('reports.columns.slot')}</th>
                      <th className="px-3 py-2.5 text-right">{t('reports.metrics.impressions')}</th>
                      <th className="px-3 py-2.5 text-right">{t('reports.metrics.uniqueImpressions')}</th>
                      <th className="px-3 py-2.5 text-right">{t('reports.metrics.clicks')}</th>
                      <th className="px-3 py-2.5 text-right">CTR</th>
                      <th className="px-3 py-2.5 text-right">{t('reports.metrics.conversions')}</th>
                      <th className="px-3 py-2.5 text-right">{t('reports.metrics.contractValue')}</th>
                      <th className="px-3 py-2.5 text-right">{t('reports.metrics.collected')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.bannerId} className="border-t align-top">
                        <td className="max-w-72 px-3 py-2.5"><p className="font-medium">{row.title}</p><p className="text-xs text-muted-foreground">{row.advertiser ?? t('reports.noAdvertiser')}</p></td>
                        <td className="px-3 py-2.5 text-xs">{row.position ? positionLabel(slots, row.position) : '—'}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{number.format(row.impressions)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{number.format(row.uniqueImpressions)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{number.format(row.clicks)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{fmtCtr(row.impressions ? (row.clicks / row.impressions) * 100 : null)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{number.format(row.conversions)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{money(row.revenue)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{money(row.collected)}</td>
                      </tr>
                    ))}
                    {!rows.length ? <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">{t('reports.empty')}</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold">{t('reports.deviceBreakdown')}</h3>
                <div className="rounded-lg border">
                  {devices.map(([device, values]) => (
                    <div key={device} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-3 py-2.5 text-sm last:border-b-0">
                      <span>{t(`devices.${device}`, undefined, device)}</span>
                      <span className="tabular-nums text-muted-foreground">{number.format(values.impressions)} {t('reports.shortImpressions')}</span>
                      <span className="tabular-nums">{fmtCtr(values.impressions ? (values.clicks / values.impressions) * 100 : null)}</span>
                    </div>
                  ))}
                  {!devices.length ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t('reports.empty')}</p> : null}
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-semibold">{t('reports.slotBreakdown')}</h3>
                <div className="rounded-lg border">
                  {[...(report.slots ?? [])].sort((a, b) => b.impressions - a.impressions).map((slot) => (
                    <div key={slot.key} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b px-3 py-2.5 text-sm last:border-b-0">
                      <span className="truncate">{positionLabel(slots, slot.key)}</span>
                      <span className="tabular-nums text-muted-foreground">{number.format(slot.impressions)} {t('reports.shortImpressions')}</span>
                      <span className="tabular-nums">{money(slot.revenue)}</span>
                    </div>
                  ))}
                  {!report.slots.length ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t('reports.empty')}</p> : null}
                </div>
              </div>
            </div>

            <footer className="border-t pt-4 text-xs text-muted-foreground">
              <p>{t('reports.footer')}</p>
              <p className="mt-1">{t('reports.previousPeriod', { from: previousRange.from, to: previousRange.to })}</p>
              {uniqueClicks >= 0 ? <p className="mt-1">{t('reports.uniqueClickNote', { count: number.format(uniqueClicks) })}</p> : null}
            </footer>
          </div>
        ) : null}
      </section>
    </div>
  );
}
