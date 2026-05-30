"use client";

import * as React from "react";

import { BarChart3, MousePointerClick, RefreshCcw, Smartphone, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalyticsRange } from "@/integrations/endpoints/analytics-admin-endpoints";
import {
  useGetAnalyticsAdsAttributionAdminQuery,
  useGetAnalyticsAdsDailyAdminQuery,
  useGetAnalyticsDeviceDailyAdminQuery,
  useGetAnalyticsFunnelAdminQuery,
  useGetAnalyticsHeatmapAdminQuery,
  useGetAnalyticsOverviewAdminQuery,
  useGetAnalyticsRetentionAdminQuery,
} from "@/integrations/hooks";

type TabKey = "overview" | "retention" | "ads" | "device";

const numberFormat = new Intl.NumberFormat("tr-TR");

function fmtNumber(value: number | null | undefined): string {
  return numberFormat.format(value ?? 0);
}

function fmtPct(value: number | null | undefined): string {
  return `${(value ?? 0).toLocaleString("tr-TR", { maximumFractionDigits: 1 })}%`;
}

function deviceLabel(value: string): string {
  if (value === "mobile") return "Mobil";
  if (value === "tablet") return "Tablet";
  return "Masaüstü";
}

function weekdayLabel(value: number): string {
  return ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"][value] ?? String(value);
}

