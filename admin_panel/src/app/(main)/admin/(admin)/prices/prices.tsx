'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PricesListPanel from './_components/prices-list-panel';

interface Props {
  initialFilters?: {
    product?: string;
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
          <CardTitle className="text-base">Fiyat Yonetimi</CardTitle>
          <CardDescription>Hal fiyat kayitlarini filtreleyin, yeni kayit ekleyin ve duzenleyin.</CardDescription>
        </CardHeader>
      </Card>

      <PricesListPanel initialFilters={initialFilters} />
    </div>
  );
}
