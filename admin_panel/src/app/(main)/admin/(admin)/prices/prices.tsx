'use client';

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
  return <PricesListPanel initialFilters={initialFilters} />;
}
