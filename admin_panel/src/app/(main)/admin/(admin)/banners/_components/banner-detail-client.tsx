'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Megaphone, Save } from 'lucide-react';
import { toast } from 'sonner';

import { AdminImageUploadField } from '@/components/common/admin-image-upload-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  BANNER_DEVICES,
  BANNER_POSITIONS,
  BANNER_TYPES,
  type BannerAdmin,
  type BannerDevice,
  type BannerPosition,
  type BannerType,
  type BannerUpsert,
} from '@/integrations/endpoints/banners-admin-endpoints';
import {
  useCreateBannerAdminMutation,
  useGetBannerAdminQuery,
  useUpdateBannerAdminMutation,
} from '@/integrations/hooks';
import { resolveMediaUrl } from '@/lib/media-url';

type FormState = {
  position: BannerPosition;
  title: string;
  advertiser: string;
  notes: string;
  type: BannerType;
  imageUrl: string;
  alt: string;
  linkUrl: string;
  linkTarget: string;
  rel: string;
  code: string;
  device: BannerDevice;
  weight: string;
  displayOrder: string;
  isActive: boolean;
  startAt: string;
  endAt: string;
};

function emptyForm(): FormState {
  return {
    position: 'home_mid',
    title: '',
    advertiser: '',
    notes: '',
    type: 'image',
    imageUrl: '',
    alt: '',
    linkUrl: '',
    linkTarget: '_blank',
    rel: 'sponsored nofollow noopener',
    code: '',
    device: 'all',
    weight: '1',
    displayOrder: '0',
    isActive: false,
    startAt: '',
    endAt: '',
  };
}

function toForm(b: BannerAdmin): FormState {
  return {
    position: b.position,
    title: b.title,
    advertiser: b.advertiser ?? '',
    notes: b.notes ?? '',
    type: b.type,
    imageUrl: b.imageUrl ?? '',
    alt: b.alt ?? '',
    linkUrl: b.linkUrl ?? '',
    linkTarget: b.linkTarget || '_blank',
    rel: b.rel || 'sponsored nofollow noopener',
    code: b.code ?? '',
    device: b.device,
    weight: String(b.weight ?? 1),
    displayOrder: String(b.displayOrder ?? 0),
    isActive: Boolean(b.isActive),
    startAt: b.startAt ? b.startAt.slice(0, 16) : '',
    endAt: b.endAt ? b.endAt.slice(0, 16) : '',
  };
}

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const positionSize = (value: string): string =>
  BANNER_POSITIONS.find((p) => p.value === value)?.size ?? '';

interface Props {
  id: string;
}

