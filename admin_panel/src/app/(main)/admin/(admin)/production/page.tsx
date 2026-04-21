'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListProductionAdminQuery } from '@/integrations/hooks';

export default function Page() {
  const { data, isLoading } = useListProductionAdminQuery({ limit: 200 });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Yillik Uretim</CardTitle>
        <Button asChild size="sm"><Link href="/admin/production/new">Yeni Kayit</Link></Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Yil</TableHead><TableHead>Tur</TableHead><TableHead>Bolge</TableHead><TableHead>Ton</TableHead><TableHead>Kaynak</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5}>Yukleniyor...</TableCell></TableRow>}
            {(data?.items || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell><Link className="text-primary" href={`/admin/production/${item.id}`}>{item.year}</Link></TableCell>
                <TableCell>{item.species}</TableCell>
                <TableCell>{item.regionSlug}</TableCell>
                <TableCell>{item.productionTon}</TableCell>
                <TableCell>{item.sourceApi}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
