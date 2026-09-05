'use client';

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useListFirmLeadsAdminQuery } from '@/integrations/hooks';
import { Pager } from '../../_components/common/pager';
import { SummaryTiles } from '../../_components/common/summary-tiles';
import { useAdminT } from '../../_components/common/use-admin-t';
import { LeadSheet } from './_components/lead-sheet';
import { LeadsTable } from './_components/leads-table';
import { ALL, applyFilters, DEAL_STATUSES, DEAL_TYPES, EMPTY_FILTERS, enrich, type Filters, PAGE_SIZE, summarize } from './_lib/lead-meta';

const CONTACT_CHIPS = ['all', 'phone', 'email', 'none'] as const;

export default function FirmLeadsPage() {
  const t = useAdminT('admin.leads');
  const tc = useAdminT('admin.common');
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<number | null>(null);
  // Durum filtresi sunucuda; arama ve iletisim filtreleri yuklenen sayfa icinde.
  const { data, isLoading } = useListFirmLeadsAdminQuery({ status: filters.status, limit: PAGE_SIZE, offset: page * PAGE_SIZE });

  const rows = useMemo(() => enrich(data?.items ?? []), [data]);
  const stats = useMemo(() => summarize(rows), [rows]);
  const visible = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const open = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);
  const total = data?.meta?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const patch = (p: Partial<Filters>) => { setFilters((prev) => ({ ...prev, ...p })); if (p.status !== undefined) setPage(0); };
  const dirty = filters.q || filters.status !== ALL || filters.dealType !== ALL || filters.contact !== ALL;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{isLoading ? tc('loading') : t('subtitle', { total, today: stats.today, week: stats.week })}</p>
      </div>

      <SummaryTiles tiles={[
        { key: 'total', label: t('tiles.total'), value: total, hint: t('tiles.totalHint', { count: stats.loaded }), active: filters.status === ALL && filters.contact === ALL, onClick: () => patch({ status: ALL, contact: ALL }) },
        { key: 'open', label: t('tiles.open'), value: stats.open, hint: t('tiles.openHint'), tone: stats.open ? 'text-amber-600' : '', active: filters.status === 'lead', onClick: () => patch({ status: 'lead' }) },
        { key: 'today', label: t('tiles.today'), value: stats.today, hint: t('tiles.todayHint'), tone: stats.today ? 'text-emerald-600' : '' },
        { key: 'week', label: t('tiles.week'), value: stats.week, hint: t('tiles.weekHint') },
        { key: 'phone', label: t('tiles.phone'), value: stats.phone, hint: t('tiles.phoneHint'), active: filters.contact === 'phone', onClick: () => patch({ contact: 'phone' }) },
        { key: 'email', label: t('tiles.email'), value: stats.email, hint: t('tiles.emailHint'), active: filters.contact === 'email', onClick: () => patch({ contact: 'email' }) },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('search')} value={filters.q} onChange={(e) => patch({ q: e.target.value })} />
        </div>
        <Select value={filters.status} onValueChange={(v) => patch({ status: v })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('allStatuses')}</SelectItem>{DEAL_STATUSES.map((k) => <SelectItem key={k} value={k}>{t(`statuses.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.dealType} onValueChange={(v) => patch({ dealType: v })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('allTypes')}</SelectItem>{DEAL_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`dealTypes.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        {dirty ? <Button variant="ghost" size="sm" onClick={() => { setFilters(EMPTY_FILTERS); setPage(0); }}><X className="size-3.5" /> {tc('clear')}</Button> : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CONTACT_CHIPS.map((k) => (
          <Button key={k} size="sm" variant={filters.contact === k ? 'default' : 'outline'} onClick={() => patch({ contact: k })}>{t(`chips.${k}`)}</Button>
        ))}
        <span className="ml-auto self-center text-sm text-muted-foreground">{t('table.summary', { count: visible.length })}</span>
      </div>

      <LeadsTable rows={visible} loading={isLoading} activeId={openId ?? undefined} onSelect={(r) => setOpenId(r.id)} t={t} tc={tc} />
      {pageCount > 1 ? <Pager page={page} pageCount={pageCount} onChange={setPage} summary={t('table.total', { count: total })} tc={tc} /> : null}
      <LeadSheet row={open} onClose={() => setOpenId(null)} t={t} tc={tc} />
    </div>
  );
}
