'use client';

import * as React from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGscAnalyticsQuery, useGscInspectMutation, useGscOverviewQuery, useGscPageQueriesQuery, useGscSitemapsQuery, useGscSitesQuery, useGscStatusQuery } from '@/integrations/hooks';
import { GSC_RANGES, GSC_RANGE_LABELS, GSC_SEARCH_TYPES, GSC_VERDICT_LABELS, adsLabel, getErrorMessage, type GscInspectResp, type GscRange, type GscSearchType } from '@/integrations/shared';
import { IndexTab } from './gsc-index-tab';
import { OverviewTab } from './gsc-overview-tab';
import { SitemapTab } from './gsc-sitemap-tab';
import { RowTable } from './gsc-tables';
import { SeoOpsPanel } from './_components/seo-ops-panel';

export default function SearchConsolePage() {
  const t = useAdminT('admin.searchConsole');
  const { data: status } = useGscStatusQuery();
  const { data: sites } = useGscSitesQuery();
  const [site, setSite] = React.useState<string>('');
  const [range, setRange] = React.useState<GscRange>('LAST_28_DAYS');
  const [type, setType] = React.useState<GscSearchType>('web');
  const [page, setPage] = React.useState('');
  const activeSite = site || status?.site || '';
  const params = { range, type, ...(activeSite ? { site_url: activeSite } : {}) };
  const { data: ov } = useGscOverviewQuery(params);
  const { data: analytics, isFetching } = useGscAnalyticsQuery(params);
  const { data: drill } = useGscPageQueriesQuery(page ? { ...params, page } : skipToken);
  const { data: sm } = useGscSitemapsQuery(activeSite ? { site_url: activeSite } : undefined);
  const [inspectUrl, setInspectUrl] = React.useState('');
  const [inspect, { isLoading: inspecting }] = useGscInspectMutation();
  const [inspectRes, setInspectRes] = React.useState<GscInspectResp | null>(null);

  const handleInspect = async () => {
    if (!inspectUrl.trim()) return;
    try {
      const res = await inspect({ url: inspectUrl.trim(), site_url: activeSite || undefined }).unwrap();
      setInspectRes(res);
    } catch (err) {
      toast.error(`${t('inspect.failed')}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div><CardTitle className="text-base">{t('title')}</CardTitle><CardDescription>{t('description')}</CardDescription></div>
            <Badge variant={status?.connected ? 'default' : 'destructive'}>{status?.connected ? t('connected') : t('disconnected')}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Select value={activeSite} onValueChange={setSite}>
              <SelectTrigger className="h-8 w-72"><SelectValue placeholder={t('selectSite')} /></SelectTrigger>
              <SelectContent>{(sites?.items ?? []).map((s) => <SelectItem key={s.site_url} value={s.site_url}>{s.site_url}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as GscRange)}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{GSC_RANGES.map((r) => <SelectItem key={r} value={r}>{GSC_RANGE_LABELS[r]}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => setType(v as GscSearchType)}>
              <SelectTrigger className="h-8 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{GSC_SEARCH_TYPES.map((r) => <SelectItem key={r} value={r}>{t(`types.${r}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="index">{t('tabs.index')}</TabsTrigger>
          <TabsTrigger value="queries">{t('tabs.queries')}</TabsTrigger>
          <TabsTrigger value="sitemaps">{t('tabs.sitemaps')}</TabsTrigger>
          <TabsTrigger value="seo-ops">İçerik / Yönlendirme</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab data={analytics} loading={isFetching} t={t} /></TabsContent>
        <TabsContent value="index"><IndexTab site={activeSite} t={t} /></TabsContent>
        <TabsContent value="queries" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-sm">{t('queries')}</CardTitle></CardHeader><CardContent><RowTable rows={ov?.queries ?? []} t={t} head={t('cols.query')} /></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">{t('pages')}</CardTitle></CardHeader><CardContent><RowTable rows={ov?.pages ?? []} t={t} head={t('cols.page')} onPick={setPage} /></CardContent></Card>
          {page ? <Card><CardHeader><CardTitle className="text-sm">{t('drill.title')}</CardTitle><CardDescription>{page}</CardDescription></CardHeader><CardContent><RowTable rows={drill?.items ?? []} t={t} head={t('cols.query')} /></CardContent></Card> : null}
          <Card><CardHeader><CardTitle className="text-sm">{t('inspect.title')}</CardTitle><CardDescription>{t('inspect.description')}</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2"><Input value={inspectUrl} onChange={(e) => setInspectUrl(e.target.value)} placeholder={t('inspect.placeholder')} className="h-9 flex-1 text-sm" />
                <Button size="sm" onClick={handleInspect} disabled={inspecting || !inspectUrl.trim()}><Search className="mr-2 h-4 w-4" />{inspecting ? t('inspect.checking') : t('inspect.check')}</Button>
                <Button size="sm" variant="outline" disabled={!inspectUrl.trim()} asChild>
                  <a
                    href={`https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(activeSite)}&id=${encodeURIComponent(inspectUrl.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />{t('inspect.requestIndex')}
                  </a>
                </Button></div>
              {inspectRes ? <div className="flex flex-wrap gap-2"><Badge variant={inspectRes.verdict === 'PASS' ? 'default' : 'secondary'}>{adsLabel(GSC_VERDICT_LABELS, inspectRes.verdict)}</Badge>
                <Badge variant="outline">{t('inspect.coverage')}: {inspectRes.coverage || '-'}</Badge>
                <Badge variant="outline">{t('inspect.lastCrawl')}: {inspectRes.last_crawl ? new Date(inspectRes.last_crawl).toLocaleDateString('tr-TR') : '-'}</Badge></div> : null}
              <p className="text-muted-foreground text-xs">{t('inspect.requestIndexNote')}</p>
            </CardContent></Card>
        </TabsContent>
        <TabsContent value="sitemaps"><SitemapTab items={sm?.items ?? []} site={activeSite} t={t} /></TabsContent>
        <TabsContent value="seo-ops"><SeoOpsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