export default function AdminAnalyticsClient() {
  const [range, setRange] = React.useState<AnalyticsRange>("7d");
  const [tab, setTab] = React.useState<TabKey>("overview");

  const overviewQ = useGetAnalyticsOverviewAdminQuery({ range }, { refetchOnFocus: true });
  const retentionQ = useGetAnalyticsRetentionAdminQuery({ range }, { refetchOnFocus: true });
  const adsQ = useGetAnalyticsAdsAttributionAdminQuery({ range }, { skip: tab !== "ads", refetchOnFocus: true });
  const adsDailyQ = useGetAnalyticsAdsDailyAdminQuery({ range }, { skip: tab !== "ads", refetchOnFocus: true });
  const funnelQ = useGetAnalyticsFunnelAdminQuery({ range }, { skip: tab !== "ads", refetchOnFocus: true });
  const deviceDailyQ = useGetAnalyticsDeviceDailyAdminQuery(
    { range },
    {
      skip: tab !== "device",
      refetchOnFocus: true,
    },
  );
  const heatmapQ = useGetAnalyticsHeatmapAdminQuery({ range }, { skip: tab !== "device", refetchOnFocus: true });

  const overview = overviewQ.data;
  const retention = retentionQ.data;
  const ads = adsQ.data;
  const adsDaily = adsDailyQ.data;
  const funnel = funnelQ.data;
  const deviceDaily = deviceDailyQ.data;
  const heatmap = heatmapQ.data;

  const loading =
    overviewQ.isFetching ||
    retentionQ.isFetching ||
    adsQ.isFetching ||
    adsDailyQ.isFetching ||
    funnelQ.isFetching ||
    deviceDailyQ.isFetching ||
    heatmapQ.isFetching;

  async function refresh() {
    try {
      await Promise.all([
        overviewQ.refetch(),
        retentionQ.refetch(),
        tab === "ads" ? adsQ.refetch() : Promise.resolve(),
        tab === "ads" ? adsDailyQ.refetch() : Promise.resolve(),
        tab === "ads" ? funnelQ.refetch() : Promise.resolve(),
        tab === "device" ? deviceDailyQ.refetch() : Promise.resolve(),
        tab === "device" ? heatmapQ.refetch() : Promise.resolve(),
      ]);
      toast.success("Analytics verileri güncellendi.");
    } catch {
      toast.error("Analytics verileri yenilenemedi.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 font-semibold text-lg">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            Ads, retention, cihaz ve trafik kalitesi için audit log tabanlı panel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RangeControls range={range} onChange={setRange} />
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Yenile
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="İnsan Trafiği"
          value={fmtNumber(overview?.summary?.humanRequests)}
          sub={`${fmtNumber(overview?.summary?.pageviews)} pageview`}
        />
        <MetricCard
          title="Ads Unique IP"
          value={fmtNumber(overview?.summary?.adsUniqueIps)}
          sub={`${fmtNumber(overview?.summary?.adsPageviews)} Ads pageview`}
        />
        <MetricCard
          title="Direct Trafik"
          value={fmtPct(overview?.summary?.directTrafficPct)}
          sub={`${fmtNumber(overview?.summary?.returningIps)} returning IP`}
        />
        <MetricCard
          title="Bülten"
          value={fmtNumber(overview?.summary?.newsletterTotal)}
          sub={`${fmtNumber(overview?.summary?.newsletterNew)} yeni kayıt`}
        />
        <MetricCard
          title="B2B-like IP"
          value={fmtNumber(overview?.summary?.b2bLikeIps)}
          sub={`${fmtNumber(overview?.summary?.b2bIntentIps)} yüksek niyet`}
        />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
        <TabsList className="flex w-full flex-wrap justify-start">
          <TabsTrigger value="overview">
            <TrendingUp className="mr-2 h-4 w-4" />
            Genel
          </TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="ads">
            <MousePointerClick className="mr-2 h-4 w-4" />
            Ads
          </TabsTrigger>
          <TabsTrigger value="device">
            <Smartphone className="mr-2 h-4 w-4" />
            Cihaz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Günlük Trafik</CardTitle>
              <CardDescription>Request, insan/bot ayrımı, Ads ve unique IP kırılımı.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Request</TableHead>
                    <TableHead className="text-right">İnsan</TableHead>
                    <TableHead className="text-right">Bot</TableHead>
                    <TableHead className="text-right">Ads</TableHead>
                    <TableHead className="text-right">Unique IP</TableHead>
                    <TableHead className="text-right">Hata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(overview?.daily ?? []).map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.requests)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.humans)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.bots)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.ads)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.errors)}</TableCell>
                    </TableRow>
                  ))}
                  {!overviewQ.isFetching && (overview?.daily?.length ?? 0) === 0 && <EmptyRow colSpan={7} />}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-3">
            <SimpleRowsCard
              title="Top Landing Page"
              rows={overview?.topLandingPages ?? []}
              loading={overviewQ.isFetching}
            />
            <SimpleRowsCard title="Top Referrer" rows={overview?.topReferrers ?? []} loading={overviewQ.isFetching} />
            <SimpleRowsCard
              title="Cihaz Dağılımı"
              rows={(overview?.devices ?? []).map((row) => ({ name: deviceLabel(row.device), count: row.count }))}
              loading={overviewQ.isFetching}
            />
          </div>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
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
                  {(retention?.cohorts ?? []).map((row) => (
                    <TableRow key={row.date}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.visitors)}</TableCell>
                      <TableCell className="text-right">
                        {fmtNumber(row.d1)} <span className="text-muted-foreground">({fmtPct(row.d1Pct)})</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtNumber(row.d3)} <span className="text-muted-foreground">({fmtPct(row.d3Pct)})</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {fmtNumber(row.d7)} <span className="text-muted-foreground">({fmtPct(row.d7Pct)})</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!retentionQ.isFetching && (retention?.cohorts?.length ?? 0) === 0 && <EmptyRow colSpan={5} />}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ads Attribution</CardTitle>
                <CardDescription>Kampanya, source/medium, pageview ve unique IP kırılımı.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kampanya</TableHead>
                      <TableHead>Source / Medium</TableHead>
                      <TableHead className="text-right">Pageview</TableHead>
                      <TableHead className="text-right">Unique IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(ads?.items ?? []).map((row) => (
                      <TableRow key={`${row.campaign}-${row.source}-${row.medium}`}>
                        <TableCell className="font-medium">{row.campaign || "-"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.source || "-"} / {row.medium || "-"}
                        </TableCell>
                        <TableCell className="text-right">{fmtNumber(row.pageviews)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      </TableRow>
                    ))}
                    {!adsQ.isFetching && (ads?.items?.length ?? 0) === 0 && <EmptyRow colSpan={4} />}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <SimpleRowsCard title="Ads Funnel" rows={funnel?.items ?? []} loading={funnelQ.isFetching} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gün Gün Kampanya Trafiği</CardTitle>
              <CardDescription>gclid taşıyan isteklerde tarih ve kampanya bazlı trafik.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Kampanya</TableHead>
                    <TableHead>Source / Medium</TableHead>
                    <TableHead className="text-right">Pageview</TableHead>
                    <TableHead className="text-right">Unique IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(adsDaily?.items ?? []).map((row) => (
                    <TableRow key={`${row.date}-${row.campaign}-${row.source}-${row.medium}`}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell className="font-medium">{row.campaign || "-"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.source || "-"} / {row.medium || "-"}
                      </TableCell>
                      <TableCell className="text-right">{fmtNumber(row.pageviews)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                    </TableRow>
                  ))}
                  {!adsDailyQ.isFetching && (adsDaily?.items?.length ?? 0) === 0 && <EmptyRow colSpan={5} />}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="device" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <SimpleRowsCard
              title="Cihaz Dağılımı"
              rows={(overview?.devices ?? []).map((row) => ({ name: deviceLabel(row.device), count: row.count }))}
              loading={overviewQ.isFetching}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saatlik Heatmap</CardTitle>
                <CardDescription>Haftanın günü ve saate göre insan trafik / unique IP.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gün</TableHead>
                      <TableHead>Saat</TableHead>
                      <TableHead className="text-right">İnsan</TableHead>
                      <TableHead className="text-right">Unique IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(heatmap?.items ?? []).slice(0, 24).map((row) => (
                      <TableRow key={`${row.weekday}-${row.hour}`}>
                        <TableCell>{weekdayLabel(row.weekday)}</TableCell>
                        <TableCell>{String(row.hour).padStart(2, "0")}:00</TableCell>
                        <TableCell className="text-right">{fmtNumber(row.humans)}</TableCell>
                        <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      </TableRow>
                    ))}
                    {!heatmapQ.isFetching && (heatmap?.items?.length ?? 0) === 0 && <EmptyRow colSpan={4} />}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cihaz Günlük Trend</CardTitle>
              <CardDescription>Mobil/tablet/masaüstü trafiği ve Ads cihaz kırılımı.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Cihaz</TableHead>
                    <TableHead className="text-right">Request</TableHead>
                    <TableHead className="text-right">Unique IP</TableHead>
                    <TableHead className="text-right">Ads Request</TableHead>
                    <TableHead className="text-right">Ads Unique IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(deviceDaily?.items ?? []).map((row) => (
                    <TableRow key={`${row.date}-${row.device}`}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{deviceLabel(row.device)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.requests)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.uniqueIps)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.adsRequests)}</TableCell>
                      <TableCell className="text-right">{fmtNumber(row.adsUniqueIps)}</TableCell>
                    </TableRow>
                  ))}
                  {!deviceDailyQ.isFetching && (deviceDaily?.items?.length ?? 0) === 0 && <EmptyRow colSpan={6} />}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RangeControls({ range, onChange }: { range: AnalyticsRange; onChange: (range: AnalyticsRange) => void }) {
  return (
    <div className="flex rounded-md border bg-muted/30 p-1">
      {(["7d", "30d"] as const).map((item) => (
        <Button
          key={item}
          size="sm"
          variant={range === item ? "default" : "ghost"}
          onClick={() => onChange(item)}
          className="h-8"
        >
          {item === "7d" ? "7 Gün" : "30 Gün"}
        </Button>
      ))}
    </div>
  );
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
        {sub ? <div className="text-muted-foreground text-xs">{sub}</div> : null}
      </CardHeader>
    </Card>
  );
}

function SimpleRowsCard({
  title,
  rows,
  loading,
}: {
  title: string;
  rows: Array<{ name: string; count: number }>;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
            <span className="min-w-0 truncate">{row.name || "-"}</span>
            <Badge variant="outline">{fmtNumber(row.count)}</Badge>
          </div>
        ))}
        {!loading && rows.length === 0 ? <p className="text-muted-foreground text-sm">Kayıt bulunamadı.</p> : null}
      </CardContent>
    </Card>
  );
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
        Kayıt bulunamadı.
      </TableCell>
    </TableRow>
  );
}
