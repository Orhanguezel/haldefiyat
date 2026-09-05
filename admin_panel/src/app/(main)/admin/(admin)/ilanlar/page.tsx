'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { BASE_URL } from '@/integrations/api-base';
import { tokenStore } from '@/integrations/core/token';

type Listing = {
  id: number; title: string; productName: string; citySlug: string | null;
  listingType: string; status: string; isSuspicious: number | boolean; isFeatured: number | boolean;
  validUntil: string; featuredUntil?: string | null; contactPhone: string | null;
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
type ListingAnalytics = {
  days: number;
  summary: { listViews: number; detailViews: number; ilanVerViews: number; inquiries: number };
  daily: Array<{ date: string; listViews: number; detailViews: number; ilanVerViews: number; inquiries: number }>;
  searches: { products: Array<{ term: string; hits: number }>; cities: Array<{ term: string; hits: number }> };
  perListing: Array<{ id: number; title: string; slug: string; status: string; viewCount: number; inquiries: number }>;
};
type Pricing = Record<'daily' | 'weekly' | 'monthly', { days: number; price: number }>;
type ListingAd = {
  id: number; listingId: number | null; position: string; desktopRow: number; desktopColumns: number;
  device: 'all' | 'desktop' | 'mobile'; isActive: number | boolean; endAt: string | null;
  title?: string; lifecycleStatus?: string; archivedAt?: string | null;
};
type AdForm = {
  enabled: boolean; position: string; desktopRow: string; desktopColumns: string;
  device: 'all' | 'desktop' | 'mobile'; package: 'daily' | 'weekly' | 'monthly'; paymentConfirmed: boolean;
};
const AD_POSITIONS = [
  { value: 'global_footer', label: 'Tüm sayfalar · footer üstü' },
  { value: 'home_mid', label: 'Anasayfa · orta alan' },
  { value: 'home_footer_top', label: 'Anasayfa · footer üstü' },
  { value: 'prices_top', label: 'Fiyatlar · üst şerit' },
  { value: 'listing_detail_sidebar', label: 'İlan detay · yan sütun' },
  { value: 'firm_detail_footer', label: 'Firma detay · içerik altı' },
] as const;
const OCCUPYING_STATUSES = new Set(['reserved', 'payment_pending', 'scheduled', 'live']);
const MAX_AD_ROW = 20;

function devicesOverlap(requested: AdForm['device'], existing: ListingAd['device']) {
  if (requested === 'all' || existing === 'all') return true;
  return requested === existing;
}

function rowOccupants(ads: ListingAd[], position: string, row: number, device: AdForm['device'], excludeId?: number) {
  const now = Date.now();
  return ads.filter((ad) => {
    if (excludeId && ad.id === excludeId) return false;
    if (ad.position !== position || Number(ad.desktopRow ?? 1) !== row) return false;
    if (ad.archivedAt) return false;
    const status = ad.lifecycleStatus ?? (ad.isActive ? 'live' : 'draft');
    if (!OCCUPYING_STATUSES.has(status)) return false;
    if (ad.endAt && new Date(ad.endAt).getTime() < now) return false;
    return devicesOverlap(device, ad.device);
  });
}

function rowBlockers(ads: ListingAd[], position: string, row: number, columns: number, device: AdForm['device'], excludeId?: number) {
  const occupants = rowOccupants(ads, position, row, device, excludeId);
  if (occupants.some((ad) => Number(ad.desktopColumns ?? 1) !== columns)) return occupants;
  return occupants.length >= columns ? occupants : [];
}

function firstFreeRow(ads: ListingAd[], position: string, columns: number, device: AdForm['device'], excludeId?: number) {
  for (let row = 1; row <= MAX_AD_ROW; row += 1) {
    if (!rowBlockers(ads, position, row, columns, device, excludeId).length) return row;
  }
  return 1;
}

const PKG_LABEL: Record<'daily' | 'weekly' | 'monthly', string> = { daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık' };
const STATUS_LABEL: Record<string, string> = { pending: 'Bekleyen', approved: 'Onaylı', rejected: 'Reddedilen', expired: 'Süresi doldu', closed: 'Kapalı', all: 'Tümü' };
const TYPE_LABEL: Record<string, string> = { satis: 'Satış ilanı', alim: 'Alım talebi' };
const isLiveAd = (ad?: ListingAd) => Boolean(ad?.isActive && (!ad.endAt || new Date(ad.endAt).getTime() >= Date.now()));

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
  const [analytics, setAnalytics] = useState<ListingAnalytics | null>(null);
  const [analyticsDays, setAnalyticsDays] = useState(30);
  const [listingAds, setListingAds] = useState<ListingAd[]>([]);
  const [allAds, setAllAds] = useState<ListingAd[]>([]);

  const [adForm, setAdForm] = useState<AdForm>({ enabled: false, position: 'global_footer', desktopRow: '1', desktopColumns: '2', device: 'all', package: 'weekly', paymentConfirmed: false });

  const currentListingAd = editId ? listingAds.find((entry) => entry.listingId === editId) : undefined;
  const selectedRowBlockers = rowBlockers(
    allAds,
    adForm.position,
    Number(adForm.desktopRow) || 1,
    Number(adForm.desktopColumns) || 1,
    adForm.device,
    currentListingAd?.id,
  );
  const suggestedFreeRow = firstFreeRow(allAds, adForm.position, Number(adForm.desktopColumns) || 1, adForm.device, currentListingAd?.id);

  async function load() {
    setBusy(true);
    const [listRes, inquiryRes, adsRes] = await Promise.all([
      api(`/admin/listings?status=${status}&limit=100`),
      api('/admin/listings/inquiries'),
      api('/admin/banners?limit=500'),
    ]);
    setData(listRes.ok ? await listRes.json() as ListingResponse : { items: [] });
    setInquiries(inquiryRes.ok ? ((await inquiryRes.json()) as { items?: Inquiry[] }).items ?? [] : []);
    const adItems = adsRes.ok ? ((await adsRes.json()) as { items?: ListingAd[] }).items ?? [] : [];
    setAllAds(adItems);
    setListingAds(adItems.filter((item) => item.listingId != null));
    setBusy(false);
  }

  async function moderate(id: number, nextStatus: 'approved' | 'rejected') {
    await api(`/admin/listings/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, moderationNote: note || null }),
    });
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
    const ad = listingAds.find((entry) => entry.listingId === item.id);
    const position = ad?.position ?? 'global_footer';
    const device = ad?.device ?? 'all';
    const columns = Number(ad?.desktopColumns ?? 2);
    setAdForm({
      enabled: isLiveAd(ad),
      position,
      desktopRow: String(ad?.desktopRow ?? firstFreeRow(allAds, position, columns, device)),
      desktopColumns: String(columns),
      device,
      package: 'weekly',
      paymentConfirmed: isLiveAd(ad),
    });
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
    if (!res.ok) {
      setSavingEdit(false);
      const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      setEditError(body.error?.message ?? 'Kaydedilemedi. Alanları kontrol edin (geçerlilik tarihi yarından itibaren olmalı).');
      return;
    }
    const currentAd = listingAds.find((entry) => entry.listingId === editId);
    if (adForm.enabled) {
      const currentListing = data.items.find((item) => item.id === editId);
      if (currentListing?.status !== 'approved') {
        setSavingEdit(false);
        setEditError('Reklam yalnızca onaylı ilan için açılabilir. Önce ilanı onaylayın.');
        return;
      }
      const days = pricing?.[adForm.package].days ?? ({ daily: 1, weekly: 7, monthly: 30 } as const)[adForm.package];
      const endAt = new Date(Date.now() + days * 86400000).toISOString();
      const bannerPayload = {
        position: adForm.position,
        title: `${form.title.trim()} · sponsorlu ilan`,
        advertiser: 'Sponsorlu İlan',
        type: 'image',
        sourceType: 'listing',
        listingId: editId,
        alt: form.title.trim(),
        linkTarget: '_self',
        rel: 'sponsored nofollow noopener',
        caption: form.description.trim().slice(0, 300) || null,
        ctaLabel: 'İlanı İncele',
        device: adForm.device,
        desktopRow: Number(adForm.desktopRow) || 1,
        desktopColumns: Number(adForm.desktopColumns) || 1,
        displayOrder: 1,
        weight: 1,
        lifecycleStatus: adForm.paymentConfirmed ? 'live' : 'payment_pending',
        paymentStatus: adForm.paymentConfirmed ? 'paid' : 'unpaid',
        isActive: adForm.paymentConfirmed,
        startAt: new Date().toISOString(),
        endAt,
      };
      const adRes = await api(currentAd ? `/admin/banners/${currentAd.id}` : '/admin/banners', {
        method: currentAd ? 'PATCH' : 'POST',
        body: JSON.stringify(bannerPayload),
      });
      if (!adRes.ok) {
        const body = (await adRes.json().catch(() => ({}))) as { error?: string; conflicts?: Array<{ id: number; title: string }> };
        setSavingEdit(false);
        const blockers = body.conflicts?.map((entry) => `#${entry.id} ${entry.title}`).join(', ');
        const freeRow = firstFreeRow(allAds, adForm.position, Number(adForm.desktopColumns) || 1, adForm.device);
        setEditError([
          body.error ?? 'Reklam slotu kaydedilemedi.',
          blockers ? `Satırı dolduran reklamlar: ${blockers}.` : '',
          body.conflicts?.length ? `Boş görünen ilk satır: ${freeRow}.` : '',
        ].filter(Boolean).join(' '));
        return;
      }
      if (adForm.paymentConfirmed) {
        await api(`/admin/listings/${editId}/feature`, { method: 'PATCH', body: JSON.stringify({ package: adForm.package }) });
      } else {
        await api(`/admin/listings/${editId}/feature`, { method: 'DELETE' });
      }
    } else {
      if (currentAd?.isActive) {
        await api(`/admin/banners/${currentAd.id}`, { method: 'PATCH', body: JSON.stringify({ isActive: false }) });
      }
      await api(`/admin/listings/${editId}/feature`, { method: 'DELETE' });
    }
    setSavingEdit(false);
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

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Aktif" value={data.summary?.active ?? 0} />
        <Metric title="Bekleyen" value={data.summary?.pending ?? 0} />
        <Metric title="Reddedilen" value={data.summary?.rejected ?? 0} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">İlan Trafiği · Son {analyticsDays} gün</CardTitle>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button key={d} size="sm" variant={analyticsDays === d ? 'default' : 'outline'} onClick={() => setAnalyticsDays(d)}>
                {d} gün
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!analytics ? (
            <div className="text-sm text-muted-foreground">Yükleniyor…</div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric title="Liste görüntüleme" value={analytics.summary.listViews} />
                <Metric title="İlan detay tıklama" value={analytics.summary.detailViews} />
                <Metric title="İlan ver ziyareti" value={analytics.summary.ilanVerViews} />
                <Metric title="Teklif / iletişim" value={analytics.summary.inquiries} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm font-medium">En çok görüntülenen ilanlar</div>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>İlan</TableHead><TableHead className="text-right">Görüntüleme</TableHead><TableHead className="text-right">Teklif</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.perListing.slice(0, 10).map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="max-w-[220px] truncate">{l.title || `#${l.id}`}</TableCell>
                          <TableCell className="text-right font-medium">{l.viewCount}</TableCell>
                          <TableCell className="text-right">{l.inquiries}</TableCell>
                        </TableRow>
                      ))}
                      {analytics.perListing.length === 0 && (
                        <TableRow><TableCell colSpan={3} className="text-muted-foreground">Kayıt yok.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <div className="mb-2 text-sm font-medium">En çok aranan ürünler</div>
                    <div className="space-y-1 text-sm">
                      {analytics.searches.products.length === 0 && <div className="text-muted-foreground">Veri yok.</div>}
                      {analytics.searches.products.map((s) => (
                        <div key={s.term} className="flex justify-between border-b py-1 last:border-0">
                          <span className="truncate">{s.term}</span><span className="text-muted-foreground">{s.hits}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 text-sm font-medium">En çok aranan iller</div>
                    <div className="space-y-1 text-sm">
                      {analytics.searches.cities.length === 0 && <div className="text-muted-foreground">Veri yok.</div>}
                      {analytics.searches.cities.map((s) => (
                        <div key={s.term} className="flex justify-between border-b py-1 last:border-0">
                          <span className="truncate">{s.term}</span><span className="text-muted-foreground">{s.hits}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
              <div className="space-y-4 rounded-md border border-primary/20 bg-primary/5 p-4 sm:col-span-2">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Reklam slotunda yayınla</div>
                    <p className="text-xs text-muted-foreground">
                      Açıldığında ilan “Sponsorlu” ve “Öne çıkan” olur. Kapatıldığında iki durum da kaldırılır.
                    </p>
                  </div>
                  <Switch checked={adForm.enabled} onCheckedChange={(enabled) => setAdForm((prev) => ({ ...prev, enabled }))} />
                </div>
                {adForm.enabled ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="space-y-1 block sm:col-span-2">
                      <span className="text-sm text-muted-foreground">Reklam yeri</span>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={adForm.position} onChange={(e) => setAdForm((prev) => ({ ...prev, position: e.target.value, desktopRow: String(firstFreeRow(allAds, e.target.value, Number(prev.desktopColumns) || 1, prev.device, currentListingAd?.id)) }))}>
                        {AD_POSITIONS.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-sm text-muted-foreground">Süre / paket</span>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={adForm.package} onChange={(e) => setAdForm((prev) => ({ ...prev, package: e.target.value as AdForm['package'] }))}>
                        {(['daily', 'weekly', 'monthly'] as const).map((key) => <option key={key} value={key}>{PKG_LABEL[key]} · {pricing?.[key].price ?? 0} ₺</option>)}
                      </select>
                    </label>
                    <label className="flex items-center gap-2 rounded-md border p-3 text-sm sm:col-span-2 lg:col-span-3">
                      <input type="checkbox" checked={adForm.paymentConfirmed} onChange={(event) => setAdForm((prev) => ({ ...prev, paymentConfirmed: event.target.checked }))} />
                      Ödeme alındı — reklam yayına alınabilir
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-sm text-muted-foreground">Satır</span>
                      <Input type="number" min={1} max={20} value={adForm.desktopRow} onChange={(e) => setAdForm((prev) => ({ ...prev, desktopRow: e.target.value }))} />
                      {selectedRowBlockers.length ? (
                        <span className="block text-xs text-destructive">
                          Bu satır dolu: {selectedRowBlockers.map((ad) => `#${ad.id} ${ad.title ?? 'reklam'}`).join(', ')}. Boş ilk satır: {suggestedFreeRow}.
                        </span>
                      ) : (
                        <span className="block text-xs text-muted-foreground">Satır uygun.</span>
                      )}
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-sm text-muted-foreground">Satır kapasitesi</span>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={adForm.desktopColumns} onChange={(e) => setAdForm((prev) => ({ ...prev, desktopColumns: e.target.value, desktopRow: String(firstFreeRow(allAds, prev.position, Number(e.target.value) || 1, prev.device, currentListingAd?.id)) }))}>
                        <option value="1">1 reklam</option><option value="2">2 reklam</option><option value="3">3 reklam</option>
                      </select>
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-sm text-muted-foreground">Cihaz</span>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={adForm.device} onChange={(e) => setAdForm((prev) => ({ ...prev, device: e.target.value as AdForm['device'] }))}>
                        <option value="all">Tüm cihazlar</option><option value="desktop">Masaüstü</option><option value="mobile">Mobil</option>
                      </select>
                    </label>
                  </div>
                ) : null}
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
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                      <span>{item.productName} · {item.citySlug ?? 'TR'}</span>
                      {item.isSuspicious ? <Badge variant="destructive">Şüpheli fiyat</Badge> : null}
                      {listingAds.some((ad) => ad.listingId === item.id && isLiveAd(ad))
                        ? <Badge>Reklamda · Sponsorlu</Badge>
                        : item.isFeatured ? <Badge variant="secondary">Yalnız öne çıkan</Badge> : null}
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
