'use client';

import Link from 'next/link';
import { Edit, Megaphone, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BANNER_POSITIONS,
  type BannerAdmin,
} from '@/integrations/endpoints/banners-admin-endpoints';
import {
  useDeleteBannerAdminMutation,
  useListBannersAdminQuery,
  useUpdateBannerAdminMutation,
} from '@/integrations/hooks';

const positionLabel = (value: string): string =>
  BANNER_POSITIONS.find((p) => p.value === value)?.label ?? value;

function ctr(banner: BannerAdmin): string {
  if (!banner.impressions) return '—';
  return `%${((banner.clicks / banner.impressions) * 100).toFixed(1)}`;
}

export default function Page() {
  const { data, isLoading, refetch } = useListBannersAdminQuery(undefined);
  const [deleteBanner] = useDeleteBannerAdminMutation();
  const [updateBanner] = useUpdateBannerAdminMutation();

  const banners = data?.items ?? [];

  async function handleToggle(banner: BannerAdmin) {
    await updateBanner({ id: banner.id, patch: { isActive: !banner.isActive } }).unwrap();
    await refetch();
    toast.success(banner.isActive ? 'Banner pasifleştirildi' : 'Banner yayına alındı');
  }

  async function handleDelete(banner: BannerAdmin) {
    if (!confirm(`"${banner.title}" reklamı silinsin mi?`)) return;
    await deleteBanner({ id: banner.id }).unwrap();
    await refetch();
    toast.success('Banner silindi');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" />
              Reklam / Bannerlar
            </CardTitle>
            <CardDescription>
              Frontend slotlarında gösterilen reklamları yönet. Görsel veya HTML/kod, zamanlama,
              cihaz hedefleme ve tıklama/gösterim takibi.
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href="/admin/banners/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Yeni Banner
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Cihaz</TableHead>
                <TableHead className="text-right">Gösterim</TableHead>
                <TableHead className="text-right">Tıklama</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9}>Yükleniyor...</TableCell>
                </TableRow>
              )}
              {!isLoading && banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>Henüz banner yok. "Yeni Banner" ile ilk reklamı ekleyin.</TableCell>
                </TableRow>
              )}
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="min-w-[240px] whitespace-normal">
                    <Link href={`/admin/banners/${banner.id}`} className="font-medium hover:underline">
                      {banner.title}
                    </Link>
                    {banner.advertiser && (
                      <div className="mt-0.5 text-muted-foreground text-xs">{banner.advertiser}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{positionLabel(banner.position)}</TableCell>
                  <TableCell className="text-sm">{banner.type === 'code' ? 'Kod' : 'Görsel'}</TableCell>
                  <TableCell className="text-sm">{banner.device}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{banner.impressions}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{banner.clicks}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{ctr(banner)}</TableCell>
                  <TableCell>
                    <button type="button" onClick={() => handleToggle(banner)}>
                      <Badge variant={banner.isActive ? 'default' : 'outline'}>
                        {banner.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/banners/${banner.id}`}>
                          <Edit className="mr-1.5 h-4 w-4" />
                          Düzenle
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(banner)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
