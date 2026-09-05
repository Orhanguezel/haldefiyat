'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { DiscoveryDomain } from '@/integrations/endpoints/competitor-monitor-admin-endpoints';
import { domainKind, n } from '../_lib/competitor-meta';

type Props = { rows: DiscoveryDomain[]; totalQueries: number; loading: boolean; activeKey?: string; onSelect: (row: DiscoveryDomain) => void; t: TranslateFn; tc: TranslateFn };

export function DiscoveryTable({ rows, totalQueries, loading, activeKey, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('discovery.empty')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[300px]">{t('discovery.table.domain')}</TableHead>
            <TableHead className="w-40">{t('discovery.table.coverage')}</TableHead>
            <TableHead className="w-32 text-right">{t('discovery.table.avgPosition')}</TableHead>
            <TableHead className="w-28 text-right">{t('discovery.table.top3')}</TableHead>
            <TableHead className="w-32 text-right">{t('discovery.table.ahead')}</TableHead>
            <TableHead className="w-32">{t('discovery.table.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const kind = domainKind(r.domain);
            const share = totalQueries ? Math.round((n(r.queries) / totalQueries) * 100) : 0;
            const ahead = n(r.ahead_of_us);
            return (
              <TableRow key={r.domain} onClick={() => onSelect(r)} className={`cursor-pointer ${activeKey === r.domain ? 'bg-primary/5' : ''}`}>
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-1.5"><span className="truncate font-medium">{r.domain}</span>{kind !== 'other' ? <Badge variant="outline" className="font-normal">{t(`kinds.${kind}`)}</Badge> : null}</div>
                  <div className="truncate text-xs text-muted-foreground">{r.sample_title || r.sample_url || '—'}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm tabular-nums">{t('discovery.table.queriesOf', { count: n(r.queries), total: totalQueries })}</div>
                  <div className="h-1.5 w-full overflow-hidden rounded bg-muted"><div className="h-full rounded bg-primary/60" style={{ width: `${share}%` }} /></div>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">{Number(r.avg_position).toFixed(1)} <span className="text-xs text-muted-foreground">· {t('discovery.table.best', { pos: r.best_position })}</span></TableCell>
                <TableCell className="text-right text-sm tabular-nums">{n(r.top3)} <span className="text-xs text-muted-foreground">/ {n(r.page1)}</span></TableCell>
                <TableCell className={`text-right text-sm tabular-nums ${ahead ? 'text-rose-600' : 'text-muted-foreground'}`}>{ahead}</TableCell>
                <TableCell>{n(r.tracked) ? <Badge className="font-normal">{t('discovery.table.tracked')}</Badge> : <Badge variant="outline" className="font-normal">{t('discovery.table.untracked')}</Badge>}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
