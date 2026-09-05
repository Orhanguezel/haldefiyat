'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import { HEALTH_TONE, type MarketRow } from '../_lib/market-meta';

function shortDate(value?: string | null) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Props = { rows: MarketRow[]; loading: boolean; activeId?: number; onSelect: (row: MarketRow) => void; t: TranslateFn; tc: TranslateFn };

export function MarketsTable({ rows, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('table.empty')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[260px]">{t('table.market')}</TableHead>
            <TableHead className="w-24">{t('table.type')}</TableHead>
            <TableHead className="w-40">{t('table.lastData')}</TableHead>
            <TableHead className="min-w-[200px]">{t('table.coverage30')}</TableHead>
            <TableHead className="min-w-[160px]">{t('table.source')}</TableHead>
            <TableHead className="min-w-[140px]">{t('table.contact')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} onClick={() => onSelect(r)} className={`cursor-pointer ${activeId === r.id ? 'bg-primary/5' : ''}`}>
              <TableCell className="py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`size-2.5 shrink-0 rounded-full ${HEALTH_TONE[r.health]}`} title={t(`sheet.health.${r.health}`)} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{r.name}</span>
                      {!r.isActive ? <Badge variant="secondary" className="font-normal">{t('table.passive')}</Badge> : null}
                      {r.seoIndex === 0 || r.seoIndex === false ? <Badge variant="outline" className="font-normal">{t('table.noindex')}</Badge> : null}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{r.cityName} · <span className="font-mono">{r.slug}</span></div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm">{t(`types.${r.marketType ?? 'hal'}`)}</TableCell>
              <TableCell>
                {r.stats?.lastDate ? (
                  <>
                    <div className="text-sm whitespace-nowrap">{shortDate(r.stats.lastDate)}</div>
                    <div className={`text-xs ${r.health === 'dry' ? 'text-rose-600' : r.health === 'stale' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      {r.ageDays === 0 ? tc('today') : r.ageDays === 1 ? tc('yesterday') : tc('daysAgo', { count: r.ageDays ?? 0 })}
                    </div>
                  </>
                ) : <span className="text-xs text-muted-foreground">{t('table.noData')}</span>}
              </TableCell>
              <TableCell className="text-sm">
                {r.stats?.rows30 ? (
                  <span className="tabular-nums">
                    {t('table.rows30', { count: r.stats.rows30.toLocaleString('tr-TR') })} · {t('table.products30', { count: r.stats.products30 })}
                    <span className="text-muted-foreground"> · {t('table.days30', { count: r.stats.days30 })}</span>
                  </span>
                ) : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell><span className="font-mono text-xs text-muted-foreground">{r.sourceKey || '—'}</span></TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {r.phone ? <div>{r.phone}</div> : null}
                {r.hours ? <div>{r.hours}</div> : null}
                {!r.phone && !r.hours ? '—' : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
