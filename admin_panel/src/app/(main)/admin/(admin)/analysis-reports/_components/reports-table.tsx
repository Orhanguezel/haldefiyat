'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { AnalysisReportAdmin } from '@/integrations/endpoints/analysis-reports-admin-endpoints';
import { formatDate, STATUS_VARIANT, wordCount } from '../_lib/report-meta';

type Props = { rows: AnalysisReportAdmin[]; loading: boolean; activeId?: number; onSelect: (row: AnalysisReportAdmin) => void; t: TranslateFn; tc: TranslateFn };

export function ReportsTable({ rows, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('emptyFilter')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[360px]">{t('table.title')}</TableHead>
            <TableHead className="w-32">{t('table.week')}</TableHead>
            <TableHead className="w-28 text-right">{t('table.records')}</TableHead>
            <TableHead className="w-24 text-right">{t('table.words')}</TableHead>
            <TableHead className="w-28">{t('table.status')}</TableHead>
            <TableHead className="w-32">{t('table.published')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const words = wordCount(r.icerik);
            return (
              <TableRow key={r.id} onClick={() => onSelect(r)} className={`cursor-pointer ${activeId === r.id ? 'bg-primary/5' : ''}`}>
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{r.baslik}</span>
                    {r.source === 'auto' ? <Badge variant="outline" className="font-normal">{t('sources.auto')}</Badge> : null}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">/analiz/{r.slug} · {formatDate(r.tarih)}{r.yazar ? ` · ${r.yazar}` : ''}</div>
                </TableCell>
                <TableCell className="text-sm">{r.hafta}</TableCell>
                <TableCell className="text-right text-sm tabular-nums">{r.totalRecords.toLocaleString('tr-TR')}</TableCell>
                <TableCell className={`text-right text-sm tabular-nums ${words < 300 ? 'text-amber-600' : ''}`}>{words}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[r.status]} className="font-normal">{t(`statuses.${r.status}`)}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(r.publishedAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
