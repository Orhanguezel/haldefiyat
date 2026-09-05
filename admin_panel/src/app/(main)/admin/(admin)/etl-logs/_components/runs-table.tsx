'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { EtlLogItem } from '@/integrations/endpoints/etl-logs-admin-endpoints';
import { formatDateTime, formatDuration, isEmptyOk, STATUS_TONE } from '../_lib/etl-meta';

type Props = { rows: EtlLogItem[]; loading: boolean; activeId?: number; onSelect: (row: EtlLogItem) => void; t: TranslateFn; tc: TranslateFn };

export function RunsTable({ rows, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('emptyFilter')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[220px]">{t('table.source')}</TableHead>
            <TableHead className="w-28">{t('table.runDate')}</TableHead>
            <TableHead className="w-40 text-right">{t('table.rows')}</TableHead>
            <TableHead className="w-24 text-right">{t('table.duration')}</TableHead>
            <TableHead className="min-w-[260px]">{t('table.note')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} onClick={() => onSelect(r)} className={`cursor-pointer ${activeId === r.id ? 'bg-primary/5' : ''}`}>
              <TableCell className="py-2">
                <div className="flex items-center gap-2.5">
                  <span className={`size-2.5 shrink-0 rounded-full ${STATUS_TONE[r.status]} ${isEmptyOk(r) ? 'opacity-40' : ''}`} title={t(`statuses.${r.status}`)} />
                  <div className="min-w-0">
                    <div className="truncate font-mono text-xs font-medium">{r.sourceApi}</div>
                    <div className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-sm tabular-nums">{String(r.runDate).slice(0, 10)}</TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                <span className={r.rowsInserted ? 'font-medium' : 'text-muted-foreground'}>{r.rowsInserted}</span>
                <span className="text-muted-foreground"> / {r.rowsFetched}</span>
                {r.rowsSkipped ? <span className="text-xs text-muted-foreground"> · {t('table.skipped', { count: r.rowsSkipped })}</span> : null}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">{formatDuration(r.durationMs)}</TableCell>
              <TableCell className={`text-xs ${r.status === 'error' ? 'text-rose-600' : 'text-muted-foreground'}`}>
                <span className="line-clamp-1">{r.errorMsg || (isEmptyOk(r) ? t('table.emptyOk') : '—')}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
