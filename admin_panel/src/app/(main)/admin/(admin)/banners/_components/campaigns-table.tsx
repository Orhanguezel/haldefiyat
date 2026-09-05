'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import type { AdSlotAdmin, BannerAdmin } from '@/integrations/endpoints/banners-admin-endpoints';
import { ctr, daysUntil, fmtCtr, LIFECYCLE_TONE, LIFECYCLE_VARIANT, money, positionLabel, shortDate } from '../_lib/banner-meta';

type Props = { rows: BannerAdmin[]; slots: AdSlotAdmin[]; loading: boolean; activeId?: number; onSelect: (row: BannerAdmin) => void; t: TranslateFn; tc: TranslateFn };

export function CampaignsTable({ rows, slots, loading, activeId, onSelect, t, tc }: Props) {
  if (loading) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('loading')}</div>;
  if (!rows.length) return <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{tc('emptyFilter')}</div>;
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="min-w-[300px]">{t('table.campaign')}</TableHead>
            <TableHead className="min-w-[180px]">{t('table.slot')}</TableHead>
            <TableHead className="w-40">{t('table.period')}</TableHead>
            <TableHead className="w-36 text-right">{t('table.performance')}</TableHead>
            <TableHead className="w-28 text-right">{t('table.amount')}</TableHead>
            <TableHead className="w-32">{t('table.status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((b) => {
            const left = daysUntil(b.endAt);
            return (
              <TableRow key={b.id} onClick={() => onSelect(b)} className={`cursor-pointer ${activeId === b.id ? 'bg-primary/5' : ''}`}>
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-3">
                    {b.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.imageUrl} alt="" className="h-9 w-14 shrink-0 rounded border object-cover" />
                    ) : <div className={`h-9 w-14 shrink-0 rounded border bg-muted text-center text-[10px] leading-9 text-muted-foreground`}>{t(`types.${b.type}`)}</div>}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`size-2 shrink-0 rounded-full ${LIFECYCLE_TONE[b.lifecycleStatus]}`} />
                        <span className="truncate font-medium">{b.title}</span>
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{b.advertiser || t('table.noAdvertiser')} · {t(`sources.${b.sourceType}`)} · {t(`devices.${b.device}`)}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="truncate">{positionLabel(slots, b.position)}</div>
                  <div className="text-xs text-muted-foreground">{t('table.rowCol', { row: b.desktopRow, columns: b.desktopColumns })}</div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="whitespace-nowrap">{shortDate(b.startAt)} – {shortDate(b.endAt)}</div>
                  {b.lifecycleStatus === 'live' && left != null ? <div className={`text-xs ${left <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>{left <= 0 ? tc('endsToday') : tc('daysLeft', { count: left })}</div> : null}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  <div>{b.impressions.toLocaleString('tr-TR')} / {b.clicks.toLocaleString('tr-TR')}</div>
                  <div className="text-xs text-muted-foreground">{fmtCtr(ctr(b))}</div>
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">
                  <div>{money(b.totalAmount)}</div>
                  <div className={`text-xs ${b.paymentStatus === 'paid' || b.paymentStatus === 'waived' ? 'text-emerald-600' : 'text-muted-foreground'}`}>{t(`payments.${b.paymentStatus}`)}</div>
                </TableCell>
                <TableCell><Badge variant={LIFECYCLE_VARIANT[b.lifecycleStatus]} className="font-normal">{t(`lifecycles.${b.lifecycleStatus}`)}</Badge></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
