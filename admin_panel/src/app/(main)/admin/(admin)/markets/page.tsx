'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useListMarketsAdminQuery, useListMarketStatsAdminQuery } from '@/integrations/hooks';
import { useAdminT } from '../../_components/common/use-admin-t';
import { MarketSheet } from './_components/market-sheet';
import { MarketsTable } from './_components/markets-table';
import { ALL, applyFilters, EMPTY_FILTERS, enrich, MARKET_TYPES, type Filters, type MarketRow, SORT_KEYS, type SortKey, sortRows, summarize } from './_lib/market-meta';

const HEALTH_CHIPS = ['all', 'live', 'stale', 'dry', 'noData', 'passive', 'noIndex'] as const;

export default function Page() {
  const t = useAdminT('admin.markets');
  const tc = useAdminT('admin.common');
  const { data, isLoading } = useListMarketsAdminQuery({});
  const { data: statsData } = useListMarketStatsAdminQuery();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<number | null>(null);

  const rows = useMemo(() => enrich(data?.items ?? [], statsData?.items ?? []), [data, statsData]);
  const cities = useMemo(() => Array.from(new Set(rows.map((r) => r.cityName))).sort((a, b) => a.localeCompare(b, 'tr')), [rows]);
  const stats = useMemo(() => summarize(rows), [rows]);
  const visible = useMemo(() => sortRows(applyFilters(rows, filters), filters.sort), [rows, filters]);
  const open = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);
  const patch = (p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p }));
  const dirty = filters.q || filters.type !== ALL || filters.city !== ALL || filters.health !== ALL;

  const tiles: Array<{ key: string; value: number; hint: string; filter: Partial<Filters>; tone?: string }> = [
    { key: 'total', value: stats.total, hint: t('tiles.totalHint', { active: stats.active }), filter: { health: ALL, type: ALL } },
    { key: 'live', value: stats.live, hint: t('tiles.liveHint'), filter: { health: 'live' }, tone: 'text-emerald-600' },
    { key: 'stale', value: stats.stale, hint: t('tiles.staleHint'), filter: { health: 'stale' }, tone: stats.stale ? 'text-amber-600' : '' },
    { key: 'dry', value: stats.dry, hint: t('tiles.dryHint'), filter: { health: 'dry' }, tone: stats.dry ? 'text-rose-600' : '' },
    { key: 'noData', value: stats.noData, hint: t('tiles.noDataHint'), filter: { health: 'noData' } },
    { key: 'borsa', value: stats.borsa, hint: t('tiles.borsaHint'), filter: { type: 'borsa' } },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{isLoading ? tc('loading') : t('subtitle', { count: stats.total, cities: stats.cities, live: stats.live, dry: stats.dry })}</p>
        </div>
        <Button asChild><Link href="/admin/markets/new"><Plus className="size-4" /> {t('new')}</Link></Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => {
          const active = Object.entries(tile.filter).every(([k, v]) => filters[k as keyof Filters] === v) && Object.keys(tile.filter).length === 1;
          return (
            <button key={tile.key} type="button" onClick={() => patch(tile.filter)} className={`rounded-lg border p-3 text-left transition hover:border-primary/40 ${active ? 'border-primary bg-primary/5' : 'bg-background'}`}>
              <div className="text-xs text-muted-foreground">{t(`tiles.${tile.key}`)}</div>
              <div className={`text-2xl font-semibold tabular-nums ${tile.tone ?? ''}`}>{tile.value}</div>
              <div className="truncate text-xs text-muted-foreground">{tile.hint}</div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('search')} value={filters.q} onChange={(e) => patch({ q: e.target.value })} />
        </div>
        <Select value={filters.type} onValueChange={(v) => patch({ type: v })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('allTypes')}</SelectItem>{MARKET_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`types.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.city} onValueChange={(v) => patch({ city: v })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('allCities')}</SelectItem>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={(v) => patch({ sort: v as SortKey })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{SORT_KEYS.map((k) => <SelectItem key={k} value={k}>{t(`sort.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        {dirty ? <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}><X className="size-3.5" /> {tc('clear')}</Button> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {HEALTH_CHIPS.map((k) => (
          <Button key={k} size="sm" variant={filters.health === k ? 'default' : 'outline'} onClick={() => patch({ health: k })}>{t(`chips.${k}`)}</Button>
        ))}
        <span className="ml-auto self-center text-sm text-muted-foreground">{t('table.summary', { count: visible.length })}</span>
      </div>

      <MarketsTable rows={visible} loading={isLoading} activeId={openId ?? undefined} onSelect={(r: MarketRow) => setOpenId(r.id)} t={t} tc={tc} />
      <MarketSheet row={open} onClose={() => setOpenId(null)} t={t} tc={tc} />
    </div>
  );
}
