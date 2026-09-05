'use client';

import { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TranslateFn } from '@/i18n';
import type { EtlLogItem, EtlSourceItem } from '@/integrations/endpoints/etl-logs-admin-endpoints';
import { useRunEtlAdminMutation } from '@/integrations/hooks';
import { formatDateTime, formatDuration, isEmptyOk } from '../_lib/etl-meta';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold tabular-nums">{value}</div></div>;
}

type Props = { row: EtlLogItem | null; history: EtlLogItem[]; source?: EtlSourceItem; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function RunSheet({ row, history, source, onClose, t, tc }: Props) {
  const [run, state] = useRunEtlAdminMutation();
  const [date, setDate] = useState('');

  async function retry(target?: string) {
    if (!row) return;
    try {
      const res = await run({ source: row.sourceApi, date: target || undefined }).unwrap();
      if (res.ok === false) toast.error(res.error ?? t('sheet.runFailed'));
      else toast.success(t('sheet.runDone'));
    } catch (err) {
      const e = err as { data?: { error?: { message?: string } } };
      toast.error(e.data?.error?.message ?? t('sheet.runFailed'));
    }
  }

  return (
    <Sheet open={Boolean(row)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {row ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="font-mono text-base">{row.sourceApi}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-1.5">
                <Badge variant={row.status === 'error' ? 'destructive' : row.status === 'partial' ? 'secondary' : 'default'} className="font-normal">{t(`statuses.${row.status}`)}</Badge>
                {isEmptyOk(row) ? <Badge variant="outline" className="font-normal">{t('table.emptyOk')}</Badge> : null}
                <span>#{row.id}</span><span aria-hidden>·</span>
                <span>{t('sheet.runDate', { date: String(row.runDate).slice(0, 10) })}</span><span aria-hidden>·</span>
                <span>{formatDateTime(row.createdAt)}</span>
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5 text-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label={t('sheet.fetched')} value={row.rowsFetched} />
                <Stat label={t('sheet.inserted')} value={row.rowsInserted} />
                <Stat label={t('sheet.skipped')} value={row.rowsSkipped} />
                <Stat label={t('sheet.duration')} value={formatDuration(row.durationMs)} />
              </div>
              <div>
                <div className="mb-1 text-xs text-muted-foreground">{t('sheet.message')}</div>
                <pre className={`whitespace-pre-wrap break-words rounded-md border p-3 font-mono text-xs leading-5 ${row.status === 'error' ? 'border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300' : 'bg-muted/40'}`}>
                  {row.errorMsg || t('sheet.noMessage')}
                </pre>
              </div>
              {source ? (
                <div className="grid gap-1 rounded-md border p-3 text-xs">
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t('sheet.sourceEnabled')}</span><span>{source.enabled ? tc('yes') : tc('no')}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t('sheet.market')}</span><span className="font-mono">{source.marketSlug}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">URL</span><a href={source.baseUrl} target="_blank" rel="noreferrer" className="truncate font-mono hover:underline">{source.baseUrl}</a></div>
                </div>
              ) : <p className="text-xs text-muted-foreground">{t('sheet.noSource')}</p>}
              <div>
                <div className="mb-2 text-xs text-muted-foreground">{t('sheet.history', { count: history.length })}</div>
                <ul className="divide-y rounded-md border">
                  {history.map((h) => (
                    <li key={h.id} className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs ${h.id === row.id ? 'bg-primary/5' : ''}`}>
                      <span className="tabular-nums">{String(h.runDate).slice(0, 10)}</span>
                      <span className="text-muted-foreground">{formatDateTime(h.createdAt)}</span>
                      <span className="tabular-nums">{h.rowsInserted} / {h.rowsFetched}</span>
                      <Badge variant={h.status === 'error' ? 'destructive' : h.status === 'partial' ? 'secondary' : 'outline'} className="font-normal">{t(`statuses.${h.status}`)}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <SheetFooter className="border-t px-6 py-3">
              <div className="flex w-full flex-wrap items-center gap-2">
                <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
                <Button variant="outline" size="sm" onClick={() => retry(date)} disabled={state.isLoading || !date}>
                  <Play className="size-3.5" /> {t('sheet.runForDate')}
                </Button>
                <Button size="sm" className="ml-auto" onClick={() => retry(String(row.runDate).slice(0, 10))} disabled={state.isLoading}>
                  <RefreshCw className={`size-3.5 ${state.isLoading ? 'animate-spin' : ''}`} /> {state.isLoading ? t('sheet.running') : t('sheet.retry')}
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
