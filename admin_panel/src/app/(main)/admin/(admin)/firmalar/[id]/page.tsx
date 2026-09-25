'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';

import { useGetFirmAdminQuery, useListFirmClaimsAdminQuery } from '@/integrations/hooks';
import { useAdminT } from '../../../_components/common/use-admin-t';
import { FirmSheet } from '../_components/firm-sheet';

// Dogrudan URL de listeyle ayni sag detay cekmecesini acar.
// Firma tekil uctan cekilir; liste sorgusundan turetmek sayfalandirma nedeniyle
// ilk N kaydin disindaki firmalarda "bulunamadi" verirdi.
export default function FirmDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const firmId = Number(id);
  const router = useRouter();
  const t = useAdminT('admin.firms');
  const tc = useAdminT('admin.common');

  const { data, isLoading } = useGetFirmAdminQuery(
    { firmId },
    { skip: !Number.isFinite(firmId) || firmId <= 0 },
  );
  const { data: claims } = useListFirmClaimsAdminQuery({ status: 'all' });
  const firm = data?.item;

  if (isLoading && !firm) {
    return <div className="p-6 text-muted-foreground text-sm">Yükleniyor...</div>;
  }

  if (!firm) {
    return <div className="p-6 text-muted-foreground text-sm">Firma bulunamadı.</div>;
  }

  return (
    <FirmSheet
      firm={firm}
      claims={claims?.items ?? []}
      onClose={() => router.push('/admin/firmalar')}
      t={t}
      tc={tc}
    />
  );
}
