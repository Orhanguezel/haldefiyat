'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateMarketAdminMutation, useGetMarketAdminQuery, useUpdateMarketAdminMutation } from '@/integrations/hooks';

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [routeId, setRouteId] = useState('new');
  useEffect(() => { setRouteId(String(params?.id || 'new')); }, [params]);
  const isNew = routeId === 'new';
  const { data } = useGetMarketAdminQuery(routeId, { skip: isNew });
  const [createItem] = useCreateMarketAdminMutation();
  const [updateItem] = useUpdateMarketAdminMutation();
  const [form, setForm] = useState({ slug: '', name: '', cityName: '', regionSlug: '', sourceKey: '', displayOrder: '0', isActive: true });

  useEffect(() => {
    if (!data) return;
    setForm({
      slug: data.slug,
      name: data.name,
      cityName: data.cityName,
      regionSlug: data.regionSlug || '',
      sourceKey: data.sourceKey || '',
      displayOrder: String(data.displayOrder ?? 0),
      isActive: Boolean(data.isActive),
    });
  }, [data]);

  const save = async () => {
    const body = {
      slug: form.slug,
      name: form.name,
      cityName: form.cityName,
      regionSlug: form.regionSlug || null,
      sourceKey: form.sourceKey || null,
      displayOrder: Number(form.displayOrder || 0),
      isActive: form.isActive,
    };
    try {
      if (isNew) {
        const res = await createItem(body).unwrap();
        toast.success('Hal olusturuldu.');
        if (res.id) router.push(`/admin/markets/${res.id}`);
      } else {
        await updateItem({ id: routeId, body }).unwrap();
        toast.success('Hal guncellendi.');
      }
    } catch (error: any) {
      toast.error(error?.data?.error || error?.message || 'Kaydetme hatasi');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{isNew ? 'Yeni Hal' : 'Hal Detayi'}</CardTitle>
        <div className="flex gap-2"><Button variant="outline" onClick={() => router.push('/admin/markets')}>Geri</Button><Button onClick={save}>Kaydet</Button></div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Ad</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Sehir</Label><Input value={form.cityName} onChange={(e) => setForm((p) => ({ ...p, cityName: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Bolge</Label><Input value={form.regionSlug} onChange={(e) => setForm((p) => ({ ...p, regionSlug: e.target.value }))} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Kaynak Anahtari</Label><Input value={form.sourceKey} onChange={(e) => setForm((p) => ({ ...p, sourceKey: e.target.value }))} /></div>
      </CardContent>
    </Card>
  );
}
