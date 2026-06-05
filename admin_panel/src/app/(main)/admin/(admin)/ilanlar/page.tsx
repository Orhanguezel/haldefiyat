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
};
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
