'use client';

import { useState } from 'react';
import { ExternalLink, Pause, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { CompetitorSite } from '@/integrations/endpoints/competitor-monitor-admin-endpoints';
import { useGetCompetitorHistoryAdminQuery, useRunCompetitorCheckAdminMutation, useToggleCompetitorSiteAdminMutation } from '@/integrations/hooks';
import { formatDateTime, parseFeatures } from '../_lib/competitor-meta';

function History({ siteKey, t }: { siteKey: string; t: TranslateFn }) {
  const { data, isLoading } = useGetCompetitorHistoryAdminQuery({ siteKey, limit: 12 });
  const items = data?.items ?? [];
  if (isLoading) return <p className="text-xs text-muted-foreground">{t('sites.historyLoading')}</p>;
  if (!items.length) return <p className="text-xs text-muted-foreground">{t('sites.noHistory')}</p>;
  return (
    <ul className="divide-y rounded-lg border text-xs">
      {items.map((snap, idx) => {
        const prev = items[idx + 1];
        const delta = prev?.productCount != null && snap.productCount != null ? snap.productCount - prev.productCount : null;
        const now = parseFeatures(snap.detectedFeatures); const before = parseFeatures(prev?.detectedFeatures ?? null);
        const added = now.filter((f) => !before.includes(f)); const removed = before.filter((f) => !now.includes(f));
        return (
          <li key={snap.id} className="space-y-1 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-muted-foreground">{formatDateTime(snap.checkedAt)}</span>
              <Badge variant={snap.scrapeOk === 1 ? 'default' : 'destructive'} className="px-1 py-0 text-[10px]">{snap.scrapeOk === 1 ? 'OK' : t('sites.error')}</Badge>
              <span className="text-muted-foreground">{t('sites.products', { count: snap.productCount ?? '—' })}{delta ? <span className={delta > 0 ? 'ml-1 text-emerald-600' : 'ml-1 text-rose-600'}>({delta > 0 ? '+' : ''}{delta})</span> : null}{snap.marketCount != null ? ` · ${t('sites.markets', { count: snap.marketCount })}` : ''}</span>
            </div>
            {added.length || removed.length ? <div className="flex flex-wrap gap-1">{added.map((f) => <Badge key={`a-${f}`} className="bg-emerald-100 px-1 py-0 text-[10px] text-emerald-700 hover:bg-emerald-100">+ {f}</Badge>)}{removed.map((f) => <Badge key={`r-${f}`} className="bg-rose-100 px-1 py-0 text-[10px] text-rose-700 hover:bg-rose-100">− {f}</Badge>)}</div> : null}
            {snap.diffSummary ? <p className="italic text-muted-foreground">{snap.diffSummary}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

type Props = { sites: CompetitorSite[]; loading: boolean; t: TranslateFn; tc: TranslateFn };

export function SitesPanel({ sites, loading, t, tc }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [runCheck, run] = useRunCompetitorCheckAdminMutation();
  const [toggle] = useToggleCompetitorSiteAdminMutation();
  const open = sites.find((s) => s.siteKey === openKey) ?? null;
  async function check(siteKey?: string) {
    try { await runCheck(siteKey ? { siteKey } : {}).unwrap(); toast.success(t('sites.checked')); } catch { toast.error(tc('saveFailed')); }
  }
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><Button size="sm" onClick={() => check()} disabled={run.isLoading}><RefreshCw className={`size-3.5 ${run.isLoading ? 'animate-spin' : ''}`} /> {run.isLoading ? t('sites.checking') : t('sites.checkAll')}</Button></div>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead className="min-w-[260px]">{t('sites.table.site')}</TableHead><TableHead className="w-36">{t('sites.table.lastCheck')}</TableHead><TableHead className="w-28 text-right">{t('sites.table.products')}</TableHead><TableHead className="min-w-[220px]">{t('sites.table.features')}</TableHead><TableHead className="min-w-[200px]">{t('sites.table.change')}</TableHead><TableHead className="w-24">{t('sites.table.status')}</TableHead></TableRow></TableHeader>
          <TableBody>
            {sites.map((s) => { const snap = s.lastSnapshot; const features = parseFeatures(snap?.detectedFeatures ?? null); return (
              <TableRow key={s.siteKey} onClick={() => setOpenKey(s.siteKey)} className={`cursor-pointer ${openKey === s.siteKey ? 'bg-primary/5' : ''}`}>
                <TableCell className="py-2.5"><div className="font-medium">{s.displayName}</div><div className="truncate text-xs text-muted-foreground">{s.url.replace(/^https?:\/\//, '')}</div></TableCell>
                <TableCell className="text-sm"><div>{formatDateTime(snap?.checkedAt)}</div>{snap && snap.scrapeOk !== 1 ? <div className="text-xs text-rose-600">{t('sites.error')}</div> : null}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{snap?.productCount ?? '—'}</TableCell>
                <TableCell><div className="flex flex-wrap gap-1">{features.slice(0, 4).map((f) => <Badge key={f} variant="secondary" className="px-1 py-0 text-[10px]">{f}</Badge>)}{features.length > 4 ? <Badge variant="secondary" className="px-1 py-0 text-[10px]">+{features.length - 4}</Badge> : null}</div></TableCell>
                <TableCell className="text-xs text-muted-foreground"><span className="line-clamp-2">{snap?.diffSummary ?? '—'}</span></TableCell>
                <TableCell><Badge variant={s.isActive ? 'default' : 'secondary'} className="font-normal">{s.isActive ? tc('active') : tc('passive')}</Badge></TableCell>
              </TableRow>
            ); })}
            {!sites.length ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{t('sites.empty')}</TableCell></TableRow> : null}
          </TableBody>
        </Table>
      </div>
      <Sheet open={Boolean(open)} onOpenChange={(v) => { if (!v) setOpenKey(null); }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base">{open.displayName}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5"><Badge variant={open.isActive ? 'default' : 'secondary'} className="font-normal">{open.isActive ? tc('active') : tc('passive')}</Badge><a href={open.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">{open.url.replace(/^https?:\/\//, '')} <ExternalLink className="size-3" /></a></SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
                <div className="flex flex-wrap gap-1">{parseFeatures(open.lastSnapshot?.detectedFeatures ?? null).map((f) => <Badge key={f} variant="secondary" className="font-normal">{f}</Badge>)}</div>
                <div className="text-xs text-muted-foreground">{t('sites.historyTitle')}</div>
                <History siteKey={open.siteKey} t={t} />
              </div>
              <SheetFooter className="border-t px-6 py-3">
                <div className="flex w-full items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggle({ siteKey: open.siteKey, isActive: open.isActive ? 0 : 1 })}>{open.isActive ? <><Pause className="size-3.5" /> {t('sites.pause')}</> : <><Play className="size-3.5" /> {t('sites.resume')}</>}</Button>
                  <span className="flex-1" />
                  <Button size="sm" onClick={() => check(open.siteKey)} disabled={run.isLoading}><RefreshCw className={`size-3.5 ${run.isLoading ? 'animate-spin' : ''}`} /> {t('sites.checkOne')}</Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
