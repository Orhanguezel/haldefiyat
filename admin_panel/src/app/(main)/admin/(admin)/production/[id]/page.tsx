'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProductionAdminMutation, useGetProductionAdminQuery, useUpdateProductionAdminMutation } from '@/integrations/hooks';

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [routeId, setRouteId] = useState('new');
  useEffect(() => { setRouteId(String(params?.id || 'new')); }, [params]);
  const isNew = routeId === 'new';
  const { data } = useGetProductionAdminQuery(routeId, { skip: isNew });
  const [createItem] = useCreateProductionAdminMutation();
  const [updateItem] = useUpdateProductionAdminMutation();
  const [form, setForm] = useState({ year: '', species: '', speciesSlug: '', categorySlug: 'diger', regionSlug: 'tr', productionTon: '', sourceApi: 'manual', note: '' });

  useEffect(() => {
    if (!data) return;
    setForm({
      year: String(data.year),
      species: data.species,
      speciesSlug: data.speciesSlug,
      categorySlug: data.categorySlug,
      regionSlug: data.regionSlug,
      productionTon: String(data.productionTon),
      sourceApi: data.sourceApi,
      note: data.note || '',
    });
  }, [data]);

  const save = async () => {
    const body = {
      year: Number(form.year),
      species: form.species,
      speciesSlug: form.speciesSlug,
      categorySlug: form.categorySlug,
      regionSlug: form.regionSlug,
      productionTon: Number(form.productionTon),
      sourceApi: form.sourceApi,
      note: form.note || null,
    };
    try {
      if (isNew) {
        const res = await createItem(body).unwrap();
        toast.success('Uretim kaydi olusturuldu.');
        if (res.id) router.push(`/admin/production/${res.id}`);
      } else {
        await updateItem({ id: routeId, body }).unwrap();
        toast.success('Uretim kaydi guncellendi.');
      }
    } catch (error: any) {
      toast.error(error?.data?.error || error?.message || 'Kaydetme hatasi');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{isNew ? 'Yeni Uretim Kaydi' : 'Uretim Detayi'}</CardTitle>
        <div className="flex gap-2"><Button variant="outline" onClick={() => router.push('/admin/production')}>Geri</Button><Button onClick={save}>Kaydet</Button></div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Yil</Label><Input type="number" value={form.year} onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Tur</Label><Input value={form.species} onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Tur Slug</Label><Input value={form.speciesSlug} onChange={(e) => setForm((p) => ({ ...p, speciesSlug: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Kategori</Label><Input value={form.categorySlug} onChange={(e) => setForm((p) => ({ ...p, categorySlug: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Bolge</Label><Input value={form.regionSlug} onChange={(e) => setForm((p) => ({ ...p, regionSlug: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Ton</Label><Input type="number" step="0.01" value={form.productionTon} onChange={(e) => setForm((p) => ({ ...p, productionTon: e.target.value }))} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Kaynak</Label><Input value={form.sourceApi} onChange={(e) => setForm((p) => ({ ...p, sourceApi: e.target.value }))} /></div>
      </CardContent>
    </Card>
  );
}
