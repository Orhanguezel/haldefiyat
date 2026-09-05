'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TranslateFn } from '@/i18n';
import type { AdSlotAdmin, AdWaitlistItem, BannerAdmin } from '@/integrations/endpoints/banners-admin-endpoints';
import { useAdWaitlistSuggestionsAdminQuery, useCreateAdWaitlistAdminMutation, useUpdateAdWaitlistAdminMutation } from '@/integrations/hooks';
import { errorMessage, positionLabel } from '../_lib/banner-meta';

const EMPTY = { title: '', advertiser: '', position: 'global_footer', start: '', end: '', priority: '0', notes: '' };

/** Dolu alan talepleri: tercih tarihinde hedef slot ve ayni sayfa turundeki alternatifler kontrol edilir. */
export function WaitlistPanel({ slots, t, tc }: { slots: AdSlotAdmin[]; t: TranslateFn; tc: TranslateFn }) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = useAdWaitlistSuggestionsAdminQuery({ at: today });
  const [create, cr] = useCreateAdWaitlistAdminMutation();
  const [update] = useUpdateAdWaitlistAdminMutation();
  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function add() {
    if (!form.title.trim()) { toast.error(t('waitlist.titleRequired')); return; }
    try {
      await create({ position: form.position as BannerAdmin['position'], title: form.title.trim(), advertiser: form.advertiser.trim() || null,
        preferredStartAt: form.start ? new Date(`${form.start}T00:00:00`).toISOString() : null, preferredEndAt: form.end ? new Date(`${form.end}T23:59:59`).toISOString() : null,
        priority: Number(form.priority) || 0, notes: form.notes.trim() || null }).unwrap();
      setForm(EMPTY); toast.success(t('waitlist.added'));
    } catch (err) { toast.error(errorMessage(err, tc('saveFailed'))); }
  }
  async function setStatus(id: number, status: 'offered' | 'cancelled') {
    await update({ id, patch: { status } }).unwrap();
    toast.success(t(`waitlist.status.${status}Done`));
  }
  async function convert(item: AdWaitlistItem) {
    await update({ id: item.id, patch: { status: 'converted' } }).unwrap();
    window.location.assign(`/admin/banners/new?position=${item.alternatives?.[0]?.slotKey ?? item.position}&start=${item.requestedDate ?? today}`);
  }

  const items = data?.items ?? [];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input placeholder={t('waitlist.title')} value={form.title} onChange={(e) => set('title', e.target.value)} />
        <Input placeholder={t('waitlist.advertiser')} value={form.advertiser} onChange={(e) => set('advertiser', e.target.value)} />
        <Select value={form.position} onValueChange={(v) => set('position', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{slots.map((s) => <SelectItem key={s.slotKey} value={s.slotKey}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
        <Input type="number" min={0} max={100} placeholder={t('waitlist.priority')} value={form.priority} onChange={(e) => set('priority', e.target.value)} />
        <div className="text-xs text-muted-foreground">{t('waitlist.preferredStart')}<Input aria-label={t('waitlist.preferredStart')} className="mt-1" type="date" value={form.start} onChange={(e) => set('start', e.target.value)} /></div>
        <div className="text-xs text-muted-foreground">{t('waitlist.preferredEnd')}<Input aria-label={t('waitlist.preferredEnd')} className="mt-1" type="date" value={form.end} onChange={(e) => set('end', e.target.value)} /></div>
        <Input className="xl:col-span-2" placeholder={t('waitlist.notes')} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        <Button onClick={add} disabled={cr.isLoading} className="xl:col-start-4">{t('waitlist.add')}</Button>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const free = (item.requestedAvailable ?? 0) > 0; const alt = item.alternatives?.[0];
          return (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-64">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.title}</span>
                  <Badge variant={item.status === 'offered' ? 'secondary' : 'outline'}>{t(`waitlist.status.${item.status}`)}</Badge>
                  <Badge variant="outline">{t('waitlist.priorityBadge', { count: item.priority })}</Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{item.advertiser || t('waitlist.noAdvertiser')} · {positionLabel(slots, item.position)} · {item.requestedDate}</div>
                <div className={`mt-1 text-xs font-medium ${free ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {free ? t('waitlist.targetFree', { count: item.requestedAvailable ?? 0 }) : item.requestedNextAvailableAt ? t('waitlist.targetFullNext', { date: new Date(`${item.requestedNextAvailableAt}T12:00:00`).toLocaleDateString('tr-TR') }) : t('waitlist.targetFull365')}
                  {!free && alt ? ` · ${t('waitlist.alternative', { label: alt.label })}` : ''}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setStatus(item.id, 'offered')}>{t('waitlist.markOffered')}</Button>
                <Button size="sm" onClick={() => void convert(item)}>{t('waitlist.convert')}</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(item.id, 'cancelled')}>{tc('cancel')}</Button>
              </div>
            </div>
          );
        })}
        {!items.length ? <p className="text-sm text-muted-foreground">{t('waitlist.empty')}</p> : null}
      </div>
    </div>
  );
}
