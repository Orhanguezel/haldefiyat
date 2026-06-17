'use client';

import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListPricesAdminQuery } from '@/integrations/hooks';

interface Props {
  initialFilters?: {
    q?: string;
    market?: string;
    city?: string;
    category?: string;
    range?: string;
  };
}

const RESULT_LIMIT = 2000;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export default function PricesListPanel({ initialFilters }: Props) {
  const [filters, setFilters] = React.useState({
    q: initialFilters?.q || '',
    market: initialFilters?.market || '',
    city: initialFilters?.city || '',
    category: initialFilters?.category || '',
    // Varsayılan geniş pencere: her ürünün EN GÜNCEL fiyatı görünsün (haftalık/aylık
    // güncellenen borsa ürünleri 7 günlük pencerede kaybolmasın).
    range: initialFilters?.range || '3650d',
  });

  const debouncedFilters = useDebounced(filters, 400);

  const { data, isLoading, isFetching } = useListPricesAdminQuery({
    ...debouncedFilters,
    latestOnly: true,
    limit: RESULT_LIMIT,
  });

  const items = data?.items || [];
  const capped = items.length >= RESULT_LIMIT;

  function set<K extends keyof typeof filters>(key: K, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({ q: '', market: '', city: '', category: '', range: '3650d' });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Filtreler</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>Temizle</Button>
            <Button asChild size="sm">
              <Link href="/admin/prices/new">Yeni Fiyat</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Ürün ara (ad/slug)</Label>
            <Input value={filters.q} placeholder="biber, domates..." onChange={(e) => set('q', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Şehir / Hal ara</Label>
            <Input value={filters.city} placeholder="antalya, izmir..." onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Hal slug (tam)</Label>
            <Input value={filters.market} placeholder="antalya-toptanci-hali" onChange={(e) => set('market', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kategori (tam slug)</Label>
            <Input value={filters.category} placeholder="sebze-meyve, bakliyat-kuru..." onChange={(e) => set('category', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Aralık</Label>
            <Input value={filters.range} onChange={(e) => set('range', e.target.value)} placeholder="3650d" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Fiyat Kayıtları
            <span className="ml-2 text-muted-foreground text-sm font-normal">
              ({items.length}{capped ? '+' : ''} kayıt{isFetching ? ' · güncelleniyor…' : ''})
            </span>
          </CardTitle>
          {capped && (
            <p className="text-muted-foreground text-xs">
              İlk {RESULT_LIMIT} kayıt gösteriliyor. Daha fazlası için ürün/şehir/kategori ile daraltın.
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Hal</TableHead>
                <TableHead>Şehir</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Ort</TableHead>
                <TableHead>Maks</TableHead>
                <TableHead>Kaynak</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8}>Yükleniyor...</TableCell>
                </TableRow>
              )}
              {!isLoading && items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link className="font-medium text-primary" href={`/admin/prices/${item.id}`}>
                      {item.productName}
                    </Link>
                  </TableCell>
                  <TableCell>{item.marketName}</TableCell>
                  <TableCell>{item.cityName}</TableCell>
                  <TableCell>{String(item.recordedDate).slice(0, 10)}</TableCell>
                  <TableCell>{item.minPrice ?? '-'}</TableCell>
                  <TableCell>{item.avgPrice}</TableCell>
                  <TableCell>{item.maxPrice ?? '-'}</TableCell>
                  <TableCell>{item.sourceApi}</TableCell>
                </TableRow>
              ))}
              {!isLoading && !items.length && (
                <TableRow>
                  <TableCell colSpan={8}>Kayıt bulunamadı.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