export function BannerDetailClient({ id }: Props) {
  const router = useRouter();
  const isNew = id === 'new';
  const { data: banner, refetch } = useGetBannerAdminQuery({ id }, { skip: isNew });
  const [createBanner, { isLoading: isCreating }] = useCreateBannerAdminMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerAdminMutation();

  const [form, setForm] = useState<FormState>(() => emptyForm());
  const initializedRef = useRef<string | null>(null);
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isNew) {
      initializedRef.current = 'new';
      setForm(emptyForm());
      return;
    }
    if (!banner) return;
    const key = `${banner.id}-${banner.updatedAt ?? ''}`;
    if (initializedRef.current === key) return;
    initializedRef.current = key;
    setForm(toForm(banner));
  }, [isNew, banner]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Başlık zorunlu.');
      return;
    }
    if (form.type === 'image' && !form.imageUrl.trim()) {
      toast.error('Görsel tipinde kapak görseli zorunlu.');
      return;
    }
    if (form.type === 'code' && !form.code.trim()) {
      toast.error('Kod tipinde HTML/kod zorunlu.');
      return;
    }

    const payload: BannerUpsert = {
      position: form.position,
      title: form.title.trim(),
      advertiser: form.advertiser.trim() || null,
      notes: form.notes.trim() || null,
      type: form.type,
      imageUrl: form.imageUrl.trim() || null,
      alt: form.alt.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      linkTarget: form.linkTarget || '_blank',
      rel: form.rel || 'sponsored nofollow noopener',
      code: form.code.trim() || null,
      device: form.device,
      weight: Number(form.weight) || 1,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
      startAt: toIso(form.startAt),
      endAt: toIso(form.endAt),
    };

    if (isNew) {
      const result = await createBanner(payload).unwrap();
      toast.success('Banner oluşturuldu');
      router.replace(`/admin/banners/${result.data.id}`);
      return;
    }

    if (!banner) return;
    await updateBanner({ id: banner.id, patch: payload }).unwrap();
    initializedRef.current = null;
    await refetch();
    toast.success('Banner kaydedildi');
  }

  const previewImg = form.imageUrl ? resolveMediaUrl(form.imageUrl) : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/banners')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Liste
          </Button>
          <div>
            <h1 className="flex items-center gap-2 font-semibold text-lg">
              <Megaphone className="h-5 w-5" />
              {isNew ? 'Yeni Banner' : 'Banner Düzenle'}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isNew ? 'Yeni reklam pasif olarak oluşturulur.' : `Gösterim: ${banner?.impressions ?? 0} · Tıklama: ${banner?.clicks ?? 0}`}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Save className="mr-1.5 h-4 w-4" />
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reklam Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Başlık (iç ad / alt metin)</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Reklam veren</Label>
              <Input value={form.advertiser} placeholder="VistaSeeds" onChange={(e) => set('advertiser', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Slot (pozisyon)</Label>
              <Select value={form.position} onValueChange={(v) => set('position', v as BannerPosition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BANNER_POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">Önerilen ölçü: {positionSize(form.position)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tip</Label>
                <Select value={form.type} onValueChange={(v) => set('type', v as BannerType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cihaz</Label>
                <Select value={form.device} onValueChange={(v) => set('device', v as BannerDevice)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_DEVICES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === 'image' ? (
              <>
                <AdminImageUploadField
                  label="Banner görseli"
                  helperText={`Önerilen ölçü: ${positionSize(form.position)}`}
                  value={form.imageUrl}
                  onChange={(url) => set('imageUrl', url ?? '')}
                  folder="uploads/banners"
                />
                <div className="grid gap-2">
                  <Label>Görsel alt metni</Label>
                  <Input value={form.alt} placeholder={form.title} onChange={(e) => set('alt', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Hedef link (URL)</Label>
                  <Input value={form.linkUrl} placeholder="https://vistaseeds.com.tr" onChange={(e) => set('linkUrl', e.target.value)} />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label>HTML / Kod (AdSense vb.)</Label>
                <Textarea
                  className="min-h-40 font-mono text-xs"
                  value={form.code}
                  onChange={(e) => set('code', e.target.value)}
                  placeholder="<script>...</script> veya <ins class='adsbygoogle' ...></ins>"
                />
                <p className="text-muted-foreground text-xs">Kod doğrudan sayfaya gömülür — yalnızca güvenilir reklam kodu girin.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Yayın & Zamanlama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-sm">Aktif (yayında)</Label>
                <p className="text-muted-foreground text-xs">Kapalıyken slotta gösterilmez.</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Başlangıç</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Bitiş</Label>
                <Input type="datetime-local" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Sıra (display_order)</Label>
                <Input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Ağırlık (rotasyon)</Label>
                <Input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Not</Label>
              <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sponsorlu · Önizleme
              </div>
              <div className="flex justify-center">
                {form.type === 'code' ? (
                  <div className="text-muted-foreground text-xs">Kod tipi — canlı sayfada render edilir.</div>
                ) : previewImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImg} alt={form.alt || form.title} className="max-h-40 max-w-full rounded border object-contain" />
                ) : (
                  <div className="text-muted-foreground text-xs">Görsel seçilmedi.</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
