'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TranslateFn } from '@/i18n';
import type { AdCalendarBooking, AdSlotAdmin, BannerAdmin, BannerDevice } from '@/integrations/endpoints/banners-admin-endpoints';
import { useAdCalendarAdminQuery, useUpdateBannerAdminMutation } from '@/integrations/hooks';
import { errorMessage } from '../_lib/banner-meta';

const RANGES = [7, 30, 90] as const;
const DEVICES: BannerDevice[] = ['all', 'desktop', 'mobile'];
const DRAG_KEY = 'application/x-hal-banner-id';

/** Envanter takvimi: slot x gun doluluk; 7 gunluk gorunumde rezervasyonlar suruklenerek tasinir. */
export function CalendarPanel({ slots, t, tc }: { slots: AdSlotAdmin[]; t: TranslateFn; tc: TranslateFn }) {
  const [days, setDays] = useState<number>(7);
  const [device, setDevice] = useState<BannerDevice>('all');
  const range = useMemo(() => { const from = new Date(); const to = new Date(); to.setDate(to.getDate() + days - 1); return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }; }, [days]);
  const { data: calendar } = useAdCalendarAdminQuery(range);
  const [updateBanner] = useUpdateBannerAdminMutation();
  const dates = useMemo(() => Array.from({ length: days }, (_, i) => { const d = new Date(`${range.from}T12:00:00`); d.setDate(d.getDate() + i); return d; }), [days, range.from]);
  const capacity = (slot: AdSlotAdmin) => (device === 'mobile' ? slot.mobileCapacity : slot.desktopCapacity);

  function bookingsFor(slotKey: string, date: Date): AdCalendarBooking[] {
    const s = new Date(date); s.setHours(0, 0, 0, 0);
    const e = new Date(date); e.setHours(23, 59, 59, 999);
    return (calendar?.bookings ?? []).filter((b) => b.position === slotKey
      && (device === 'all' || b.device === 'all' || b.device === device)
      && (b.startAt ? new Date(b.startAt) : new Date(0)) <= e
      && (b.endAt ? new Date(b.endAt) : new Date('2999-12-31')) >= s);
  }
  function alternativesFor(slotKey: string, date: Date) {
    const source = slots.find((s) => s.slotKey === slotKey);
    return source ? slots.filter((s) => s.isActive && s.slotKey !== slotKey && s.pageType === source.pageType && bookingsFor(s.slotKey, date).length < capacity(s)) : [];
  }
  async function move(bookingId: number, position: string, date: Date) {
    const b = calendar?.bookings.find((x) => x.id === bookingId);
    if (!b?.startAt || !b.endAt) { toast.error(t('calendar.cannotMove')); return; }
    const start = new Date(b.startAt); const duration = new Date(b.endAt).getTime() - start.getTime();
    const target = new Date(date); target.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
    try {
      await updateBanner({ id: b.id, patch: { position: position as BannerAdmin['position'], startAt: target.toISOString(), endAt: new Date(target.getTime() + duration).toISOString() } }).unwrap();
      toast.success(t('calendar.moved'));
    } catch (err) { toast.error(errorMessage(err, t('calendar.moveFailed'))); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{t('calendar.hint')}</p>
        <div className="flex flex-wrap gap-1.5">
          <Select value={device} onValueChange={(v) => setDevice(v as BannerDevice)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{DEVICES.map((d) => <SelectItem key={d} value={d}>{t(`devices.${d}`)}</SelectItem>)}</SelectContent>
          </Select>
          {RANGES.map((d) => <Button key={d} size="sm" variant={days === d ? 'default' : 'outline'} onClick={() => setDays(d)}>{t(`calendar.range.${d}`)}</Button>)}
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-max border-collapse text-xs">
          <thead><tr className="bg-muted/50">
            <th className="sticky left-0 z-10 min-w-52 border-r bg-muted px-3 py-2 text-left">{t('calendar.slot')}</th>
            {dates.map((d) => <th key={d.toISOString()} className="min-w-16 border-r px-2 py-2 font-medium">{d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</th>)}
          </tr></thead>
          <tbody>
            {slots.filter((s) => s.isActive).map((slot) => (
              <tr key={slot.slotKey} className="border-t">
                <td className="sticky left-0 z-10 border-r bg-background px-3 py-2">
                  <div className="max-w-48 truncate font-medium">{slot.label}</div>
                  <div className="text-[10px] text-muted-foreground">{t('calendar.cells', { count: capacity(slot) })} · {device === 'all' ? t('calendar.desktopBased') : t(`devices.${device}`)}</div>
                </td>
                {dates.map((date) => {
                  const bookings = bookingsFor(slot.slotKey, date);
                  const cap = capacity(slot); const full = bookings.length >= cap; const partial = bookings.length > 0 && !full;
                  const alts = full ? alternativesFor(slot.slotKey, date) : [];
                  const title = [bookings.map((b) => `${b.title} [${b.device}]`).join(', ') || t('calendar.empty'), alts.length ? t('calendar.alternative', { list: alts.map((a) => a.label).join(', ') }) : ''].filter(Boolean).join(' · ');
                  return (
                    <td key={date.toISOString()} className="border-r p-1 text-center" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const id = Number(e.dataTransfer.getData(DRAG_KEY)); if (Number.isFinite(id)) void move(id, slot.slotKey, date); }}>
                      <Link href={`/admin/banners/new?position=${slot.slotKey}&start=${date.toISOString().slice(0, 10)}&device=${device}`} title={title}
                        className={`block rounded px-1 py-2 font-semibold ${full ? 'bg-rose-500/15 text-rose-700' : partial ? 'bg-amber-500/15 text-amber-700' : 'bg-emerald-500/12 text-emerald-700'}`}>
                        {bookings.length}/{cap}
                      </Link>
                      {days === 7 ? bookings.slice(0, 2).map((b) => (
                        <button key={b.id} type="button" draggable={Boolean(b.startAt && b.endAt)} onDragStart={(e) => e.dataTransfer.setData(DRAG_KEY, String(b.id))} onClick={() => window.location.assign(`/admin/banners/${b.id}`)}
                          className="mt-1 block max-w-16 truncate rounded border bg-background px-1 py-0.5 text-[9px]" title={`${b.title} · ${b.device}${b.startAt && b.endAt ? ` — ${t('calendar.dragHint')}` : ` — ${t('calendar.continuous')}`}`}>
                          {b.title}
                        </button>
                      )) : null}
                      {days === 7 && alts.length ? <div className="mt-1 max-w-16 truncate text-[8px] text-muted-foreground" title={alts.map((a) => a.label).join(', ')}>{t('calendar.altShort', { label: alts[0].label })}</div> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span><i className="mr-1 inline-block size-2.5 rounded bg-emerald-500/50" />{t('calendar.legendFree')}</span>
        <span><i className="mr-1 inline-block size-2.5 rounded bg-amber-500/50" />{t('calendar.legendPartial')}</span>
        <span><i className="mr-1 inline-block size-2.5 rounded bg-rose-500/50" />{t('calendar.legendFull')}</span>
        <span className="ml-auto">{tc('today')}: {range.from}</span>
      </div>
    </div>
  );
}
