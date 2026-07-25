'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { BASE_URL } from '@/integrations/api-base';
import { tokenStore } from '@/integrations/core/token';

type Listing = {
  id: number; title: string; productName: string; citySlug: string | null;
  listingType: string; status: string; isSuspicious: number | boolean; isFeatured: number | boolean;
  validUntil: string; contactPhone: string | null;
  quantity: string | number | null; quantityUnit: string | null;
  priceType: string | null; priceMin: string | number | null; priceMax: string | number | null;
  description: string | null; images?: string[];
};
const MAX_IMAGES = 6;
const UPLOAD_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');
function imageSrc(url: string) {
  return /^https?:\/\//.test(url) ? url : `${UPLOAD_ORIGIN}${url}`;
}
type EditForm = {
  title: string; validUntil: string; contactPhone: string;
  quantity: string; quantityUnit: string; priceType: string;
  priceMin: string; priceMax: string; description: string;
};
const PRICE_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'sabit', label: 'Sabit fiyat' },
  { value: 'pazarlik', label: 'Pazarlık' },
  { value: 'hal_endeksli', label: 'Hal endeksli' },
];
function toEditForm(item: Listing): EditForm {
  return {
    title: item.title ?? '',
    validUntil: (item.validUntil ?? '').slice(0, 10),
    contactPhone: item.contactPhone ?? '',
    quantity: item.quantity == null ? '' : String(item.quantity),
    quantityUnit: item.quantityUnit ?? 'kg',
    priceType: item.priceType ?? 'sabit',
    priceMin: item.priceMin == null ? '' : String(item.priceMin),
    priceMax: item.priceMax == null ? '' : String(item.priceMax),
    description: item.description ?? '',
  };
}
type Inquiry = { id: number; listingId: number; name: string | null; phone: string | null; message: string | null; offerPrice: string | null; createdAt: string | null };
type ListingResponse = { items: Listing[]; summary?: { active: number; pending: number; rejected: number } };
type Pricing = Record<'daily' | 'weekly' | 'monthly', { days: number; price: number }>;
const PKG_LABEL: Record<'daily' | 'weekly' | 'monthly', string> = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
const STATUS_LABEL: Record<string, string> = { pending: 'Bekleyen', approved: 'Onaylı', rejected: 'Reddedilen', expired: 'Süresi doldu', closed: 'Kapalı', all: 'Tümü' };
const TYPE_LABEL: Record<string, string> = { satis: 'Satış ilanı', alim: 'Alım talebi' };

