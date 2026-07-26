'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEarlyWarningAdminQuery } from '@/integrations/hooks';

/**
 * Erken Uyarı — soğan imzası. Önemli temel gıda 4 hafta kesintisiz tırmandığında
 * mainstream haber olmadan ~2 hafta önce yakalanır (soğan W28'de sinyal verdi,
 * viral W30'da patladı). Haftalık cron email/telegram ile de bildirir.
 */
export function EarlyWarningPanel() {
  const { data, isLoading } = useEarlyWarningAdminQuery();
  const items = data?.items ?? [];

  return (
    <Card className={items.some((i) => i.tier === 'güçlü') ? 'border-red-300' : undefined}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          🚨 Erken Uyarı — Fırlayan Temel Gıdalar
          {items.length > 0 && <Badge variant="destructive">{items.length}</Badge>}
        </CardTitle>
        <CardDescription>
          4 hafta kesintisiz tırmanan (soğan imzası), geniş/kararlı kapsamlı önemli ürünler.
          Viral haber olmadan ~2 hafta önce yakalar. Döngüsel/mevsimsel gürültü elenir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>4 hafta trend (TL/kg)</TableHead>
                <TableHead className="text-right">Toplam</TableHead>
                <TableHead className="text-right">Son hafta</TableHead>
                <TableHead className="text-right">Hal</TableHead>
                <TableHead>Sinyal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6}>Yükleniyor…</TableCell></TableRow>}
              {!isLoading && items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-muted-foreground">Şu an fırlayan temel gıda yok.</TableCell></TableRow>
              )}
              {items.map((it) => (
                <TableRow key={it.productSlug}>
                  <TableCell className="font-medium">{it.name}</TableCell>
                  <TableCell className="font-mono text-xs">{it.buckets.join(' → ')}</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">+%{it.pctChange}</TableCell>
                  <TableCell className="text-right">+%{it.lastWeekPct}</TableCell>
                  <TableCell className="text-right">{it.hals}</TableCell>
                  <TableCell>
                    <Badge variant={it.tier === 'güçlü' ? 'destructive' : 'secondary'}>
                      {it.tier === 'güçlü' ? '🔴 Güçlü' : '🟡 İzle'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
