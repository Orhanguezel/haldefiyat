'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreatePriceAdminMutation,
  useGetPriceAdminQuery,
  useListHfProductsAdminQuery,
  useListMarketsAdminQuery,
  useUpdatePriceAdminMutation,
} from '@/integrations/hooks';

interface Props {
  id: string;
}

export default function PriceDetailClient({ id }: Props) {
  const router = useRouter();
  const isNew = id === 'new';
  const { data } = useGetPriceAdminQuery(id, { skip: isNew });
  const { data: products } = useListHfProductsAdminQuery({ isActive: true });
  const { data: markets } = useListMarketsAdminQuery({ isActive: true });
  const [createPrice, createState] = useCreatePriceAdminMutation();
  const [updatePrice, updateState] = useUpdatePriceAdminMutation();

  const [form, setForm] = React.useState({
    productId: 0,
    marketId: 0,
    avgPrice: '',
    minPrice: '',
    maxPrice: '',
    recordedDate: '',
    sourceApi: 'manual',
  });

  React.useEffect(() => {
    if (!data) return;
    setForm({
      productId: data.productId,
      marketId: data.marketId,
      avgPrice: String(data.avgPrice ?? ''),
      minPrice: data.minPrice ? String(data.minPrice) : '',
      maxPrice: data.maxPrice ? String(data.maxPrice) : '',
      recordedDate: String(data.recordedDate).slice(0, 10),
      sourceApi: data.sourceApi || 'manual',
    });
  }, [data]);

  const isSaving = createState.isLoading || updateState.isLoading;

  const onSubmit = async () => {
    if (!form.productId || !form.marketId || !form.avgPrice || !form.recordedDate) {
      toast.error('Urun, hal, tarih ve ortalama fiyat zorunludur.');
      return;
    }

    const payload = {
      productId: Number(form.productId),
      marketId: Number(form.marketId),
      avgPrice: Number(form.avgPrice),
      minPrice: form.minPrice ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
      recordedDate: form.recordedDate,
      sourceApi: form.sourceApi || 'manual',
    };

    try {
      if (isNew) {
        const result = await createPrice(payload).unwrap();
        toast.success('Fiyat kaydi olusturuldu.');
        if (result.id) router.push(`/admin/prices/${result.id}`);
      } else {
        await updatePrice({ id, body: payload }).unwrap();
        toast.success('Fiyat kaydi guncellendi.');
      }
    } catch (error: any) {
      toast.error(error?.data?.error || error?.message || 'Kaydetme hatasi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{isNew ? 'Yeni Fiyat' : 'Fiyat Detayi'}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/prices')}>Geri</Button>
          <Button onClick={onSubmit} disabled={isSaving}>Kaydet</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kayit Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Urun ID</Label>
            <Input list="price-products" value={form.productId || ''} onChange={(e) => setForm((p) => ({ ...p, productId: Number(e.target.value) }))} />
            <datalist id="price-products">
              {(products?.items || []).map((item) => (
                <option key={item.id} value={item.id}>{item.nameTr}</option>
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Hal ID</Label>
            <Input list="price-markets" value={form.marketId || ''} onChange={(e) => setForm((p) => ({ ...p, marketId: Number(e.target.value) }))} />
            <datalist id="price-markets">
              {(markets?.items || []).map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Ortalama Fiyat</Label>
            <Input type="number" step="0.01" value={form.avgPrice} onChange={(e) => setForm((p) => ({ ...p, avgPrice: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Tarih</Label>
            <Input type="date" value={form.recordedDate} onChange={(e) => setForm((p) => ({ ...p, recordedDate: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Min Fiyat</Label>
            <Input type="number" step="0.01" value={form.minPrice} onChange={(e) => setForm((p) => ({ ...p, minPrice: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Maks Fiyat</Label>
            <Input type="number" step="0.01" value={form.maxPrice} onChange={(e) => setForm((p) => ({ ...p, maxPrice: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Kaynak</Label>
            <Input value={form.sourceApi} onChange={(e) => setForm((p) => ({ ...p, sourceApi: e.target.value }))} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
