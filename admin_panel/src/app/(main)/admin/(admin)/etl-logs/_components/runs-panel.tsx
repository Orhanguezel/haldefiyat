'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TranslateFn } from '@/i18n';
import { useListEtlLogsAdminQuery, useListEtlSourcesAdminQuery } from '@/integrations/hooks';
import { SummaryTiles } from '../../../_components/common/summary-tiles';
import { ALL, applyFilters, DAY_OPTIONS, EMPTY_FILTERS, type Filters, SORT_KEYS, type SortKey, summarize } from '../_lib/etl-meta';
import { RunSheet } from './run-sheet';
import { RunsTable } from './runs-table';

const STATUS_CHIPS = ['all', 'error', 'partial', 'ok', 'emptyOk'] as const;

export function RunsPanel({ t, tc }: { t: TranslateFn; tc: TranslateFn }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<number | null>(null);
  // Kaynak ve gun penceresi sunucuda; durum/arama/siralama yuklenen kume icinde.
  const { data, isLoading } = useListEtlLogsAdminQuery({ days: filters.days, source: filters.source === ALL ? undefined : filters.source, limit: 500 });
  const { data: sourceData } = useListEtlSourcesAdminQuery();
  const logs = data?.logs ?? [];
  const stats = useMemo(() => summarize(logs), [logs]);
  const visible = useMemo(() => applyFilters(logs, filters), [logs, filters]);
  const open = useMemo(() => logs.find((l) => l.id === openId) ?? null, [logs, openId]);
  const history = useMemo(() => (open ? logs.filter((l) => l.sourceApi === open.sourceApi).slice(0, 15) : []), [logs, open]);
  const sourceKeys = useMemo(() => Array.from(new Set([...(sourceData?.sources ?? []).map((s) => s.key), ...logs.map((l) => l.sourceApi)])).sort(), [sourceData, logs]);
  const patch = (p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p }));
  const dirty = filters.q || filters.source !== ALL || filters.status !== ALL || filters.days !== EMPTY_FILTERS.days;

  return (
    <div className="space-y-4">
      <SummaryTiles tiles={[
        { key: 'total', label: t('tiles.total'), value: stats.total, hint: t('tiles.totalHint', { sources: stats.sources, days: filters.days }), active: filters.status === ALL, onClick: () => patch({ status: ALL }) },
        { key: 'error', label: t('tiles.error'), value: stats.error, hint: t('tiles.errorHint'), tone: stats.error ? 'text-rose-600' : '', active: filters.status === 'error', onClick: () => patch({ status: 'error' }) },
        { key: 'partial', label: t('tiles.partial'), value: stats.partial, hint: t('tiles.partialHint'), tone: stats.partial ? 'text-amber-600' : '', active: filters.status === 'partial', onClick: () => patch({ status: 'partial' }) },
        { key: 'emptyOk', label: t('tiles.emptyOk'), value: stats.emptyOk, hint: t('tiles.emptyOkHint'), active: filters.status === 'emptyOk', onClick: () => patch({ status: 'emptyOk' }) },
        { key: 'ok', label: t('tiles.ok'), value: stats.ok, hint: t('tiles.okHint'), tone: 'text-emerald-600', active: filters.status === 'ok', onClick: () => patch({ status: 'ok' }) },
        { key: 'inserted', label: t('tiles.inserted'), value: stats.inserted, hint: t('tiles.insertedHint') },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('search')} value={filters.q} onChange={(e) => patch({ q: e.target.value })} />
        </div>
        <Select value={filters.source} onValueChange={(v) => patch({ source: v })}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('allSources')}</SelectItem>{sourceKeys.map((k) => <SelectItem key={k} value={k} className="font-mono text-xs">{k}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(filters.days)} onValueChange={(v) => patch({ days: Number(v) })}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{DAY_OPTIONS.map((d) => <SelectItem key={d} value={String(d)}>{t('lastDays', { count: d })}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={(v) => patch({ sort: v as SortKey })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{SORT_KEYS.map((k) => <SelectItem key={k} value={k}>{t(`sort.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        {dirty ? <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}><X className="size-3.5" /> {tc('clear')}</Button> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_CHIPS.map((k) => (
          <Button key={k} size="sm" variant={filters.status === k ? 'default' : 'outline'} onClick={() => patch({ status: k })}>{k === 'all' ? t('chips.all') : k === 'emptyOk' ? t('table.emptyOk') : t(`statuses.${k}`)}</Button>
        ))}
        <span className="ml-auto self-center text-sm text-muted-foreground">{t('table.summary', { count: visible.length })}</span>
      </div>

      <RunsTable rows={visible} loading={isLoading} activeId={openId ?? undefined} onSelect={(r) => setOpenId(r.id)} t={t} tc={tc} />
      <RunSheet row={open} history={history} source={sourceData?.sources.find((s) => s.key === open?.sourceApi)} onClose={() => setOpenId(null)} t={t} tc={tc} />
    </div>
  );
}
