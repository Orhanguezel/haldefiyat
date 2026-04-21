'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListHfProductsAdminQuery } from '@/integrations/hooks';

export default function Page() {
  const { data, isLoading } = useListHfProductsAdminQuery({});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Urunler</CardTitle>
        <Button asChild size="sm"><Link href="/admin/hf-products/new">Yeni Urun</Link></Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead>Slug</TableHead><TableHead>Kategori</TableHead><TableHead>Birim</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4}>Yukleniyor...</TableCell></TableRow>}
            {(data?.items || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell><Link className="text-primary" href={`/admin/hf-products/${item.id}`}>{item.nameTr}</Link></TableCell>
                <TableCell>{item.slug}</TableCell>
                <TableCell>{item.categorySlug}</TableCell>
                <TableCell>{item.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
