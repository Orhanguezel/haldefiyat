'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FirmAdminItem } from '@/integrations/endpoints/firms-admin-endpoints';
import {
  useGetFirmFacetsAdminQuery, useListFirmClaimsAdminQuery, useListFirmsAdminQuery, useListStaleFirmsAdminQuery,
  useModerateFirmClaimAdminMutation, useRunFirmsEtlAdminMutation,
} from '@/integrations/hooks';
import { useAdminT } from '../../_components/common/use-admin-t';
import { FirmSheet } from './_components/firm-sheet';
import { FirmsTable } from './_components/firms-table';
import { FirmsToolbar } from './_components/firms-toolbar';
import { ALL, EMPTY_FILTERS, FIRM_TYPES, type Filters, isDirty, PAGE_SIZE, toQuery } from './_lib/firm-meta';

function useDebounced<T>(value: T, ms: number) {
  const [d, setD] = useState(value);
  useEffect(() => { const h = setTimeout(() => setD(value), ms); return () => clearTimeout(h); }, [value, ms]);
  return d;
}

export default function FirmsAdminPage() {
  const t = useAdminT('admin.firms');
  const tc = useAdminT('admin.common');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [claimStatus, setClaimStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [etl, setEtl] = useState({ city: '', type: 'komisyoncu' });
  const [lastRun, setLastRun] = useState('');

  const q = useDebounced(filters.q, 300);
  const query = useMemo(() => toQuery({ ...filters, q }, page), [filters, q, page]);
  const { data, isLoading, isFetching } = useListFirmsAdminQuery(query);
  const { data: facets } = useGetFirmFacetsAdminQuery();
  const { data: claimsData } = useListFirmClaimsAdminQuery({ status: claimStatus });
  const { data: allClaims } = useListFirmClaimsAdminQuery({ status: 'all' });
  const { data: staleData } = useListStaleFirmsAdminQuery({ days: 45 });
  const [moderateClaim, claimState] = useModerateFirmClaimAdminMutation();
  const [runEtl, etlState] = useRunFirmsEtlAdminMutation();

  useEffect(() => { setPage(0); }, [q, filters.city, filters.type, filters.status, filters.claim, filters.source, filters.phone, filters.sponsored, filters.stale, filters.sort]);

  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const summary = data?.summary;
  const open = useMemo(() => items.find((i) => i.id === openId) ?? null, [items, openId]);
  const patch = (p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p }));
  const pendingClaims = (allClaims?.items ?? []).filter((c) => c.status === 'pending').length;
  const pendingFirms = facets?.statuses.find((s) => s.key === 'pending')?.count ?? 0;

  const tiles: Array<{ key: string; value: number | string; hint: string; filter?: Partial<Filters>; tone?: string }> = [
    { key: 'total', value: summary?.total ?? 0, hint: t('tiles.totalHint', { active: summary?.active ?? 0 }), filter: { status: 'all', claim: ALL, sponsored: false, stale: false } },
    { key: 'pending', value: pendingFirms, hint: t('tiles.pendingHint'), filter: { status: 'pending' }, tone: pendingFirms ? 'text-amber-600' : '' },
    { key: 'claims', value: pendingClaims, hint: t('tiles.claimsHint'), filter: { claim: 'pending', status: 'all' }, tone: pendingClaims ? 'text-amber-600' : '' },
    { key: 'sponsored', value: summary?.activeSponsorships ?? 0, hint: t('tiles.sponsoredHint'), filter: { sponsored: true, status: 'all' }, tone: 'text-primary' },
    { key: 'stale', value: summary?.stale ?? 0, hint: t('tiles.staleHint'), filter: { stale: true, status: 'all' } },
    { key: 'pipeline', value: `${Math.round(summary?.pipelineValue ?? 0).toLocaleString('tr-TR')} ₺`, hint: t('tiles.pipelineHint') },
  ];

  async function handleEtl(dryRun: boolean) {
    try {
      const r = await runEtl({ city: etl.city || undefined, type: etl.type as FirmAdminItem['firmType'], dryRun, limit: dryRun ? 100 : 250, delayMs: dryRun ? 0 : 750, includeDetails: !dryRun }).unwrap();
      setLastRun(dryRun ? t('etl.dryResult', { discovered: r.discovered }) : t('etl.result', { discovered: r.discovered, inserted: r.inserted ?? 0, updated: r.updated ?? 0, skipped: r.skipped ?? 0 }));
    } catch { toast.error(tc('error')); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{summary ? t('subtitle', { total: summary.total.toLocaleString('tr-TR'), active: summary.active, stale: summary.stale, sponsored: summary.activeSponsorships }) : tc('loading')}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <button key={tile.key} type="button" disabled={!tile.filter} onClick={() => tile.filter && patch(tile.filter)} className="rounded-lg border bg-background p-3 text-left transition enabled:hover:border-primary/40 disabled:cursor-default">
            <div className="text-xs text-muted-foreground">{t(`tiles.${tile.key}`)}</div>
            <div className={`text-2xl font-semibold tabular-nums ${tile.tone ?? ''}`}>{tile.value}</div>
            <div className="truncate text-xs text-muted-foreground">{tile.hint}</div>
          </button>
        ))}
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">{t('tabs.list')}</TabsTrigger>
          <TabsTrigger value="claims">{t('tabs.claims')} {pendingClaims ? `(${pendingClaims})` : ''}</TabsTrigger>
          <TabsTrigger value="stale">{t('tabs.stale')}</TabsTrigger>
          <TabsTrigger value="etl">{t('tabs.etl')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3">
          <FirmsToolbar filters={filters} onChange={patch} facets={facets} t={t} tc={tc} />
          {isDirty(filters) ? <Button size="sm" variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)}>{tc('clearFilters')}</Button> : null}
          <FirmsTable items={items} loading={isLoading} activeId={openId ?? undefined} onSelect={(i) => setOpenId(i.id)} t={t} tc={tc} />
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>{total ? t('table.summary', { from: page * PAGE_SIZE + 1, to: Math.min(total, (page + 1) * PAGE_SIZE), total: total.toLocaleString('tr-TR') }) : t('table.noRecords')}{isFetching && !isLoading ? ` · ${tc('updating')}` : ''}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft className="size-4" /> {tc('previous')}</Button>
              <span>{tc('pageOf', { page: page + 1, total: pageCount })}</span>
              <Button size="sm" variant="outline" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)}>{tc('next')} <ChevronRight className="size-4" /></Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="claims" className="space-y-3">
          <div className="flex justify-end">
            <Select value={claimStatus} onValueChange={(v) => setClaimStatus(v as typeof claimStatus)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{(['pending', 'approved', 'rejected', 'all'] as const).map((k) => <SelectItem key={k} value={k}>{t(`status.${k}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>{t('claims.firm')}</TableHead><TableHead>{t('claims.user')}</TableHead><TableHead>{t('claims.evidence')}</TableHead><TableHead>{t('claims.status')}</TableHead><TableHead className="text-right">{t('claims.action')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {(claimsData?.items ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><div className="font-medium">{c.firmName || `#${c.firmId}`}</div><button type="button" className="font-mono text-xs text-primary hover:underline" onClick={() => setOpenId(c.firmId)}>{c.firmSlug || '—'}</button></TableCell>
                    <TableCell className="font-mono text-xs">{c.userId}</TableCell>
                    <TableCell className="max-w-[360px] whitespace-pre-wrap text-sm text-muted-foreground">{c.evidence || '—'}</TableCell>
                    <TableCell><Badge variant={c.status === 'approved' ? 'default' : c.status === 'rejected' ? 'destructive' : 'secondary'} className="font-normal">{t(`status.${c.status}`)}</Badge></TableCell>
                    <TableCell className="text-right">
                      {c.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" disabled={claimState.isLoading} onClick={() => moderateClaim({ claimId: c.id, status: 'approved' })}>{tc('approve')}</Button>
                          <Button size="sm" variant="outline" disabled={claimState.isLoading} onClick={() => moderateClaim({ claimId: c.id, status: 'rejected' })}>{tc('reject')}</Button>
                        </div>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                {!(claimsData?.items ?? []).length ? <TableRow><TableCell colSpan={5} className="text-muted-foreground">{t('claims.empty')}</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="stale" className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('stale.hint', { days: 45 })}</p>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>{t('stale.firm')}</TableHead><TableHead>{t('stale.city')}</TableHead><TableHead>{t('stale.lastSeen')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {(staleData?.items ?? []).map((i) => (
                  <TableRow key={i.id} className="cursor-pointer" onClick={() => setOpenId(i.id)}>
                    <TableCell className="font-medium">{i.name}</TableCell><TableCell>{i.citySlug || '—'}</TableCell>
                    <TableCell>{i.lastSeenAt ? new Date(i.lastSeenAt).toLocaleDateString('tr-TR') : '—'}</TableCell>
                  </TableRow>
                ))}
                {!(staleData?.items ?? []).length ? <TableRow><TableCell colSpan={3} className="text-muted-foreground">{t('stale.empty')}</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="etl" className="space-y-3">
          <div className="rounded-lg border p-4">
            <div className="mb-1 text-sm font-medium">{t('etl.title')}</div>
            <p className="mb-3 text-xs text-muted-foreground">{t('etl.hint')}</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_200px_auto_auto]">
              <div className="space-y-1.5"><Label className="text-xs">{t('etl.city')}</Label><Input value={etl.city} className="font-mono" placeholder="adana" onChange={(e) => setEtl({ ...etl, city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">{t('etl.type')}</Label>
                <Select value={etl.type} onValueChange={(v) => setEtl({ ...etl, type: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FIRM_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`types.${k}`)}</SelectItem>)}</SelectContent></Select></div>
              <Button variant="outline" className="self-end" disabled={etlState.isLoading} onClick={() => handleEtl(true)}><TestTube2 className="size-4" /> {t('etl.dryRun')}</Button>
              <Button className="self-end" disabled={etlState.isLoading} onClick={() => handleEtl(false)}><Play className="size-4" /> {etlState.isLoading ? t('etl.running') : t('etl.run')}</Button>
            </div>
            {lastRun ? <div className="mt-3 rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{lastRun}</div> : null}
          </div>
        </TabsContent>
      </Tabs>

      <FirmSheet firm={open ?? (openId ? (staleData?.items ?? []).find((i) => i.id === openId) as FirmAdminItem | undefined ?? null : null)} claims={allClaims?.items ?? []} onClose={() => setOpenId(null)} t={t} tc={tc} />
    </div>
  );
}
