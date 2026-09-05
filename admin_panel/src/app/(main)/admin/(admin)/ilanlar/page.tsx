'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ListingSheet } from './_components/listing-sheet';
import { ListingsTable } from './_components/listings-table';
import { SettingsPanel } from './_components/settings-panel';
import { TrafficPanel } from './_components/traffic-panel';
import { api, MAX_IMAGES, STATUSES, toEditForm, uploadListingImage } from './_lib/api';
import { useAdminT } from '../../_components/common/use-admin-t';
import { buildBannerPayload, firstFreeRow, isLiveAd, listingSlots, slotRowPlan } from './_lib/ads';
import type {
  AdForm, AdRow, AdSlot, EditForm, Inquiry, Listing, ListingAnalytics, ListingResponse, PackageKey, Pricing,
} from './_lib/types';

const EMPTY_AD: AdForm = {
  enabled: false, position: '', desktopRow: 1, desktopColumns: 1,
  device: 'all', package: 'weekly', paymentConfirmed: false,
};

export default function ListingsAdminPage() {
  const t = useAdminT('admin.listings');
  const tc = useAdminT('admin.common');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<ListingResponse>({ items: [] });
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [analytics, setAnalytics] = useState<ListingAnalytics | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);

  const [editing, setEditing] = useState<Listing | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [adForm, setAdForm] = useState<AdForm>(EMPTY_AD);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Listing | null>(null);
  const autoSwitched = useRef(false);
  const [pendingReject, setPendingReject] = useState<Listing | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const listingAds = useMemo(() => ads.filter((ad) => ad.listingId != null), [ads]);
  const currentAd = editing ? listingAds.find((ad) => ad.listingId === editing.id) : undefined;

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('tr');
    if (!term) return data.items;
    return data.items.filter((item) => [item.title, item.productName, item.citySlug, item.contactPhone]
      .some((field) => (field ?? '').toLocaleLowerCase('tr').includes(term)));
  }, [data.items, query]);

  async function load() {
    setBusy(true);
    const [listRes, inquiryRes, adsRes, slotRes] = await Promise.all([
      api(`/admin/listings?status=${status}&limit=100`),
      api('/admin/listings/inquiries'),
      api('/admin/banners?limit=500'),
      api('/admin/banners/slots'),
    ]);
    const listBody = listRes.ok ? ((await listRes.json()) as ListingResponse) : { items: [] };
    setData(listBody);
    if (!autoSwitched.current && status === 'pending' && (listBody.summary?.pending ?? 0) === 0) {
      autoSwitched.current = true;
      setStatus('all');
    }
    setInquiries(inquiryRes.ok ? ((await inquiryRes.json()) as { items?: Inquiry[] }).items ?? [] : []);
    setAds(adsRes.ok ? ((await adsRes.json()) as { items?: AdRow[] }).items ?? [] : []);
    setSlots(slotRes.ok ? ((await slotRes.json()) as { items?: AdSlot[] }).items ?? [] : []);
    setBusy(false);
  }

  function openEdit(item: Listing) {
    const ad = listingAds.find((entry) => entry.listingId === item.id);
    const available = listingSlots(slots);
    const position = ad?.position ?? available[0]?.slotKey ?? '';
    const slot = available.find((entry) => entry.slotKey === position);
    const plans = slotRowPlan(ads, slot, ad?.device ?? 'all', ad?.id);
    const row = ad?.desktopRow ?? firstFreeRow(plans);
    setEditError('');
    setEditing(item);
    setForm(toEditForm(item));
    setImages(item.images ?? []);
    setAdForm({
      enabled: isLiveAd(ad),
      position,
      desktopRow: row,
      desktopColumns: Number(ad?.desktopColumns ?? plans.find((plan) => plan.row === row)?.columns ?? slot?.desktopCapacity ?? 1),
      device: ad?.device ?? 'all',
      package: 'weekly',
      paymentConfirmed: isLiveAd(ad),
    });
  }

  function closeEdit() {
    setEditing(null);
    setForm(null);
    setImages([]);
    setEditError('');
  }

  async function moderate(id: number, next: 'approved' | 'rejected', note?: string) {
    const res = await api(`/admin/listings/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next, moderationNote: note?.trim() || null }),
    });
    if (!res.ok) { toast.error(t('toasts.statusFailed')); return; }
    toast.success(next === 'approved' ? t('toasts.approved') : t('toasts.rejected'));
    if (editing?.id === id) closeEdit();
    await load();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const res = await api(`/admin/listings/${pendingDelete.id}`, { method: 'DELETE' });
    setPendingDelete(null);
    if (!res.ok) { toast.error(t('toasts.deleteFailed')); return; }
    toast.success(t('toasts.deleted'));
    await load();
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const room = MAX_IMAGES - images.length;
    for (const file of Array.from(files).slice(0, Math.max(0, room))) {
      const url = await uploadListingImage(file);
      if (url) setImages((prev) => [...prev, url]);
      else toast.error(t('images.uploadFailed', { name: file.name }));
    }
    setUploading(false);
  }

  async function saveEdit() {
    if (!editing || !form) return;
    setSaving(true);
    setEditError('');
    const res = await api(`/admin/listings/${editing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title: form.title.trim(),
        validUntil: form.validUntil,
        contactPhone: form.contactPhone.trim() || null,
        quantity: form.quantity.trim() === '' ? null : Number(form.quantity),
        quantityUnit: form.quantityUnit.trim() || 'kg',
        priceType: form.priceType,
        priceMin: form.priceMin.trim() === '' ? null : Number(form.priceMin),
        priceMax: form.priceMax.trim() === '' ? null : Number(form.priceMax),
        description: form.description.trim() || null,
        images,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      setSaving(false);
      setEditError(body.error?.message ?? t('toasts.saveFailed'));
      return;
    }

    if (adForm.enabled) {
      if (editing.status !== 'approved') {
        setSaving(false);
        setEditError(t('ad.onlyApproved'));
        return;
      }
      const payload = buildBannerPayload({
        title: form.title.trim(),
        description: form.description.trim(),
        listingId: editing.id,
        position: adForm.position,
        device: adForm.device,
        desktopRow: adForm.desktopRow,
        desktopColumns: adForm.desktopColumns,
        paymentConfirmed: adForm.paymentConfirmed,
        days: pricing?.[adForm.package].days ?? 7,
      });
      const adRes = await api(currentAd ? `/admin/banners/${currentAd.id}` : '/admin/banners', {
        method: currentAd ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      if (!adRes.ok) {
        const body = (await adRes.json().catch(() => ({}))) as { error?: string; conflicts?: Array<{ id: number; title: string }> };
        setSaving(false);
        const blockers = body.conflicts?.map((entry) => `#${entry.id} ${entry.title}`).join(', ');
        setEditError([
          body.error ?? t('ad.saveFailed'),
          blockers ? t('ad.blockers', { list: blockers }) : '',
          t('ad.listingSavedAdNot'),
        ].filter(Boolean).join(' '));
        await load();
        return;
      }
      await api(`/admin/listings/${editing.id}/feature`, adForm.paymentConfirmed
        ? { method: 'PATCH', body: JSON.stringify({ package: adForm.package }) }
        : { method: 'DELETE' });
    } else {
      if (currentAd?.isActive) {
        await api(`/admin/banners/${currentAd.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) });
      }
      await api(`/admin/listings/${editing.id}/feature`, { method: 'DELETE' });
    }

    setSaving(false);
    toast.success(t('toasts.saved'));
    closeEdit();
    await load();
  }

  async function savePricing() {
    if (!pricing) return;
    setSavingPricing(true);
    const res = await api('/admin/listings/featured-pricing', { method: 'PUT', body: JSON.stringify(pricing) });
    setSavingPricing(false);
    if (res.ok) toast.success(t('settings.pricingSaved'));
    else toast.error(t('settings.pricingFailed'));
  }

  useEffect(() => { void load(); }, [status]);
  useEffect(() => {
    void (async () => {
      const res = await api(`/admin/listings/analytics?days=${analyticsDays}`);
      if (res.ok) setAnalytics((await res.json()) as ListingAnalytics);
    })();
  }, [analyticsDays]);
  useEffect(() => {
    void (async () => {
      const res = await api('/admin/listings/featured-pricing');
      if (res.ok) setPricing(((await res.json()) as { pricing: Pricing }).pricing);
    })();
  }, []);

  const summary = data.summary;
  const counts: Record<'pending' | 'approved' | 'rejected' | 'all', number | null> = summary
    ? {
        pending: summary.pending,
        approved: summary.active,
        rejected: summary.rejected,
        all: null,
      }
    : { pending: null, approved: null, rejected: null, all: null };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {summary ? t('summary', { active: summary.active, pending: summary.pending, rejected: summary.rejected }) : tc('loading')}
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={busy}>
          <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} /> {tc('refresh')}
        </Button>
      </div>

      <Tabs defaultValue="listings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="listings">{t('tabs.list')}</TabsTrigger>
          <TabsTrigger value="traffic">{t('tabs.traffic')}</TabsTrigger>
          <TabsTrigger value="inquiries">{t('tabs.inquiries')} {inquiries.length ? `(${inquiries.length})` : ''}</TabsTrigger>
          <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((item) => (
                <Button key={item} size="sm" variant={status === item ? 'default' : 'outline'} onClick={() => setStatus(item)}>
                  {t(`status.${item}`)}
                  {counts[item] == null ? null : <span className="ml-1 tabular-nums opacity-70">{counts[item]}</span>}
                </Button>
              ))}
            </div>
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('search')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <ListingsTable
            items={visible}
            ads={listingAds}
            busy={busy}
            onEdit={openEdit}
            onModerate={(id, next) => {
              const target = data.items.find((item) => item.id === id);
              if (next === 'rejected' && target) { setRejectNote(''); setPendingReject(target); return; }
              void moderate(id, next);
            }}
            onDelete={setPendingDelete}
            t={t}
            tc={tc}
          />
        </TabsContent>

        <TabsContent value="traffic">
          <TrafficPanel analytics={analytics} days={analyticsDays} onDaysChange={setAnalyticsDays} t={t} tc={tc} />
        </TabsContent>

        <TabsContent value="inquiries" className="space-y-2">
          {inquiries.length === 0 ? (
            <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t('inquiries.empty')}</div>
          ) : inquiries.map((item) => (
            <div key={item.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">#{item.listingId} · {item.name ?? t('sheet.noName')}</span>
                <span className="text-xs text-muted-foreground">{item.phone ?? t('sheet.noPhone')} · {item.offerPrice ? `${item.offerPrice} ₺` : t('sheet.noOffer')}</span>
              </div>
              {item.message ? <p className="mt-1 text-muted-foreground">{item.message}</p> : null}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="settings">
          <SettingsPanel
            pricing={pricing}
            onPricingChange={(key: PackageKey, price) => setPricing((prev) => (prev ? { ...prev, [key]: { ...prev[key], price } } : prev))}
            onSave={savePricing}
            saving={savingPricing}
            slots={slots}
            ads={ads}
            t={t}
            tc={tc}
          />
        </TabsContent>
      </Tabs>

      <ListingSheet
        listing={editing}
        form={form}
        onField={(key, value) => setForm((prev) => (prev ? { ...prev, [key]: value } : prev))}
        images={images}
        uploading={uploading}
        onUpload={uploadImages}
        onRemoveImage={(url) => setImages((prev) => prev.filter((item) => item !== url))}
        onMakeCover={(url) => setImages((prev) => [url, ...prev.filter((item) => item !== url)])}
        adForm={adForm}
        onAdChange={(patch) => setAdForm((prev) => ({ ...prev, ...patch }))}
        slots={slots}
        ads={ads}
        currentAdId={currentAd?.id}
        pricing={pricing}
        inquiries={inquiries.filter((item) => item.listingId === editing?.id)}
        error={editError}
        saving={saving}
        onSave={saveEdit}
        onModerate={(next) => {
          if (!editing) return;
          if (next === 'rejected') { setRejectNote(''); setPendingReject(editing); return; }
          void moderate(editing.id, next);
        }}
        onClose={closeEdit}
        t={t}
        tc={tc}
      />

      <AlertDialog open={Boolean(pendingReject)} onOpenChange={(open) => { if (!open) setPendingReject(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.rejectTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.rejectBody', { title: pendingReject?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            placeholder={t('dialogs.rejectNote')}
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('giveUp')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = pendingReject;
                setPendingReject(null);
                if (target) void moderate(target.id, 'rejected', rejectNote);
              }}
            >
              {tc('reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.deleteBody', { title: pendingDelete?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('giveUp')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{tc('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