async function api(path: string, init: RequestInit = {}) {
  const token = tokenStore.get();
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

export default function ListingsAdminPage() {
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [data, setData] = useState<ListingResponse>({ items: [] });
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [savingPricing, setSavingPricing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [imgUploading, setImgUploading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  async function load() {
    setBusy(true);
    const [listRes, inquiryRes] = await Promise.all([
      api(`/admin/listings?status=${status}&limit=100`),
      api('/admin/listings/inquiries'),
    ]);
    setData(listRes.ok ? await listRes.json() as ListingResponse : { items: [] });
    setInquiries(inquiryRes.ok ? ((await inquiryRes.json()) as { items?: Inquiry[] }).items ?? [] : []);
    setBusy(false);
  }

  async function moderate(id: number, nextStatus: 'approved' | 'rejected') {
    await api(`/admin/listings/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, moderationNote: note || null }),
    });
    await load();
  }

  async function feature(id: number, pkg: 'daily' | 'weekly' | 'monthly') {
    await api(`/admin/listings/${id}/feature`, { method: 'PATCH', body: JSON.stringify({ package: pkg }) });
    await load();
  }

  async function remove(id: number) {
    await api(`/admin/listings/${id}`, { method: 'DELETE' });
    await load();
  }

  function startEdit(item: Listing) {
    setEditError('');
    setEditId(item.id);
    setForm(toEditForm(item));
    setEditImages(item.images ?? []);
  }

  function closeEdit() {
    setEditId(null);
    setForm(null);
    setEditImages([]);
    setEditError('');
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setImgUploading(true);
    const token = tokenStore.get();
    const slots = MAX_IMAGES - editImages.length;
    for (const file of Array.from(files).slice(0, Math.max(0, slots))) {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${BASE_URL}/storage/listings/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string };
      if (res.ok && json.url) setEditImages((prev) => [...prev, json.url as string]);
    }
    setImgUploading(false);
  }

  function removeImage(url: string) {
    setEditImages((prev) => prev.filter((item) => item !== url));
  }

  async function saveEdit() {
    if (editId == null || !form) return;
    setSavingEdit(true);
    setEditError('');
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      validUntil: form.validUntil,
      contactPhone: form.contactPhone.trim() || null,
      quantity: form.quantity.trim() === '' ? null : Number(form.quantity),
      quantityUnit: form.quantityUnit.trim() || 'kg',
      priceType: form.priceType,
      priceMin: form.priceMin.trim() === '' ? null : Number(form.priceMin),
      priceMax: form.priceMax.trim() === '' ? null : Number(form.priceMax),
      description: form.description.trim() || null,
      images: editImages,
    };
    const res = await api(`/admin/listings/${editId}`, { method: 'PATCH', body: JSON.stringify(payload) });
    setSavingEdit(false);
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      setEditError(body.error?.message ?? 'Kaydedilemedi. Alanları kontrol edin (geçerlilik tarihi yarından itibaren olmalı).');
      return;
    }
    closeEdit();
    await load();
  }

  async function savePricing() {
    if (!pricing) return;
    setSavingPricing(true);
    await api('/admin/listings/featured-pricing', { method: 'PUT', body: JSON.stringify(pricing) });
    setSavingPricing(false);
  }

  useEffect(() => { void load(); }, [status]);
  useEffect(() => {
    void (async () => {
      const res = await api('/admin/listings/featured-pricing');
      if (res.ok) setPricing(((await res.json()) as { pricing: Pricing }).pricing);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Aktif" value={data.summary?.active ?? 0} />
        <Metric title="Bekleyen" value={data.summary?.pending ?? 0} />
        <Metric title="Reddedilen" value={data.summary?.rejected ?? 0} />
      </div>

      {form && editId != null ? (
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">İlanı Düzenle · #{editId}</CardTitle>
            <Button variant="ghost" size="sm" onClick={closeEdit}>Kapat</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 block sm:col-span-2">
                <span className="text-sm text-muted-foreground">Başlık</span>
                <Input value={form.title} onChange={(e) => setField('title', e.target.value)} />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm text-muted-foreground">Geçerlilik tarihi (yarından itibaren)</span>
                <Input type="date" value={form.validUntil} onChange={(e) => setField('validUntil', e.target.value)} />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm text-muted-foreground">Telefon</span>
                <Input value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm text-muted-foreground">Miktar</span>
                <Input type="number" step="0.01" value={form.quantity} onChange={(e) => setField('quantity', e.target.value)} />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm text-muted-foreground">Miktar birimi</span>
                <Input value={form.quantityUnit} onChange={(e) => setField('quantityUnit', e.target.value)} />
              </label>
              <label className="space-y-1 block">
                <span className="text-sm text-muted-foreground">Fiyat tipi</span>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={form.priceType}
                  onChange={(e) => setField('priceType', e.target.value)}
                >
                  {PRICE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 block">
                  <span className="text-sm text-muted-foreground">Fiyat (min)</span>
                  <Input type="number" step="0.01" value={form.priceMin} onChange={(e) => setField('priceMin', e.target.value)} />
                </label>
                <label className="space-y-1 block">
                  <span className="text-sm text-muted-foreground">Fiyat (maks)</span>
                  <Input type="number" step="0.01" value={form.priceMax} onChange={(e) => setField('priceMax', e.target.value)} />
                </label>
              </div>
              <label className="space-y-1 block sm:col-span-2">
                <span className="text-sm text-muted-foreground">Açıklama</span>
                <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} />
              </label>
              <div className="space-y-2 sm:col-span-2">
                <span className="text-sm text-muted-foreground">Görseller ({editImages.length}/{MAX_IMAGES})</span>
                <div className="flex flex-wrap gap-3">
                  {editImages.map((url) => (
                    <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageSrc(url)} alt="ilan görseli" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl bg-destructive text-xs text-destructive-foreground"
                        aria-label="Görseli kaldır"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {editImages.length < MAX_IMAGES ? (
                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed text-center text-xs text-muted-foreground hover:bg-muted">
                      {imgUploading ? 'Yükleniyor…' : '+ Görsel'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={imgUploading}
                        onChange={(e) => { void uploadImages(e.target.files); e.target.value = ''; }}
                      />
                    </label>
                  ) : null}
                </div>
              </div>
            </div>
            {editError ? <p className="text-sm text-destructive">{editError}</p> : null}
            <div className="flex gap-2">
              <Button onClick={saveEdit} disabled={savingEdit || imgUploading}>{savingEdit ? 'Kaydediliyor…' : 'Kaydet'}</Button>
              <Button variant="outline" onClick={closeEdit}>Vazgeç</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">İlan Moderasyonu</CardTitle>
          <Button variant="outline" onClick={load} disabled={busy}>Yenile</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((item) => (
              <Button key={item} size="sm" variant={status === item ? 'default' : 'outline'} onClick={() => setStatus(item)}>
                {STATUS_LABEL[item]}
              </Button>
            ))}
          </div>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Moderasyon notu" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İlan</TableHead><TableHead>Tip</TableHead><TableHead>Durum</TableHead>
                <TableHead>Geçerli</TableHead><TableHead>Telefon</TableHead><TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.productName} · {item.citySlug ?? 'TR'} {item.isSuspicious ? '· şüpheli fiyat' : ''} {item.isFeatured ? '· öne çıkan' : ''}
                    </div>
                  </TableCell>
                  <TableCell>{TYPE_LABEL[item.listingType] ?? item.listingType}</TableCell>
                  <TableCell>{STATUS_LABEL[item.status] ?? item.status}</TableCell>
                  <TableCell>{item.validUntil}</TableCell>
                  <TableCell>{item.contactPhone ?? '—'}</TableCell>
                  <TableCell className="space-x-1">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(item)}>Düzenle</Button>
                    <Button size="sm" onClick={() => moderate(item.id, 'approved')}>Onayla</Button>
                    <Button size="sm" variant="outline" onClick={() => moderate(item.id, 'rejected')}>Reddet</Button>
                    <Button size="sm" variant="outline" onClick={() => feature(item.id, 'daily')}>Günlük</Button>
                    <Button size="sm" variant="outline" onClick={() => feature(item.id, 'weekly')}>Haftalık</Button>
                    <Button size="sm" variant="outline" onClick={() => feature(item.id, 'monthly')}>Aylık</Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(item.id)}>Sil</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Öne Çıkarma Paket Fiyatları (₺)</CardTitle>
          <Button onClick={savePricing} disabled={!pricing || savingPricing}>Kaydet</Button>
        </CardHeader>
        <CardContent>
          {pricing ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {(['daily', 'weekly', 'monthly'] as const).map((key) => (
                <label key={key} className="space-y-1 block">
                  <span className="text-sm text-muted-foreground">{PKG_LABEL[key]} ({pricing[key].days} gün)</span>
                  <Input
                    type="number"
                    min={0}
                    value={pricing[key].price}
                    onChange={(event) =>
                      setPricing((prev) => (prev ? { ...prev, [key]: { ...prev[key], price: Number(event.target.value) } } : prev))
                    }
                  />
                </label>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Yükleniyor…</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Teklifler</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {inquiries.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <div className="font-medium">#{item.listingId} · {item.name ?? 'İsimsiz'} · {item.phone ?? '—'} · {item.offerPrice ?? 'teklif yok'}</div>
                <p className="text-muted-foreground">{item.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
