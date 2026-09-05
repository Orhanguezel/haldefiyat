'use client';

import { useEffect, useMemo, useState } from 'react';
import { Radar, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { DiscoveryDomain } from '@/integrations/endpoints/competitor-monitor-admin-endpoints';
import { useGetCompetitorDiscoveryAdminQuery, useListCompetitorSitesAdminQuery, useStartCompetitorDiscoveryAdminMutation } from '@/integrations/hooks';
import { SummaryTiles } from '../../_components/common/summary-tiles';
import { useAdminT } from '../../_components/common/use-admin-t';
import { DiscoveryTable } from './_components/discovery-table';
import { DomainSheet } from './_components/domain-sheet';
import { QueriesPanel } from './_components/queries-panel';
import { SitesPanel } from './_components/sites-panel';
import { ALL, type DomainFilters, EMPTY_DOMAIN_FILTERS, filterDomains, formatDateTime, summarizeDiscovery, summarizeSites } from './_lib/competitor-meta';

const KINDS = ['official', 'retail', 'news', 'other'] as const;

export default function Page() {
  const t = useAdminT('admin.competitor');
  const tc = useAdminT('admin.common');
  const [runId, setRunId] = useState<number | undefined>(undefined);
  const { data, isLoading, refetch } = useGetCompetitorDiscoveryAdminQuery(runId ? { runId } : undefined, { pollingInterval: 0 });
  const { data: sitesData, isLoading: sitesLoading } = useListCompetitorSitesAdminQuery();
  const [start, st] = useStartCompetitorDiscoveryAdminMutation();
  const [filters, setFilters] = useState<DomainFilters>(EMPTY_DOMAIN_FILTERS);
  const [openDomain, setOpenDomain] = useState<string | null>(null);
  const [manual, setManual] = useState('');
  const running = Boolean(data?.running) || data?.run?.status === 'running';
  // Kosu surerken 5 sn'de bir yenile; bitince dur.
  useEffect(() => { if (!running) return; const id = setInterval(() => void refetch(), 5000); return () => clearInterval(id); }, [running, refetch]);

  const domains = data?.domains ?? [];
  const queries = data?.queries ?? [];
  const sites = sitesData?.items ?? [];
  const stats = useMemo(() => summarizeDiscovery(domains, queries), [domains, queries]);
  const siteStats = useMemo(() => summarizeSites(sites), [sites]);
  const visible = useMemo(() => filterDomains(domains, filters), [domains, filters]);
  const open = domains.find((d) => d.domain === openDomain) ?? null;
  const patch = (p: Partial<DomainFilters>) => setFilters((prev) => ({ ...prev, ...p }));
  const dirty = filters.q || filters.kind !== ALL || filters.onlyAhead || filters.hideTracked;

  async function launch(queriesText?: string) {
    const list = queriesText?.split('\n').map((s) => s.trim()).filter(Boolean);
    try {
      await start(list?.length ? { queries: list, pages: 2 } : { limit: 30, pages: 2 }).unwrap();
      toast.success(t('discovery.started'));
      setRunId(undefined);
      setTimeout(() => void refetch(), 1500);
    } catch (err) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e.data?.error?.message ?? t('discovery.startFailed'));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{data?.run ? t('subtitle', { date: formatDateTime(data.run.started_at), source: t(`sources.${data.run.query_source}`, undefined, data.run.query_source), engine: data.run.engine, status: t(`runStatus.${data.run.status}`) }) : t('subtitleEmpty')}</p>
        </div>
        <div className="flex items-center gap-2">
          {(data?.runs?.length ?? 0) > 1 ? (
            <Select value={String(runId ?? data?.run?.id ?? '')} onValueChange={(v) => setRunId(Number(v))}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>{data?.runs.map((r) => <SelectItem key={r.id} value={String(r.id)}>{formatDateTime(r.started_at)} · {r.queries_done} {t('discovery.queriesShort')}</SelectItem>)}</SelectContent>
            </Select>
          ) : null}
          <Popover>
            <PopoverTrigger asChild><Button variant="outline" disabled={running}>{t('discovery.manual')}</Button></PopoverTrigger>
            <PopoverContent className="w-96 space-y-2" align="end">
              <p className="text-xs text-muted-foreground">{t('discovery.manualHint')}</p>
              <Textarea rows={6} value={manual} onChange={(e) => setManual(e.target.value)} placeholder={t('discovery.manualPlaceholder')} />
              <Button size="sm" className="w-full" onClick={() => launch(manual)} disabled={st.isLoading || !manual.trim()}>{t('discovery.startManual')}</Button>
            </PopoverContent>
          </Popover>
          <Button onClick={() => launch()} disabled={st.isLoading || running}><Radar className={`size-4 ${running ? 'animate-pulse' : ''}`} /> {running ? t('discovery.running', { done: data?.run?.queries_done ?? 0, total: data?.run?.queries_total ?? 0 }) : t('discovery.start')}</Button>
        </div>
      </div>

      <SummaryTiles tiles={[
        { key: 'domains', label: t('tiles.domains'), value: stats.domains, hint: t('tiles.domainsHint', { official: stats.official }), active: !dirty, onClick: () => setFilters(EMPTY_DOMAIN_FILTERS) },
        { key: 'ahead', label: t('tiles.ahead'), value: domains.filter((d) => !d.isOurs && Number(d.ahead_of_us) > 0).length, hint: t('tiles.aheadHint'), tone: 'text-rose-600', active: filters.onlyAhead, onClick: () => patch({ onlyAhead: !filters.onlyAhead }) },
        { key: 'tracked', label: t('tiles.tracked'), value: stats.tracked, hint: t('tiles.trackedHint', { total: siteStats.total }) },
        { key: 'queries', label: t('tiles.queries'), value: stats.queries, hint: t('tiles.queriesHint') },
        { key: 'weRank', label: t('tiles.weRank'), value: stats.weRank, hint: stats.avgOurPosition ? t('tiles.weRankHint', { avg: stats.avgOurPosition.toFixed(1), top3: stats.weTop3 }) : t('tiles.weRankNone'), tone: 'text-emerald-600' },
        { key: 'missing', label: t('tiles.missing'), value: stats.missing, hint: t('tiles.missingHint'), tone: stats.missing ? 'text-amber-600' : '' },
      ]} />

      {data?.delta && (data.delta.appeared.length || data.delta.disappeared.length) ? (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border p-3 text-xs">
          <span className="text-muted-foreground">{t('discovery.delta')}</span>
          {data.delta.appeared.map((d) => <Badge key={`a-${d}`} className="bg-emerald-100 font-normal text-emerald-700 hover:bg-emerald-100">+ {d}</Badge>)}
          {data.delta.disappeared.map((d) => <Badge key={`d-${d}`} className="bg-rose-100 font-normal text-rose-700 hover:bg-rose-100">− {d}</Badge>)}
        </div>
      ) : null}

      <Tabs defaultValue="discovery">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="discovery">{t('tabs.discovery')}</TabsTrigger>
          <TabsTrigger value="queries">{t('tabs.queries')}</TabsTrigger>
          <TabsTrigger value="sites">{t('tabs.sites')}{siteStats.failing ? <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[10px] text-white">{siteStats.failing}</span> : null}</TabsTrigger>
        </TabsList>
        <TabsContent value="discovery" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder={t('discovery.search')} value={filters.q} onChange={(e) => patch({ q: e.target.value })} />
            </div>
            <Select value={filters.kind} onValueChange={(v) => patch({ kind: v })}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ALL}>{t('kinds.all')}</SelectItem>{KINDS.map((k) => <SelectItem key={k} value={k}>{t(`kinds.${k}`)}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" variant={filters.onlyAhead ? 'default' : 'outline'} onClick={() => patch({ onlyAhead: !filters.onlyAhead })}>{t('discovery.chipAhead')}</Button>
            <Button size="sm" variant={filters.hideTracked ? 'default' : 'outline'} onClick={() => patch({ hideTracked: !filters.hideTracked })}>{t('discovery.chipHideTracked')}</Button>
            {dirty ? <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_DOMAIN_FILTERS)}><X className="size-3.5" /> {tc('clear')}</Button> : null}
            <span className="ml-auto self-center text-sm text-muted-foreground">{t('discovery.count', { count: visible.length })}</span>
          </div>
          <DiscoveryTable rows={visible} totalQueries={stats.queries} loading={isLoading} activeKey={openDomain ?? undefined} onSelect={(d: DiscoveryDomain) => setOpenDomain(d.domain)} t={t} tc={tc} />
        </TabsContent>
        <TabsContent value="queries" className="mt-4"><QueriesPanel rows={queries} runId={data?.run?.id ?? null} loading={isLoading} t={t} tc={tc} /></TabsContent>
        <TabsContent value="sites" className="mt-4"><SitesPanel sites={sites} loading={sitesLoading} t={t} tc={tc} /></TabsContent>
      </Tabs>

      <DomainSheet row={open} runId={data?.run?.id ?? null} onClose={() => setOpenDomain(null)} t={t} tc={tc} />
    </div>
  );
}
