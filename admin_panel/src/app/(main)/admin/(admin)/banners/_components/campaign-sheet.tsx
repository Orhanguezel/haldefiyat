'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Copy, Edit, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TranslateFn } from '@/i18n';
import type { AdSlotAdmin, BannerAdmin } from '@/integrations/endpoints/banners-admin-endpoints';
import { useDeleteBannerAdminMutation, useDuplicateBannerAdminMutation } from '@/integrations/hooks';
import { ctr, errorMessage, fmtCtr, LIFECYCLE_VARIANT, money, positionLabel, shortDate } from '../_lib/banner-meta';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold tabular-nums">{value}</div></div>;
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-3 border-b py-1.5 text-sm last:border-0"><span className="shrink-0 text-muted-foreground">{label}</span><span className="min-w-0 truncate text-right">{value}</span></div>;
}

type Props = { row: BannerAdmin | null; slots: AdSlotAdmin[]; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function CampaignSheet({ row, slots, onClose, t, tc }: Props) {
  const [remove, rm] = useDeleteBannerAdminMutation();
  const [duplicate, dup] = useDuplicateBannerAdminMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDuplicate() {
    if (!row) return;
    try {
      const res = await duplicate({ id: row.id }).unwrap();
      toast.success(t('toasts.duplicated'));
      window.location.assign(`/admin/banners/${res.data.id}`);
    } catch (err) { toast.error(errorMessage(err, tc('saveFailed'))); }
  }
  async function handleDelete() {
    if (!row) return;
    try {
      await remove({ id: row.id }).unwrap();
      toast.success(t('toasts.deleted'));
      setConfirmDelete(false);
      onClose();
    } catch (err) { toast.error(errorMessage(err, tc('saveFailed'))); }
  }

  const targets = (row?.targets ?? []).filter((x) => x.scopeType !== 'global');
  return (
    <Sheet open={Boolean(row)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {row ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-base leading-snug">{row.title}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-1.5">
                <Badge variant={LIFECYCLE_VARIANT[row.lifecycleStatus]} className="font-normal">{t(`lifecycles.${row.lifecycleStatus}`)}</Badge>
                <Badge variant="outline" className="font-normal">{t(`payments.${row.paymentStatus}`)}</Badge>
                <span>#{row.id}</span><span aria-hidden>·</span>
                <span>{row.advertiser || t('table.noAdvertiser')}</span>
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {row.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.imageUrl} alt={row.alt ?? ''} className="max-h-40 w-full rounded-lg border object-contain bg-muted/30" />
              ) : row.code ? <pre className="max-h-32 overflow-auto rounded-lg border bg-muted/40 p-3 text-[11px]">{row.code.slice(0, 600)}</pre> : null}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label={t('sheet.impressions')} value={row.impressions.toLocaleString('tr-TR')} />
                <Stat label={t('sheet.clicks')} value={row.clicks.toLocaleString('tr-TR')} />
                <Stat label={t('sheet.ctr')} value={fmtCtr(ctr(row))} />
                <Stat label={t('sheet.amount')} value={money(row.totalAmount)} />
              </div>
              <div>
                <Row label={t('sheet.slot')} value={`${positionLabel(slots, row.position)} · ${t('table.rowCol', { row: row.desktopRow, columns: row.desktopColumns })}`} />
                <Row label={t('sheet.period')} value={`${shortDate(row.startAt)} – ${shortDate(row.endAt)}`} />
                <Row label={t('sheet.device')} value={t(`devices.${row.device}`)} />
                <Row label={t('sheet.source')} value={`${t(`sources.${row.sourceType}`)}${row.listingId ? ` · #${row.listingId}` : ''}${row.firmId ? ` · firma #${row.firmId}` : ''}`} />
                <Row label={t('sheet.link')} value={row.linkUrl ? <a href={row.linkUrl} target="_blank" rel="noreferrer" className="hover:underline">{row.linkUrl}</a> : '—'} />
                <Row label={t('sheet.weight')} value={`${row.weight} · ${t(`performance.${row.performanceStatus}`)}`} />
                <Row label={t('sheet.limits')} value={[row.impressionLimit ? t('sheet.impressionLimit', { count: row.impressionLimit }) : null, row.clickLimit ? t('sheet.clickLimit', { count: row.clickLimit }) : null, row.dailyImpressionLimit ? t('sheet.dailyLimit', { count: row.dailyImpressionLimit }) : null].filter(Boolean).join(' · ') || '—'} />
                <Row label={t('sheet.paymentDue')} value={shortDate(row.paymentDueAt)} />
                <Row label={t('sheet.salesOwner')} value={row.salesOwner || '—'} />
                <Row label={t('sheet.invoice')} value={row.invoiceNumber || '—'} />
              </div>
              {targets.length ? <div className="flex flex-wrap gap-1">{targets.map((x, i) => <Badge key={`${x.scopeType}-${i}`} variant="outline" className="font-normal">{x.scopeType}: {x.scopeValue}</Badge>)}</div> : null}
              {row.notes ? <p className="rounded-md border bg-muted/40 p-3 text-sm">{row.notes}</p> : null}
              {row.cancellationReason ? <p className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-300">{row.cancellationReason}</p> : null}
            </div>
            <SheetFooter className="border-t px-6 py-3">
              <div className="flex w-full flex-wrap items-center gap-2">
                <Button asChild size="sm"><Link href={`/admin/banners/${row.id}`}><Edit className="size-3.5" /> {t('sheet.edit')}</Link></Button>
                <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={dup.isLoading}><Copy className="size-3.5" /> {t('sheet.duplicate')}</Button>
                {row.linkUrl ? <Button asChild size="sm" variant="ghost"><a href={row.linkUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" /> {tc('openPage')}</a></Button> : null}
                <span className="flex-1" />
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDelete(true)} disabled={rm.isLoading}><Trash2 className="size-3.5" /> {tc('delete')}</Button>
              </div>
            </SheetFooter>
            <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{t('sheet.deleteTitle')}</AlertDialogTitle><AlertDialogDescription>{t('sheet.deleteHint', { title: row.title })}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>{tc('giveUp')}</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>{tc('delete')}</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
