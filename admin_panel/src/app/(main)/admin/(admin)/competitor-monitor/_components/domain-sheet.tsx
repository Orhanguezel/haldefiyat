'use client';

import { ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TranslateFn } from '@/i18n';
import type { DiscoveryDomain } from '@/integrations/endpoints/competitor-monitor-admin-endpoints';
import { useAddCompetitorSiteAdminMutation, useGetCompetitorDiscoveryResultsAdminQuery } from '@/integrations/hooks';
import { domainKind, n } from '../_lib/competitor-meta';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold tabular-nums">{value}</div></div>;
}

type Props = { row: DiscoveryDomain | null; runId: number | null; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function DomainSheet({ row, runId, onClose, t, tc }: Props) {
  const { data, isFetching } = useGetCompetitorDiscoveryResultsAdminQuery({ runId: runId ?? 0, domain: row?.domain }, { skip: !row || !runId });
  const [addSite, add] = useAddCompetitorSiteAdminMutation();
  const items = data?.items ?? [];
  async function track() {
    if (!row) return;
    try { await addSite({ domain: row.domain, url: row.sample_url ? `https://${row.domain}` : undefined }).unwrap(); toast.success(t('discovery.tracked', { domain: row.domain })); }
    catch { toast.error(tc('saveFailed')); }
  }
  return (
    <Sheet open={Boolean(row)} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {row ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-base">{row.domain}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-normal">{t(`kinds.${domainKind(row.domain)}`)}</Badge>
                {n(row.tracked) ? <Badge className="font-normal">{t('discovery.table.tracked')}</Badge> : null}
                <span className="truncate">{row.sample_title}</span>
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label={t('discovery.sheet.queries')} value={n(row.queries)} />
                <Stat label={t('discovery.table.avgPosition')} value={Number(row.avg_position).toFixed(1)} />
                <Stat label={t('discovery.table.top3')} value={n(row.top3)} />
                <Stat label={t('discovery.table.ahead')} value={<span className={n(row.ahead_of_us) ? 'text-rose-600' : ''}>{n(row.ahead_of_us)}</span>} />
              </div>
              <div>
                <div className="mb-2 text-xs text-muted-foreground">{t('discovery.sheet.perQuery')}</div>
                {isFetching ? <p className="text-sm text-muted-foreground">{tc('loading')}</p> : (
                  <ul className="divide-y rounded-lg border text-sm">
                    {items.map((it, i) => {
                      const ours = it.our_position ?? null;
                      const ahead = ours == null || it.position < ours;
                      return (
                        <li key={`${it.query}-${i}`} className="space-y-0.5 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">{it.query}</span>
                            <span className="shrink-0 text-xs tabular-nums">
                              <span className={ahead ? 'text-rose-600' : 'text-emerald-600'}>#{it.position}</span>
                              <span className="text-muted-foreground"> · {t('discovery.sheet.us')}: {ours ?? t('discovery.sheet.notRanked')}</span>
                              {it.impressions ? <span className="text-muted-foreground"> · {t('discovery.sheet.impressions', { count: it.impressions })}</span> : null}
                            </span>
                          </div>
                          <a href={it.url} target="_blank" rel="noreferrer" className="block truncate text-xs text-muted-foreground hover:underline">{it.title || it.url}</a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
            <SheetFooter className="border-t px-6 py-3">
              <div className="flex w-full items-center gap-2">
                <Button asChild size="sm" variant="outline"><a href={row.sample_url ?? `https://${row.domain}`} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" /> {tc('openPage')}</a></Button>
                <span className="flex-1" />
                {!n(row.tracked) ? <Button size="sm" onClick={track} disabled={add.isLoading}><Eye className="size-3.5" /> {t('discovery.track')}</Button> : null}
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
