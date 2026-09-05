'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TranslateFn } from '@/i18n';
import type { AdSlotAdmin, BannerAdmin } from '@/integrations/endpoints/banners-admin-endpoints';
import { useBannerConversionsAdminQuery, useBannerDistributionAdminQuery, useBannerMetricsAdminQuery, useBannerRevenueAdminQuery } from '@/integrations/hooks';
import { fmtCtr, money, positionLabel } from '../_lib/banner-meta';

function monthRange(offset: number) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
function Box({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><strong className={tone}>{value}</strong>{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>;
}

/** Bu ayin ticari durumu: gelir, tahsilat, birim maliyet, dagitim ve performans liderleri. */
export function RevenuePanel({ banners, slots, t }: { banners: BannerAdmin[]; slots: AdSlotAdmin[]; t: TranslateFn }) {
  const thisMonth = useMemo(() => monthRange(0), []);
  const lastMonth = useMemo(() => monthRange(-1), []);
  const { data: revenueData } = useBannerRevenueAdminQuery(thisMonth);
  const { data: prevData } = useBannerRevenueAdminQuery(lastMonth);
  const { data: metrics } = useBannerMetricsAdminQuery(thisMonth);
  const { data: conversions } = useBannerConversionsAdminQuery(thisMonth);
  const { data: distribution } = useBannerDistributionAdminQuery();
  const revenue = revenueData?.data;
  const prev = prevData?.data;
  const change = prev?.totals.revenue ? ((Number(revenue?.totals.revenue ?? 0) - prev.totals.revenue) / prev.totals.revenue) * 100 : null;
  const totals = (metrics?.items ?? []).reduce((s, i) => ({ impressions: s.impressions + i.impressions, unique: s.unique + i.uniqueImpressions, clicks: s.clicks + i.clicks, uniqueClicks: s.uniqueClicks + i.uniqueClicks }), { impressions: 0, unique: 0, clicks: 0, uniqueClicks: 0 });
  const conversionTotal = (conversions?.items ?? []).reduce((s, i) => s + Number(i.conversions), 0);
  const issues = (distribution?.items ?? []).filter((i) => Math.abs(i.variance) >= 0.15 || i.performanceStatus === 'low' || (i.guaranteeProgress !== null && i.guaranteeProgress < 0.8));
  const ranking = [...(revenue?.campaigns ?? [])].filter((i) => i.impressions > 0).sort((a, b) => b.clicks / b.impressions - a.clicks / a.impressions).slice(0, 5);
  const convRanking = [...(revenue?.campaigns ?? [])].filter((i) => i.conversions > 0).sort((a, b) => b.conversions - a.conversions).slice(0, 5);
  const devices = Object.entries((metrics?.items ?? []).reduce<Record<string, { impressions: number; clicks: number }>>((r, i) => { const v = r[i.device] ?? { impressions: 0, clicks: 0 }; v.impressions += i.impressions; v.clicks += i.clicks; r[i.device] = v; return r; }, {}));
  const scopes = Object.entries((metrics?.items ?? []).filter((i) => i.scopeKey.startsWith('city:') || i.scopeKey.startsWith('category:')).reduce<Record<string, number>>((r, i) => { r[i.scopeKey] = (r[i.scopeKey] ?? 0) + i.impressions; return r; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const reserved = banners.filter((b) => ['reserved', 'payment_pending', 'scheduled'].includes(b.lifecycleStatus)).reduce((s, b) => s + Number(b.totalAmount), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">{t('revenue.title')}</CardTitle><CardDescription>{t('revenue.hint', { from: thisMonth.from, to: thisMonth.to })}</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Box label={t('revenue.monthRevenue')} value={money(revenue?.totals.revenue)} hint={change === null ? t('revenue.noPrev') : t('revenue.vsPrev', { pct: `${change >= 0 ? '+' : ''}${change.toFixed(1)}` })} tone={change !== null && change < 0 ? 'text-rose-600' : undefined} />
          <Box label={t('revenue.reserved')} value={money(reserved)} />
          <Box label={t('revenue.collected')} value={money(revenue?.totals.collected)} tone="text-emerald-700" />
          <Box label={t('revenue.outstanding')} value={money(revenue?.totals.outstanding)} tone="text-amber-700" />
          <Box label={t('revenue.occupancy')} value={`%${((revenue?.totals.occupancyRate ?? 0) * 100).toFixed(1)}`} />
          <Box label="CPM" value={revenue?.totals.cpm == null ? '—' : `${revenue.totals.cpm.toFixed(2)} ₺`} />
          <Box label="CPC" value={revenue?.totals.cpc == null ? '—' : `${revenue.totals.cpc.toFixed(2)} ₺`} />
          <Box label="CPA" value={revenue?.totals.cpa == null ? '—' : `${revenue.totals.cpa.toFixed(2)} ₺`} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">{t('revenue.deliveryTitle')}</CardTitle><CardDescription>{t('revenue.deliveryHint')}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <Box label={t('revenue.impressions')} value={totals.impressions.toLocaleString('tr-TR')} />
            <Box label={t('revenue.uniqueImpressions')} value={totals.unique.toLocaleString('tr-TR')} />
            <Box label={t('revenue.clicks')} value={totals.clicks.toLocaleString('tr-TR')} />
            <Box label={t('revenue.uniqueClicks')} value={totals.uniqueClicks.toLocaleString('tr-TR')} />
            <Box label="CTR" value={fmtCtr(totals.impressions ? (totals.clicks / totals.impressions) * 100 : null)} />
            <Box label={t('revenue.conversions')} value={conversionTotal.toLocaleString('tr-TR')} />
          </div>
          {issues.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {issues.map((i) => (
                <Link key={i.id} href={`/admin/banners/${i.id}`} className="rounded-md border p-3 hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-2"><span className="truncate font-medium">{i.title}</span><Badge variant={i.performanceStatus === 'low' ? 'destructive' : 'outline'}>{t(`performance.${i.performanceStatus}`)}</Badge></div>
                  <p className="mt-1 text-xs text-muted-foreground">{t('revenue.shares', { expected: (i.expectedShare * 100).toFixed(1), actual: (i.actualShare * 100).toFixed(1) })}{i.guaranteeProgress !== null ? ` · ${t('revenue.guarantee', { pct: (i.guaranteeProgress * 100).toFixed(1) })}` : ''}</p>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">{t('revenue.noIssues')}</p>}
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">{t('revenue.leaders')}</CardTitle></CardHeader><CardContent className="space-y-2 text-xs">
          {ranking.map((i) => <Link key={i.bannerId} href={`/admin/banners/${i.bannerId}`} className="flex justify-between gap-2 hover:underline"><span className="truncate">{i.title}</span><strong>{fmtCtr((i.clicks / i.impressions) * 100)}</strong></Link>)}
          {convRanking.map((i) => <div key={`c-${i.bannerId}`} className="flex justify-between gap-2"><span className="truncate">{i.advertiser || i.title}</span><strong>{t('revenue.conversionCount', { count: i.conversions })}</strong></div>)}
          {!ranking.length && !convRanking.length ? <p className="text-muted-foreground">{t('revenue.noMeasured')}</p> : null}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('revenue.bySlot')}</CardTitle></CardHeader><CardContent className="space-y-2 text-xs">
          {(revenue?.slots ?? []).filter((s) => s.revenue > 0 || s.impressions > 0).map((s) => <div key={s.key} className="flex justify-between gap-2"><span className="truncate">{positionLabel(slots, s.key)}</span><span><strong>{money(s.revenue)}</strong> <span className="text-muted-foreground">· %{(s.occupancyRate * 100).toFixed(0)}</span></span></div>)}
          {!(revenue?.slots ?? []).length ? <p className="text-muted-foreground">{tc_noData(t)}</p> : null}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">{t('revenue.breakdown')}</CardTitle></CardHeader><CardContent className="space-y-2 text-xs">
          {devices.map(([d, v]) => <div key={d} className="flex justify-between gap-2"><span>{t(`devices.${d}`, undefined, d)}</span><span><strong>{v.impressions.toLocaleString('tr-TR')}</strong> / {v.clicks}</span></div>)}
          <div className="flex flex-wrap gap-1 pt-1">{scopes.map(([k, c]) => <Badge key={k} variant="outline" className="font-normal">{k.replace(':', ': ')} · {c}</Badge>)}</div>
          {!devices.length ? <p className="text-muted-foreground">{tc_noData(t)}</p> : null}
        </CardContent></Card>
      </div>
    </div>
  );
}
function tc_noData(t: TranslateFn) { return t('revenue.noData'); }
