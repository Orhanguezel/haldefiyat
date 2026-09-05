'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { PressContact } from '@/integrations/endpoints/admin/press-admin-endpoints';
import { formatDate, STATUS_VARIANT } from '../_lib/press-meta';

type Props = { rows: PressContact[]; loading: boolean; activeId?: number; onSelect: (row: PressContact) => void; t: TranslateFn; tc: TranslateFn };

export function ContactsTable({ rows, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('emptyFilter')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[260px]">{t('table.organization')}</TableHead>
            <TableHead className="min-w-[220px]">{t('table.contact')}</TableHead>
            <TableHead className="w-32">{t('table.type')}</TableHead>
            <TableHead className="min-w-[160px]">{t('table.tags')}</TableHead>
            <TableHead className="w-32">{t('table.lastContact')}</TableHead>
            <TableHead className="w-28">{t('table.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id} onClick={() => onSelect(c)} className={`cursor-pointer ${activeId === c.id ? 'bg-primary/5' : ''}`}>
              <TableCell className="py-2.5">
                <div className="truncate font-medium">{c.organization}</div>
                <div className="text-xs text-muted-foreground">{c.city || '—'}</div>
              </TableCell>
              <TableCell className="py-2.5 text-sm">
                <div className="truncate">{c.contactName || t('table.noName')}</div>
                <div className="truncate text-xs text-muted-foreground">{c.email}{c.phone ? ` · ${c.phone}` : ''}</div>
              </TableCell>
              <TableCell className="text-sm">{t(`types.${c.publicationType}`, undefined, c.publicationType)}</TableCell>
              <TableCell><div className="flex flex-wrap gap-1">{c.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>)}{c.tags.length > 3 ? <span className="text-xs text-muted-foreground">+{c.tags.length - 3}</span> : null}</div></TableCell>
              <TableCell className="text-sm text-muted-foreground">{formatDate(c.lastContactedAt)}</TableCell>
              <TableCell><Badge variant={STATUS_VARIANT[c.status]} className="font-normal">{t(`statuses.${c.status}`)}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
