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
    product?: string;
    market?: string;
    city?: string;
    category?: string;
    range?: string;
  };
}

export default function PricesListPanel({ initialFilters }: Props) {
  const [filters, setFilters] = React.useState({
    product: initialFilters?.product || '',
    market: initialFilters?.market || '',
    city: initialFilters?.city || '',
    category: initialFilters?.category || '',
    range: initialFilters?.range || '7d',
  });

  const { data, isLoading, isFetching } = useListPricesAdminQuery({
    ...filters,
    latestOnly: true,
    limit: 200,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Filtreler</CardTitle>
          <Button asChild size="sm">
            <Link href="/admin/prices/new">Yeni Fiyat</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Urun slug</Label>
            <Input value={filters.product} onChange={(e) => setFilters((p) => ({ ...p, product: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Hal slug</Label>
            <Input value={filters.market} onChange={(e) => setFilters((p) => ({ ...p, market: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Sehir</Label>
            <Input value={filters.city} onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Input value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Aralik</Label>
            <Input value={filters.range} onChange={(e) => setFilters((p) => ({ ...p, range: e.target.value }))} placeholder="7d" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Fiyat Kayitlari
            {isFetching ? ' guncelleniyor...' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Urun</TableHead>
                <TableHead>Hal</TableHead>
                <TableHead>Sehir</TableHead>
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
                  <TableCell colSpan={8}>Yukleniyor...</TableCell>
                </TableRow>
              )}
              {!isLoading && (data?.items || []).map((item) => (
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
              {!isLoading && !(data?.items || []).length && (
                <TableRow>
                  <TableCell colSpan={8}>Kayit bulunamadi.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
