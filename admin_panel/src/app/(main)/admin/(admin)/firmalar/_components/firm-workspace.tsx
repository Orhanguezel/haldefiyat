'use client';

import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetFirmManageQuery,
  useGetFirmPriceHistoryQuery,
  useCreateFirmProductAdminMutation,
  useDeleteFirmProductAdminMutation,
  useUpsertFirmPriceAdminMutation,
  useDeleteFirmPriceAdminMutation,
  useUploadFirmImageMutation,
  useUpdateFirmAdminMutation,
} from '@/integrations/hooks';
import type { FirmAdminItem } from '@/integrations/endpoints/firms-admin-endpoints';

const UNITS = ['kg', 'kasa', 'adet', 'demet', 'bağ', 'çuval'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function tl(value: string | number | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? `${n.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺` : '-';
}

/**
 * Firmanin kendi calisma alani: logo, urunler (gorselli) ve gunluk fiyat
 * girisi + gecmis. Ayni backend uclarini /hesabim/firmam da kullanir; yetki
 * her istekte requireManageableFirm ile dogrulanir (sahip VEYA admin).
 */
export function FirmWorkspace({ firm }: { firm: FirmAdminItem }) {
  const firmId = firm.id;
  const { data, isLoading } = useGetFirmManageQuery({ firmId });
  const [historyDays, setHistoryDays] = useState(30);
  const { data: history } = useGetFirmPriceHistoryQuery({ firmId, days: historyDays });

  const [uploadImage, { isLoading: isUploading }] = useUploadFirmImageMutation();
  const [updateFirm] = useUpdateFirmAdminMutation();
  const [createProduct, { isLoading: isCreatingProduct }] = useCreateFirmProductAdminMutation();
  const [deleteProduct] = useDeleteFirmProductAdminMutation();
  const [upsertPrice, { isLoading: isSavingPrice }] = useUpsertFirmPriceAdminMutation();
  const [deletePrice] = useDeleteFirmPriceAdminMutation();

  const logoRef = useRef<HTMLInputElement>(null);
  const productImageRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [product, setProduct] = useState({ productName: '', note: '', price: '', imageUrl: '' });
  const [price, setPrice] = useState({
    productName: '', unit: 'kg', minPrice: '', avgPrice: '', maxPrice: '', recordedDate: today(),
  });

  const item = data?.item;

  async function pickAndUpload(file: File): Promise<string | null> {
    setError('');
    try {
      const res = await uploadImage({ file }).unwrap();
      return res.url;
    } catch {
      setError('Görsel yüklenemedi. JPEG/PNG/WebP, en fazla 5 MB olmalı.');
      return null;
    }
  }

  async function handleLogo(file: File) {
    const url = await pickAndUpload(file);
    if (!url) return;
    await updateFirm({ firmId, body: { photoUrl: url } }).unwrap();
    setNotice('Logo güncellendi.');
  }

  async function handleAddProduct() {
    setError('');
    if (product.productName.trim().length < 1) {
      setError('Ürün adı zorunlu.');
      return;
    }
    await createProduct({
      firmId,
      body: {
        productName: product.productName.trim(),
        note: product.note.trim() || null,
        price: product.price.trim() || null,
        imageUrl: product.imageUrl || null,
      },
    }).unwrap();
    setProduct({ productName: '', note: '', price: '', imageUrl: '' });
    setNotice('Ürün eklendi.');
  }

  async function handleSavePrice() {
    setError('');
    const avg = Number(price.avgPrice.replace(',', '.'));
    if (!price.productName.trim() || !Number.isFinite(avg) || avg <= 0) {
      setError('Ürün adı ve geçerli bir ortalama fiyat zorunlu.');
      return;
    }
    const min = price.minPrice ? Number(price.minPrice.replace(',', '.')) : null;
    const max = price.maxPrice ? Number(price.maxPrice.replace(',', '.')) : null;
    if (min != null && min > avg) { setError('En düşük fiyat ortalamadan büyük olamaz.'); return; }
    if (max != null && max < avg) { setError('En yüksek fiyat ortalamadan küçük olamaz.'); return; }
    try {
      await upsertPrice({
        firmId,
        body: {
          productName: price.productName.trim(),
          unit: price.unit,
          minPrice: min,
          maxPrice: max,
          avgPrice: avg,
          recordedDate: price.recordedDate,
        },
      }).unwrap();
      setPrice({ ...price, productName: '', minPrice: '', avgPrice: '', maxPrice: '' });
      setNotice('Fiyat kaydedildi.');
    } catch {
      setError('Fiyat kaydedilemedi. Tarih gelecekte olamaz.');
    }
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="space-y-4">
      {(error || notice) && (
        <div className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-red-300 text-red-600' : 'border-emerald-300 text-emerald-700'}`}>
          {error || notice}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Firma Logosu</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          {item?.photoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={item.photoUrl} alt={`${firm.name} logosu`} className="h-20 w-20 rounded-md border object-cover" />
            : <div className="flex h-20 w-20 items-center justify-center rounded-md border text-xs text-muted-foreground">Logo yok</div>}
          <div className="space-y-2">
            <input
              ref={logoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleLogo(f); e.target.value = ''; }}
            />
            <Button size="sm" variant="outline" onClick={() => logoRef.current?.click()} disabled={isUploading}>
              {isUploading ? 'Yükleniyor...' : 'Logo yükle'}
            </Button>
            <p className="text-xs text-muted-foreground">JPEG, PNG veya WebP · en fazla 5 MB</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ürünler</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_140px_auto]">
            <Input placeholder="Ürün adı" value={product.productName} onChange={(e) => setProduct({ ...product, productName: e.target.value })} />
            <Input placeholder="Not (opsiyonel)" value={product.note} onChange={(e) => setProduct({ ...product, note: e.target.value })} />
            <Input placeholder="Fiyat notu" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} />
            <div className="flex gap-2">
              <input
                ref={productImageRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) { const url = await pickAndUpload(f); if (url) setProduct((p) => ({ ...p, imageUrl: url })); }
                  e.target.value = '';
                }}
              />
              <Button size="sm" variant="outline" onClick={() => productImageRef.current?.click()} disabled={isUploading}>
                {product.imageUrl ? 'Görsel ✓' : 'Görsel'}
              </Button>
              <Button size="sm" onClick={handleAddProduct} disabled={isCreatingProduct}>Ekle</Button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Görsel</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Not</TableHead>
                  <TableHead>Fiyat notu</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(item?.products ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.imageUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.imageUrl} alt={p.productName} className="h-10 w-10 rounded border object-cover" />
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-medium">{p.productName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.note || '-'}</TableCell>
                    <TableCell className="text-sm">{p.price || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm(`"${p.productName}" silinsin mi?`)) void deleteProduct({ firmId, productId: p.id });
                        }}
                      >
                        Sil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(item?.products ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-sm text-muted-foreground">Henüz ürün eklenmemiş.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Günlük Fiyat Girişi</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[1.5fr_100px_110px_110px_110px_140px_auto]">
            <Input placeholder="Ürün adı" value={price.productName} onChange={(e) => setPrice({ ...price, productName: e.target.value })} />
            <select
              className="h-9 rounded-md border bg-transparent px-2 text-sm"
              value={price.unit}
              onChange={(e) => setPrice({ ...price, unit: e.target.value })}
            >
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <Input placeholder="En düşük" value={price.minPrice} onChange={(e) => setPrice({ ...price, minPrice: e.target.value })} />
            <Input placeholder="Ortalama *" value={price.avgPrice} onChange={(e) => setPrice({ ...price, avgPrice: e.target.value })} />
            <Input placeholder="En yüksek" value={price.maxPrice} onChange={(e) => setPrice({ ...price, maxPrice: e.target.value })} />
            <Input type="date" max={today()} value={price.recordedDate} onChange={(e) => setPrice({ ...price, recordedDate: e.target.value })} />
            <Button size="sm" onClick={handleSavePrice} disabled={isSavingPrice}>Kaydet</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Aynı ürün + tarih tekrar kaydedilirse mevcut satır güncellenir. Bu fiyatlar yalnızca
            firmanın kendi sayfasında yayımlanır; hal ortalamalarını ve endeksi etkilemez.
          </p>

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Birim</TableHead>
                  <TableHead className="text-right">En düşük</TableHead>
                  <TableHead className="text-right">Ortalama</TableHead>
                  <TableHead className="text-right">En yüksek</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(item?.prices ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.productName}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell className="text-right">{tl(row.minPrice)}</TableCell>
                    <TableCell className="text-right font-semibold">{tl(row.avgPrice)}</TableCell>
                    <TableCell className="text-right">{tl(row.maxPrice)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => void deletePrice({ firmId, priceId: row.id })}
                      >
                        Sil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(item?.prices ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-sm text-muted-foreground">Bugün için fiyat girilmemiş.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Geçmiş Kayıtlar</CardTitle>
          <div className="flex gap-1">
            {[7, 30, 90].map((d) => (
              <Button key={d} size="sm" variant={historyDays === d ? 'default' : 'outline'} onClick={() => setHistoryDays(d)}>
                {d} gün
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(history?.items ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Seçilen aralıkta kayıt yok.</p>
          )}
          {(history?.items ?? []).map((day) => (
            <div key={day.date} className="rounded-md border">
              <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                <span className="text-sm font-semibold">{day.date}</span>
                <span className="text-xs text-muted-foreground">{day.items.length} ürün</span>
              </div>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableBody>
                    {day.items.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.productName}</TableCell>
                        <TableCell className="w-20">{row.unit}</TableCell>
                        <TableCell className="w-28 text-right">{tl(row.minPrice)}</TableCell>
                        <TableCell className="w-28 text-right font-semibold">{tl(row.avgPrice)}</TableCell>
                        <TableCell className="w-28 text-right">{tl(row.maxPrice)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
