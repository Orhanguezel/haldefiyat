'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListMarketsAdminQuery } from '@/integrations/hooks';

export default function Page() {
  const { data, isLoading } = useListMarketsAdminQuery({});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Haller</CardTitle>
        <Button asChild size="sm"><Link href="/admin/markets/new">Yeni Hal</Link></Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Ad</TableHead><TableHead>Sehir</TableHead><TableHead>Slug</TableHead><TableHead>Kaynak</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4}>Yukleniyor...</TableCell></TableRow>}
            {(data?.items || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell><Link className="text-primary" href={`/admin/markets/${item.id}`}>{item.name}</Link></TableCell>
                <TableCell>{item.cityName}</TableCell>
                <TableCell>{item.slug}</TableCell>
                <TableCell>{item.sourceKey || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
