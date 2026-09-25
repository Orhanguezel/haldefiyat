'use client';
import { AD_FORMATS, adFormat, type AdFormat } from '../../../../../../../../shared/banner-layout.mjs';
import AdFormatPreview from './ad-format-preview';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Copy, Edit, ExternalLink, Monitor, Pause, Play, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TranslateFn } from '@/i18n';
import type { AdSlotAdmin, BannerAdmin } from '@/integrations/endpoints/banners-admin-endpoints';
import { useDeleteBannerAdminMutation, useDuplicateBannerAdminMutation, useUpdateBannerAdminMutation } from '@/integrations/hooks';
import { ctr, errorMessage, fmtCtr, LIFECYCLE_VARIANT, money, PAUSABLE_STATUSES, positionLabel, shortDate } from '../_lib/banner-meta';

/**
 * Reklamin YAYINDAKI hali — panelde gorsel dosyasi olmayan sablon reklamlar
 * (Hostinger gibi) hic gorunmuyordu. Onizleme sitedeki bilesenin kendisini
 * cizer; iframe ayni alan adindaki /reklam-onizleme yolunu acar.
 */
function CreativePreview({ id, initialFormat, t }: { id: number; initialFormat: AdFormat; t: TranslateFn }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [format,setFormat] = useState<AdFormat>(initialFormat);
  const src = `/reklam-onizleme/${id}?device=${device}&format=${format}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-md border">
          <button type="button" onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs ${device === 'desktop' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
            <Monitor className="size-3.5" /> {t('sheet.previewDesktop')}
          </button>
          <button type="button" onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 border-l px-2.5 py-1 text-xs ${device === 'mobile' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
            <Smartphone className="size-3.5" /> {t('sheet.previewMobile')}
          </button>
        </div>
        <a href={src} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:underline">
          {t('sheet.previewOpen')}
        </a>
      </div>
      <div className="overflow-hidden rounded-lg border bg-muted/20">
        <div className="mb-2 flex flex-wrap gap-2">{(Object.keys(AD_FORMATS) as AdFormat[]).map(item=><button type="button" key={item} className={`rounded border px-2 py-1 text-xs ${format===item?'bg-primary text-primary-foreground':''}`} onClick={()=>setFormat(item)}>{AD_FORMATS[item].label}</button>)}</div>
        <AdFormatPreview src={src} format={format} mobile={device==='mobile'} title={t('sheet.preview')} />
      </div>
    </div>
  );
}

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
  const [update, upd] = useUpdateBannerAdminMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);

  async function handlePause() {
    if (!row) return;
    try {
      await update({ id: row.id, patch: { lifecycleStatus: 'paused' } }).unwrap();
      toast.success(t('toasts.paused'));
      setConfirmPause(false);
      onClose();
    } catch (err) { toast.error(errorMessage(err, tc('saveFailed'))); }
  }
  // Durum verilmez: backend baslangic tarihine gore live/scheduled secer ve slot cakismasini denetler.
  async function handleResume() {
    if (!row) return;
    try {
      await update({ id: row.id, patch: { isActive: true, startAt: row.startAt } }).unwrap();
      toast.success(t('toasts.resumed'));
      onClose();
    } catch (err) {
      // Hata zarfi rotanin ek alanlarini error.details altina tasir.
      const conflicts = (err as { data?: { error?: { details?: { conflicts?: Array<{ title: string }> } } } })?.data?.error?.details?.conflicts;
      toast.error(conflicts?.length ? t('sheet.resumeConflict', { titles: conflicts.map((c) => c.title).join(', ') }) : errorMessage(err, tc('saveFailed')));
    }
  }

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
              <CreativePreview id={row.id} initialFormat={adFormat(row)} t={t} />
              {row.code ? <pre className="max-h-32 overflow-auto rounded-lg border bg-muted/40 p-3 text-[11px]">{row.code.slice(0, 600)}</pre> : null}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label={t('sheet.impressions')} value={row.impressions.toLocaleString('tr-TR')} />
                <Stat label={t('sheet.clicks')} value={row.clicks.toLocaleString('tr-TR')} />
                <Stat label={t('sheet.ctr')} value={fmtCtr(ctr(row))} />
                <Stat label={t('sheet.amount')} value={money(row.totalAmount)} />
              </div>
              <div>
                <Row label={t('sheet.slot')} value={`${positionLabel(slots, row.position)} · ${AD_FORMATS[adFormat(row)].label} · Satır ${row.desktopRow} / Başlangıç ${row.gridColumn ?? 1}`} />
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
                {PAUSABLE_STATUSES.has(row.lifecycleStatus) ? <Button size="sm" variant="outline" onClick={() => setConfirmPause(true)} disabled={upd.isLoading}><Pause className="size-3.5" /> {t('sheet.pause')}</Button> : null}
                {row.lifecycleStatus === 'paused' ? <Button size="sm" variant="outline" onClick={handleResume} disabled={upd.isLoading}><Play className="size-3.5" /> {t('sheet.resume')}</Button> : null}
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
            <AlertDialog open={confirmPause} onOpenChange={setConfirmPause}>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>{t('sheet.pauseTitle')}</AlertDialogTitle><AlertDialogDescription>{t('sheet.pauseHint', { title: row.title })}</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>{tc('giveUp')}</AlertDialogCancel><AlertDialogAction onClick={handlePause}>{t('sheet.pause')}</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
