'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateHfProductAdminMutation, useGetHfProductAdminQuery, useUpdateHfProductAdminMutation } from '@/integrations/hooks';

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [routeId, setRouteId] = useState('new');
  useEffect(() => { setRouteId(String(params?.id || 'new')); }, [params]);
  const isNew = routeId === 'new';
  const { data } = useGetHfProductAdminQuery(routeId, { skip: isNew });
  const [createItem] = useCreateHfProductAdminMutation();
  const [updateItem] = useUpdateHfProductAdminMutation();
  const [form, setForm] = useState({ slug: '', nameTr: '', categorySlug: 'diger', unit: 'kg', aliases: '', displayOrder: '0', isActive: true });

  useEffect(() => {
    if (!data) return;
    setForm({
      slug: data.slug,
      nameTr: data.nameTr,
      categorySlug: data.categorySlug,
      unit: data.unit,
      aliases: (data.aliases || []).join(', '),
      displayOrder: String(data.displayOrder ?? 0),
      isActive: Boolean(data.isActive),
    });
  }, [data]);

  const save = async () => {
    const body = {
      slug: form.slug,
      nameTr: form.nameTr,
      categorySlug: form.categorySlug,
      unit: form.unit,
      aliases: form.aliases.split(',').map((x) => x.trim()).filter(Boolean),
      displayOrder: Number(form.displayOrder || 0),
      isActive: form.isActive,
    };
    try {
      if (isNew) {
        const res = await createItem(body).unwrap();
        toast.success('Urun olusturuldu.');
        if (res.id) router.push(`/admin/hf-products/${res.id}`);
      } else {
        await updateItem({ id: routeId, body }).unwrap();
        toast.success('Urun guncellendi.');
      }
    } catch (error: any) {
      toast.error(error?.data?.error || error?.message || 'Kaydetme hatasi');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{isNew ? 'Yeni Urun' : 'Urun Detayi'}</CardTitle>
        <div className="flex gap-2"><Button variant="outline" onClick={() => router.push('/admin/hf-products')}>Geri</Button><Button onClick={save}>Kaydet</Button></div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Ad</Label><Input value={form.nameTr} onChange={(e) => setForm((p) => ({ ...p, nameTr: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Kategori</Label><Input value={form.categorySlug} onChange={(e) => setForm((p) => ({ ...p, categorySlug: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Birim</Label><Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} /></div>
        <div className="space-y-2 md:col-span-2"><Label>Aliases (virgullu)</Label><Input value={form.aliases} onChange={(e) => setForm((p) => ({ ...p, aliases: e.target.value }))} /></div>
      </CardContent>
    </Card>
  );
}
