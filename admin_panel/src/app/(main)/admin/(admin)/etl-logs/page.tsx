'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListEtlLogsAdminQuery } from '@/integrations/hooks';

export default function Page() {
  const { data, isLoading } = useListEtlLogsAdminQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ETL Loglari</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Kaynak</TableHead><TableHead>Tarih</TableHead><TableHead>Rows Fetched</TableHead><TableHead>Status</TableHead><TableHead>Sure</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5}>Yukleniyor...</TableCell></TableRow>}
            {(data?.logs || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.sourceApi}</TableCell>
                <TableCell>{String(item.runDate).slice(0, 10)}</TableCell>
                <TableCell>{item.rowsFetched}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.durationMs ?? '-'} ms</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
