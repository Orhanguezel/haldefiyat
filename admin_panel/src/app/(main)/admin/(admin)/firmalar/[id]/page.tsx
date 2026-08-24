'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useGetFirmAdminQuery } from '@/integrations/hooks';
import { FirmCrmPanel } from '../_components/firm-crm-panel';
import { FirmWorkspace } from '../_components/firm-workspace';

// Detay artik listenin en altinda acilan panel degil, kendi sayfasi.
// Firma tekil uctan cekilir: liste sorgusundan turetmek, sayfalandirma
// nedeniyle ilk N kaydin disindaki firmalarda "bulunamadi" verirdi.
export default function FirmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firmId = Number(id);
  const router = useRouter();

  const { data, isLoading } = useGetFirmAdminQuery(
    { firmId },
    { skip: !Number.isFinite(firmId) || firmId <= 0 },
  );
  const firm = data?.item;

  if (isLoading && !firm) {
    return <div className="p-6 text-sm text-muted-foreground">Yükleniyor...</div>;
  }

  if (!firm) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Firma bulunamadı.</p>
        <Button variant="outline" onClick={() => router.push('/admin/firmalar')}>
          Firma listesine dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" onClick={() => router.push('/admin/firmalar')}>
        ← Firma listesi
      </Button>
      <FirmWorkspace firm={firm} />
      <FirmCrmPanel firm={firm} onClose={() => router.push('/admin/firmalar')} />
    </div>
  );
}
