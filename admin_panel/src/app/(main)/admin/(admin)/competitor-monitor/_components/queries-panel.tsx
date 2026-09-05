'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { DiscoveryQuery } from '@/integrations/endpoints/competitor-monitor-admin-endpoints';
import { useGetCompetitorDiscoveryResultsAdminQuery } from '@/integrations/hooks';

function PosBadge({ pos, t }: { pos: number | null; t: TranslateFn }) {
  if (pos == null) return <Badge variant="destructive" className="font-normal">{t('queries.notRanked')}</Badge>;
  return <Badge variant={pos <= 3 ? 'default' : pos <= 10 ? 'secondary' : 'outline'} className="font-normal tabular-nums">#{pos}</Badge>;
}

type Props = { rows: DiscoveryQuery[]; runId: number | null; loading: boolean; t: TranslateFn; tc: TranslateFn };

/** Sorgu bazli gorunum: bizim pozisyon, GSC gosterim/tiklama, ilk 5 rakip; satir → tam 20 sonuc. */
export function QueriesPanel({ rows, runId, loading, t, tc }: Props) {
  const [open, setOpen] = useState<DiscoveryQuery | null>(null);
  const { data, isFetching } = useGetCompetitorDiscoveryResultsAdminQuery({ runId: runId ?? 0, query: open?.query }, { skip: !open || !runId });
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('discovery.empty')}</div>;
  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[260px]">{t('queries.query')}</TableHead>
            <TableHead className="w-32 text-right">{t('queries.impressions')}</TableHead>
            <TableHead className="w-24 text-right">{t('queries.clicks')}</TableHead>
            <TableHead className="w-28">{t('queries.ourPosition')}</TableHead>
            <TableHead className="min-w-[320px]">{t('queries.topDomains')}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((q) => (
              <TableRow key={q.query} onClick={() => setOpen(q)} className={`cursor-pointer ${open?.query === q.query ? 'bg-primary/5' : ''}`}>
                <TableCell className="py-2.5 font-medium">{q.query}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{Number(q.impressions).toLocaleString('tr-TR')}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{Number(q.clicks).toLocaleString('tr-TR')}</TableCell>
                <TableCell><PosBadge pos={q.our_position} t={t} /></TableCell>
                <TableCell><div className="flex flex-wrap gap-1">{(q.top_domains ?? '').split(',').filter(Boolean).map((d, i) => <Badge key={`${d}-${i}`} variant="outline" className="font-normal">{i + 1}. {d}</Badge>)}</div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Sheet open={Boolean(open)} onOpenChange={(v) => { if (!v) setOpen(null); }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base">“{open.query}”</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5"><PosBadge pos={open.our_position} t={t} /><span>{t('queries.impressionsLine', { impressions: Number(open.impressions).toLocaleString('tr-TR'), clicks: Number(open.clicks).toLocaleString('tr-TR') })}</span></SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {isFetching ? <p className="text-sm text-muted-foreground">{tc('loading')}</p> : (
                  <ol className="divide-y rounded-lg border text-sm">
                    {(data?.items ?? []).map((it) => (
                      <li key={`${it.position}-${it.url}`} className={`flex gap-3 px-3 py-2 ${it.is_ours ? 'bg-emerald-500/10' : ''}`}>
                        <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">#{it.position}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5"><span className="truncate font-medium">{it.title || it.domain}</span>{it.is_ours ? <Badge className="font-normal">{t('queries.us')}</Badge> : null}{it.page === 2 ? <Badge variant="outline" className="font-normal">{t('queries.page2')}</Badge> : null}</div>
                          <a href={it.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-muted-foreground hover:underline">{it.url}</a>
                          {it.snippet ? <p className="line-clamp-2 text-xs text-muted-foreground">{it.snippet}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
