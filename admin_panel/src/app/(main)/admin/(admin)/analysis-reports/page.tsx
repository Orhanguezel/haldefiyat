'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { FilePlus2, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGenerateAnalysisReportAdminMutation, useListAnalysisReportsAdminQuery } from '@/integrations/hooks';
import { SummaryTiles } from '../../_components/common/summary-tiles';
import { useAdminT } from '../../_components/common/use-admin-t';
import { ReportSheet } from './_components/report-sheet';
import { ReportsTable } from './_components/reports-table';
import { ALL, applyFilters, EMPTY_FILTERS, type Filters, SORT_KEYS, type SortKey, STATUSES, summarize } from './_lib/report-meta';

export default function Page() {
  const t = useAdminT('admin.analysis');
  const tc = useAdminT('admin.common');
  const router = useRouter();
  const { data, isLoading } = useListAnalysisReportsAdminQuery({ status: 'all', limit: 500 });
  const [generate, { isLoading: generating }] = useGenerateAnalysisReportAdminMutation();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [openId, setOpenId] = useState<number | null>(null);

  const rows = data?.items ?? [];
  const stats = useMemo(() => summarize(rows), [rows]);
  const visible = useMemo(() => applyFilters(rows, filters), [rows, filters]);
  const open = useMemo(() => rows.find((r) => r.id === openId) ?? null, [rows, openId]);
  const patch = (p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p }));
  const dirty = filters.q || filters.status !== ALL || filters.source !== ALL;

  async function handleGenerate() {
    try {
      const result = await generate({}).unwrap();
      toast.success(t('toasts.generated'));
      router.push(`/admin/analysis-reports/${result.data.id}`);
    } catch { toast.error(t('toasts.generateFailed')); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{isLoading ? tc('loading') : t('subtitle', { total: stats.total, published: stats.published, draft: stats.draft })}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/admin/analysis-reports/new"><Plus className="size-4" /> {t('new')}</Link></Button>
          <Button onClick={handleGenerate} disabled={generating}><FilePlus2 className="size-4" /> {generating ? t('generating') : t('generate')}</Button>
        </div>
      </div>

      <SummaryTiles tiles={[
        { key: 'total', label: t('tiles.total'), value: stats.total, hint: t('tiles.totalHint', { auto: stats.auto }), active: filters.status === ALL, onClick: () => patch({ status: ALL }) },
        { key: 'published', label: t('tiles.published'), value: stats.published, hint: t('tiles.publishedHint'), tone: 'text-emerald-600', active: filters.status === 'published', onClick: () => patch({ status: 'published' }) },
        { key: 'draft', label: t('tiles.draft'), value: stats.draft, hint: t('tiles.draftHint'), tone: stats.draft ? 'text-amber-600' : '', active: filters.status === 'draft', onClick: () => patch({ status: 'draft' }) },
        { key: 'archived', label: t('tiles.archived'), value: stats.archived, hint: t('tiles.archivedHint'), active: filters.status === 'archived', onClick: () => patch({ status: 'archived' }) },
        { key: 'thin', label: t('tiles.thin'), value: stats.thin, hint: t('tiles.thinHint'), tone: stats.thin ? 'text-rose-600' : '' },
      ]} columns="sm:grid-cols-3 xl:grid-cols-5" />

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder={t('search')} value={filters.q} onChange={(e) => patch({ q: e.target.value })} />
        </div>
        <Select value={filters.status} onValueChange={(v) => patch({ status: v })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('allStatuses')}</SelectItem>{STATUSES.map((k) => <SelectItem key={k} value={k}>{t(`statuses.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.source} onValueChange={(v) => patch({ source: v })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t('allSources')}</SelectItem><SelectItem value="auto">{t('sources.auto')}</SelectItem><SelectItem value="manual">{t('sources.manual')}</SelectItem></SelectContent>
        </Select>
        <Select value={filters.sort} onValueChange={(v) => patch({ sort: v as SortKey })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{SORT_KEYS.map((k) => <SelectItem key={k} value={k}>{t(`sort.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        {dirty ? <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}><X className="size-3.5" /> {tc('clear')}</Button> : null}
        <span className="ml-auto self-center text-sm text-muted-foreground">{t('table.summary', { count: visible.length })}</span>
      </div>

      <ReportsTable rows={visible} loading={isLoading} activeId={openId ?? undefined} onSelect={(r) => setOpenId(r.id)} t={t} tc={tc} />
      <ReportSheet row={open} onClose={() => setOpenId(null)} t={t} tc={tc} />
    </div>
  );
}
