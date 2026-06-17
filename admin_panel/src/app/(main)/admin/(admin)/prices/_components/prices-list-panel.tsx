'use client';

import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListMarketsAdminQuery,
  useListPriceCategoriesAdminQuery,
  useListPricesAdminQuery,
} from '@/integrations/hooks';

interface Props {
  initialFilters?: { q?: string; market?: string; city?: string; category?: string; range?: string };
}

const ALL = 'all';
const PAGE_SIZES = [25, 50, 100, 250];

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export default function PricesListPanel({ initialFilters }: Props) {
  const [q, setQ] = React.useState(initialFilters?.q || '');
  const [category, setCategory] = React.useState(initialFilters?.category || ALL);
  const [city, setCity] = React.useState(initialFilters?.city || ALL);
  const [market, setMarket] = React.useState(initialFilters?.market || ALL);
  const [range, setRange] = React.useState(initialFilters?.range || '3650d');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(50);

  const debouncedQ = useDebounced(q, 400);

  // Dropdown kaynakları (dinamik)
  const { data: marketsData } = useListMarketsAdminQuery(undefined);
  const { data: categoriesData } = useListPriceCategoriesAdminQuery();
  const markets = React.useMemo(() => marketsData?.items ?? [], [marketsData]);
  const categories = categoriesData?.items ?? [];
  const cities = React.useMemo(
    () => Array.from(new Set(markets.map((m) => m.cityName).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr')),
    [markets],
  );

  // Filtre değişince ilk sayfaya dön
  React.useEffect(() => {
    setPage(1);
  }, [debouncedQ, category, city, market, range, pageSize]);

  const { data, isLoading, isFetching } = useListPricesAdminQuery({
    q: debouncedQ || undefined,
    category: category === ALL ? undefined : category,
    city: city === ALL ? undefined : city,
    market: market === ALL ? undefined : market,
    range,
    latestOnly: true,
    page,
    limit: pageSize,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function clearFilters() {
    setQ('');
    setCategory(ALL);
    setCity(ALL);
    setMarket(ALL);
    setRange('3650d');
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Filtreler</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearFilters}>Temizle</Button>
            <Button asChild size="sm"><Link href="/admin/prices/new">Yeni Fiyat</Link></Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-5">
          <div className="space-y-2">
            <Label>Ürün ara</Label>
            <Input value={q} placeholder="biber, domates..." onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tümü</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{c.slug} ({c.count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Şehir</Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tümü</SelectItem>
                {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hal</Label>
            <Select value={market} onValueChange={setMarket}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tümü</SelectItem>
                {markets.map((m) => <SelectItem key={m.slug} value={m.slug}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Aralık</Label>
            <Input value={range} onChange={(e) => setRange(e.target.value)} placeholder="3650d" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">
            Fiyat Kayıtları
            <span className="ml-2 text-muted-foreground text-sm font-normal">
              (toplam {total}{isFetching ? ' · güncelleniyor…' : ''})
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Sayfa boyutu</Label>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-20"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
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
                <TableRow><TableCell colSpan={8}>Yükleniyor...</TableCell></TableRow>
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
                <TableRow><TableCell colSpan={8}>Kayıt bulunamadı.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-muted-foreground text-sm">Sayfa {page} / {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                ‹ Önceki
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || isFetching} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                Sonraki ›
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
