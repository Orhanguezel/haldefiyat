'use client';

import { Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import { formatDateTime, type LeadRow } from '../_lib/lead-meta';

type Props = { rows: LeadRow[]; loading: boolean; activeId?: number; onSelect: (row: LeadRow) => void; t: TranslateFn; tc: TranslateFn };

export function LeadsTable({ rows, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('emptyFilter')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-40">{t('table.date')}</TableHead>
            <TableHead className="min-w-[200px]">{t('table.sender')}</TableHead>
            <TableHead className="min-w-[320px]">{t('table.message')}</TableHead>
            <TableHead className="min-w-[180px]">{t('table.firm')}</TableHead>
            <TableHead className="w-28">{t('table.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} onClick={() => onSelect(r)} className={`cursor-pointer [&>td]:align-top ${activeId === r.id ? 'bg-primary/5' : ''}`}>
              <TableCell className="py-2.5 text-sm">
                <div className="whitespace-nowrap">{formatDateTime(r.createdAt)}</div>
                <div className="text-xs text-muted-foreground">{r.ageDays === 0 ? tc('today') : r.ageDays === 1 ? tc('yesterday') : r.ageDays != null ? tc('daysAgo', { count: r.ageDays }) : ''}</div>
              </TableCell>
              <TableCell className="py-2.5">
                <div className="font-medium">{r.parsed.name || t('table.anonymous')}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {r.parsed.phone ? <span className="inline-flex items-center gap-1"><Phone className="size-3" />{r.parsed.phone}</span> : null}
                  {r.parsed.email ? <span className="inline-flex items-center gap-1 truncate"><Mail className="size-3" />{r.parsed.email}</span> : null}
                  {!r.parsed.phone && !r.parsed.email ? <span>{t('table.noContact')}</span> : null}
                </div>
              </TableCell>
              <TableCell className="py-2.5 text-sm">
                <p className="line-clamp-2 whitespace-pre-line leading-5">{r.parsed.message || '—'}</p>
              </TableCell>
              <TableCell className="py-2.5 text-sm">
                <div className="truncate">{r.firmName}</div>
                <div className="text-xs text-muted-foreground">{r.citySlug ?? ''}{r.dealType !== 'reklam' ? ` · ${t(`dealTypes.${r.dealType}`, undefined, r.dealType)}` : ''}</div>
              </TableCell>
              <TableCell className="py-2.5">
                <Badge variant={r.status === 'lead' ? 'default' : r.status === 'lost' ? 'secondary' : 'outline'} className="font-normal">
                  {t(`statuses.${r.status}`, undefined, r.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
