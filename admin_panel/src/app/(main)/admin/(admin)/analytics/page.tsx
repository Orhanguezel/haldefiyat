'use client';

import * as React from 'react';
import { Activity, BriefcaseBusiness, Mail, MousePointerClick, RefreshCcw, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetAnalyticsAdsAttributionAdminQuery,
  useGetAnalyticsFunnelAdminQuery,
  useGetAnalyticsHeatmapAdminQuery,
  useGetAnalyticsOverviewAdminQuery,
  useGetAnalyticsRetentionAdminQuery,
} from '@/integrations/hooks';
import type { AnalyticsRange } from '@/integrations/endpoints/analytics-admin-endpoints';

function fmt(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(value);
}

function pct(value: number): string {
  return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`;
}

function deviceLabel(value: string): string {
  if (value === 'mobile') return 'Mobil';
  if (value === 'tablet') return 'Tablet';
  return 'Masaüstü';
}

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

export default function AnalyticsPage() {
  const [range, setRange] = React.useState<AnalyticsRange>('7d');
  const overview = useGetAnalyticsOverviewAdminQuery({ range });
  const ads = useGetAnalyticsAdsAttributionAdminQuery({ range });
  const funnel = useGetAnalyticsFunnelAdminQuery({ range });
  const retention = useGetAnalyticsRetentionAdminQuery({ range });
  const heatmap = useGetAnalyticsHeatmapAdminQuery({ range });

  const summary = overview.data?.summary;
  const loading = overview.isLoading || ads.isLoading || funnel.isLoading || retention.isLoading || heatmap.isLoading;
  const heatmapMax = Math.max(...(heatmap.data?.items ?? []).map((item) => item.humans), 0);

  async function refresh() {
    await Promise.all([overview.refetch(), ads.refetch(), funnel.refetch(), retention.refetch(), heatmap.refetch()]);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Analytics</CardTitle>
            <CardDescription>Brand awareness, Ads attribution ve newsletter yakalama özeti.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border bg-muted/30 p-1">
              {(['7d', '30d'] as const).map((item) => (
                <Button
                  key={item}
                  size="sm"
                  variant={range === item ? 'default' : 'ghost'}
                  onClick={() => setRange(item)}
                  className="h-8"
                >
                  {item === '7d' ? '7 Gün' : '30 Gün'}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
              <RefreshCcw className="mr-1.5 h-4 w-4" />
              Yenile
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={Activity} label="İnsan Trafiği" value={fmt(summary?.humanRequests ?? 0)} sub={`${fmt(summary?.pageviews ?? 0)} pageview`} />
        <MetricCard icon={MousePointerClick} label="Ads Unique IP" value={fmt(summary?.adsUniqueIps ?? 0)} sub={`${fmt(summary?.adsPageviews ?? 0)} Ads pageview`} />
        <MetricCard icon={Mail} label="Newsletter" value={fmt(summary?.newsletterNew ?? 0)} sub={`${pct(summary?.newsletterAdsCapturePct ?? 0)} Ads/IP yakalama`} />
        <MetricCard icon={Users} label="Returning IP" value={fmt(summary?.returningIps ?? 0)} sub={`${summary?.pagesPerVisitor ?? 0} sayfa/ziyaretçi`} />
        <MetricCard icon={BriefcaseBusiness} label="B2B-like IP" value={fmt(summary?.b2bLikeIps ?? 0)} sub={`${fmt(summary?.b2bIntentIps ?? 0)} yüksek niyet IP`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Günlük Akış</CardTitle>
            <CardDescription>Request, insan trafik, Ads ve unique IP kırılımı.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="h-64 rounded-lg border p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overview.data?.daily ?? []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} width={42} />
                  <Tooltip
                    formatter={(value) => fmt(Number(value))}
                    labelClassName="font-medium"
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="humans" name="İnsan" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ads" name="Ads" stroke="#16a34a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="uniqueIps" name="Unique IP" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">Request</TableHead>
                  <TableHead className="text-right">İnsan</TableHead>
                  <TableHead className="text-right">Ads</TableHead>
                  <TableHead className="text-right">Unique IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(overview.data?.daily ?? []).map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell className="text-right">{fmt(row.requests)}</TableCell>
                    <TableCell className="text-right">{fmt(row.humans)}</TableCell>
                    <TableCell className="text-right">{fmt(row.ads)}</TableCell>
                    <TableCell className="text-right">{fmt(row.uniqueIps)}</TableCell>
                  </TableRow>
                ))}
                {!loading && (overview.data?.daily.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>Henüz veri yok.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kanal Sağlığı</CardTitle>
            <CardDescription>Direct, cihaz ve yüksek niyet sinyalleri.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Direct Trafik</span>
              <span className="font-semibold">{pct(summary?.directTrafficPct ?? 0)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">Ads → Newsletter</div>
                <div className="mt-1 text-lg font-semibold">{pct(summary?.newsletterAdsCapturePct ?? 0)}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-muted-foreground">B2B-like IP</div>
                <div className="mt-1 text-lg font-semibold">{fmt(summary?.b2bLikeIps ?? 0)}</div>
              </div>
            </div>
            <div className="space-y-2">
              {(overview.data?.devices ?? []).map((row) => (
                <div key={row.device} className="flex items-center justify-between text-sm">
                  <span>{deviceLabel(row.device)}</span>
                  <Badge variant="outline">{fmt(row.count)}</Badge>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {(overview.data?.intentSignals ?? []).map((row) => (
                <div key={row.path} className="flex items-center justify-between text-sm">
                  <span>{row.path}</span>
                  <Badge>{fmt(row.uniqueIps)} IP</Badge>
                </div>
              ))}
              {!loading && (overview.data?.intentSignals.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">Yüksek niyet sinyali yok.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ListCard title="Landing Page" rows={overview.data?.topLandingPages ?? []} />
        <ListCard title="Referrer" rows={overview.data?.topReferrers ?? []} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ads Attribution</CardTitle>
            <CardDescription>gclid taşıyan trafik.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kampanya</TableHead>
                  <TableHead className="text-right">PV</TableHead>
                  <TableHead className="text-right">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ads.data?.items ?? []).map((row) => (
                  <TableRow key={`${row.campaign}-${row.source}-${row.medium}`}>
                    <TableCell className="max-w-[180px] truncate">
                      {row.campaign}
                      <div className="text-muted-foreground text-xs">{row.source} / {row.medium}</div>
                    </TableCell>
                    <TableCell className="text-right">{fmt(row.pageviews)}</TableCell>
                    <TableCell className="text-right">{fmt(row.uniqueIps)}</TableCell>
                  </TableRow>
                ))}
                {!loading && (ads.data?.items.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={3}>Ads verisi yok.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Funnel</CardTitle>
          <CardDescription>Landing, uyarı sayfası ve newsletter yakalama.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {(funnel.data?.items ?? []).map((row) => (
            <div key={row.name} className="rounded-lg border p-4">
              <div className="text-muted-foreground text-xs uppercase">{row.name}</div>
              <div className="mt-2 text-2xl font-semibold">{fmt(row.count)}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cohort Retention</CardTitle>
          <CardDescription>İlk kez gelen IP'lerin sonraki günlerde tekrar görünme oranı.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İlk Gün</TableHead>
                <TableHead className="text-right">Yeni IP</TableHead>
                <TableHead className="text-right">D+1</TableHead>
                <TableHead className="text-right">D+3</TableHead>
                <TableHead className="text-right">D+7</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(retention.data?.cohorts ?? []).map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="text-right">{fmt(row.visitors)}</TableCell>
                  <TableCell className="text-right">{fmt(row.d1)} <span className="text-muted-foreground">({pct(row.d1Pct)})</span></TableCell>
                  <TableCell className="text-right">{fmt(row.d3)} <span className="text-muted-foreground">({pct(row.d3Pct)})</span></TableCell>
                  <TableCell className="text-right">{fmt(row.d7)} <span className="text-muted-foreground">({pct(row.d7Pct)})</span></TableCell>
                </TableRow>
              ))}
              {!loading && (retention.data?.cohorts.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Retention verisi yok.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Saatlik Trafik Heatmap</CardTitle>
          <CardDescription>İnsan pageview yoğunluğu; koyu hücreler yoğun saatleri gösterir.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[820px] space-y-2">
            <div className="grid grid-cols-[44px_repeat(24,minmax(24px,1fr))] gap-1 text-[11px] text-muted-foreground">
              <div />
              {HOURS.map((hour) => (
                <div key={hour} className="text-center">{hour}</div>
              ))}
            </div>
            {WEEKDAYS.map((day, weekday) => (
              <div key={day} className="grid grid-cols-[44px_repeat(24,minmax(24px,1fr))] gap-1">
                <div className="flex items-center text-xs text-muted-foreground">{day}</div>
                {HOURS.map((hour) => {
                  const value = heatmap.data?.items.find((item) => item.weekday === weekday && item.hour === hour)?.humans ?? 0;
                  const alpha = heatmapMax > 0 ? Math.max(0.08, value / heatmapMax) : 0;
                  return (
                    <div
                      key={`${weekday}-${hour}`}
                      title={`${day} ${hour}:00 · ${fmt(value)} insan pageview`}
                      className="h-7 rounded-sm border border-border/60 text-center text-[10px] leading-7"
                      style={{ backgroundColor: alpha ? `hsl(var(--primary) / ${alpha})` : 'transparent' }}
                    >
                      {value > 0 ? value : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-muted-foreground text-xs">{label}</div>
          <div className="text-xl font-semibold">{value}</div>
          <div className="truncate text-muted-foreground text-xs">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ListCard({ title, rows }: { title: string; rows: Array<{ name: string; count: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead className="text-right">Adet</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="max-w-[220px] truncate">{row.name}</TableCell>
                <TableCell className="text-right">{fmt(row.count)}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={2}>Veri yok.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
