'use client';

import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeleteAlertAdminMutation, useListAlertsAdminQuery, useUpdateAlertAdminMutation } from '@/integrations/hooks';

export default function Page() {
  const { data, isLoading } = useListAlertsAdminQuery({ limit: 200 });
  const [updateItem] = useUpdateAlertAdminMutation();
  const [deleteItem] = useDeleteAlertAdminMutation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uyari Listesi</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Urun</TableHead><TableHead>Esik</TableHead><TableHead>Yon</TableHead><TableHead>Kanal</TableHead><TableHead>Son Tetiklenme</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6}>Yukleniyor...</TableCell></TableRow>}
            {(data?.items || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.productName}</TableCell>
                <TableCell>{item.thresholdPrice}</TableCell>
                <TableCell>{item.direction}</TableCell>
                <TableCell>{item.contactEmail || item.contactTelegram || '-'}</TableCell>
                <TableCell>{item.lastTriggered ? String(item.lastTriggered).slice(0, 16) : '-'}</TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={async () => { await updateItem({ id: item.id, body: { isActive: !Boolean(item.isActive) } }).unwrap(); toast.success('Durum guncellendi.'); }}>
                    {Boolean(item.isActive) ? 'Pasiflestir' : 'Aktiflestir'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={async () => { await deleteItem(item.id).unwrap(); toast.success('Uyari silindi.'); }}>Sil</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
