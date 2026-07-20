'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEtlFreshnessAdminQuery } from '@/integrations/hooks';

/**
 * Kaynak tazeligi — "basarili calisti" ile "yeni veri geldi" ayni sey degil.
 * ETL loglari kac satir islendigini gosterir; bir kaynak her gun AYNI degerleri
 * yazarsa loglar 'ok' gorunur. Bu panel son degisim tarihini one cikarir.
 */
export function SourceFreshnessPanel() {
  const { data, isLoading } = useEtlFreshnessAdminQuery();
  const sources = data?.sources ?? [];
  const jumps = data?.priceJumps ?? [];
  const staleCount = sources.filter((s) => s.isStale).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kaynak Tazeligi</CardTitle>
          <CardDescription>
            Gunluk parmak izi (satir sayisi + fiyat toplami) degismiyorsa kaynak taze veri
            uretmiyordur. Esik mutlak degil, her kaynagin kendi tarihsel tabanina gore —
            bazi haller kronik yapiskan fiyatlidir.
            {staleCount > 0 && <strong> {staleCount} kaynak donmus.</strong>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Son degisim</TableHead>
                  <TableHead className="text-right">Gun sabit</TableHead>
                  <TableHead className="text-right">Kendi tabani</TableHead>
                  <TableHead className="text-right">Satir</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6}>Yukleniyor...</TableCell>
                  </TableRow>
                )}
                {!isLoading && sources.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      Veri yok.
                    </TableCell>
                  </TableRow>
                )}
                {sources.map((s) => (
                  <TableRow key={s.sourceApi}>
                    <TableCell className="font-medium">{s.sourceApi}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.lastChanged}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.staleDays}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {s.baselineDays}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.rows}</TableCell>
                    <TableCell>
                      {s.isStale ? (
                        <Badge variant="destructive">Donmus</Badge>
                      ) : (
                        <Badge variant="secondary">Normal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {jumps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Akran Sapmasi</CardTitle>
            <CardDescription>
              Bir (hal x urun) serisinin akranlarina gore KONUMU kaydi. Bolgesel fiyat farki
              normaldir; anlamli olan oranin degismesi — genelde yanlis urun eslesmesi belirtisi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hal</TableHead>
                    <TableHead>Urun</TableHead>
                    <TableHead className="text-right">Deger</TableHead>
                    <TableHead className="text-right">Akran medyani</TableHead>
                    <TableHead className="text-right">Kayma</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jumps.map((j) => (
                    <TableRow key={`${j.marketName}-${j.productSlug}`}>
                      <TableCell>{j.marketName}</TableCell>
                      <TableCell className="font-medium">{j.productSlug}</TableCell>
                      <TableCell className="text-right tabular-nums">{j.value}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {j.peerMedian}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {j.ratio}x
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
