'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PricesListPanel from './_components/prices-list-panel';

interface Props {
  initialFilters?: {
    q?: string;
    market?: string;
    city?: string;
    category?: string;
    range?: string;
  };
}

export default function PricesPage({ initialFilters }: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Fiyat Yonetimi</CardTitle>
            <Button asChild variant="outline" size="sm"><Link href="/admin/prices/quarantine">İnceleme kuyruğu</Link></Button>
          </div>
          <CardDescription>Hal fiyat kayitlarini filtreleyin, yeni kayit ekleyin ve duzenleyin.</CardDescription>
        </CardHeader>
      </Card>

      <PricesListPanel initialFilters={initialFilters} />
    </div>
  );
}
