'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { FirmAdminItem } from '@/integrations/endpoints/firms-admin-endpoints';
import { daysSince, firmStatus } from '../_lib/firm-meta';

type Props = { items: FirmAdminItem[]; loading: boolean; activeId?: number; onSelect: (item: FirmAdminItem) => void; t: TranslateFn; tc: TranslateFn };

export function FirmsTable({ items, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!items.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('table.empty')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[280px]">{t('table.firm')}</TableHead>
            <TableHead className="w-28">{t('table.type')}</TableHead>
            <TableHead className="w-40">{t('table.location')}</TableHead>
            <TableHead className="w-40">{t('table.phone')}</TableHead>
            <TableHead className="min-w-[160px]">{t('table.status')}</TableHead>
            <TableHead className="w-32">{t('table.lastSeen')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const status = firmStatus(item);
            const age = daysSince(item.lastSeenAt);
            return (
              <TableRow key={item.id} onClick={() => onSelect(item)} className={`cursor-pointer ${activeId === item.id ? 'bg-primary/5' : ''}`}>
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-3">
                    {item.photoUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={item.photoUrl} alt="" className="size-9 shrink-0 rounded-md border object-cover" />
                      : <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-xs font-medium text-muted-foreground">{item.name.slice(0, 1).toLocaleUpperCase('tr')}</div>}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{item.name}</span>
                        {item.sponsorshipTier ? <Badge className="font-normal">{t('table.sponsor')}</Badge> : null}
                        {item.source === 'user' ? <Badge variant="secondary" className="font-normal">{t('table.member')}</Badge> : null}
                      </div>
                      <div className="truncate text-xs text-muted-foreground"><span className="font-mono">{item.slug}</span>{item.contactPerson ? ` · ${item.contactPerson}` : ''}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{t(`types.${item.firmType}`)}</TableCell>
                <TableCell className="text-sm">{item.citySlug || '—'}{item.districtSlug ? <span className="text-muted-foreground"> / {item.districtSlug}</span> : null}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.phone || '—'}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'} className="font-normal">{t(`status.${status}`)}</Badge>
                    {item.claimStatus === 'pending' ? <Badge variant="outline" className="border-amber-500/50 font-normal text-amber-700">{t('table.claimPending')}</Badge> : null}
                    {item.claimStatus === 'verified' ? <Badge variant="outline" className="font-normal">{t('table.owned')}</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {age == null ? '—' : age === 0 ? tc('today') : age === 1 ? tc('yesterday') : <span className={age > 45 ? 'text-rose-600' : ''}>{tc('daysAgo', { count: age })}</span>}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
