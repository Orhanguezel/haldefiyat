'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TranslateFn } from '@/i18n';
import { useEtlFreshnessAdminQuery } from '@/integrations/hooks';

/** "Basarili calisti" ile "yeni veri geldi" ayni sey degil: gunluk parmak izi degismiyorsa kaynak donmustur. */
export function SourceFreshnessPanel({ t, tc }: { t: TranslateFn; tc: TranslateFn }) {
  const { data, isLoading } = useEtlFreshnessAdminQuery();
  const sources = data?.sources ?? [];
  const jumps = data?.priceJumps ?? [];
  const staleCount = sources.filter((s) => s.isStale).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('freshness.title')}</CardTitle>
          <CardDescription>{t('freshness.hint')}{staleCount > 0 ? <strong> {t('freshness.staleCount', { count: staleCount })}</strong> : null}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('freshness.source')}</TableHead>
                  <TableHead>{t('freshness.lastChanged')}</TableHead>
                  <TableHead className="text-right">{t('freshness.staleDays')}</TableHead>
                  <TableHead className="text-right">{t('freshness.baseline')}</TableHead>
                  <TableHead className="text-right">{t('freshness.rows')}</TableHead>
                  <TableHead>{t('freshness.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={6}>{tc('loading')}</TableCell></TableRow> : null}
                {!isLoading && sources.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">{tc('noData')}</TableCell></TableRow> : null}
                {sources.map((s) => (
                  <TableRow key={s.sourceApi}>
                    <TableCell className="font-mono text-xs font-medium">{s.sourceApi}</TableCell>
                    <TableCell className="whitespace-nowrap">{s.lastChanged}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.staleDays}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{s.baselineDays}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.rows}</TableCell>
                    <TableCell>{s.isStale ? <Badge variant="destructive">{t('freshness.frozen')}</Badge> : <Badge variant="secondary">{t('freshness.normal')}</Badge>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {jumps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('freshness.peerTitle')}</CardTitle>
            <CardDescription>{t('freshness.peerHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('freshness.market')}</TableHead>
                    <TableHead>{t('freshness.product')}</TableHead>
                    <TableHead className="text-right">{t('freshness.value')}</TableHead>
                    <TableHead className="text-right">{t('freshness.peerMedian')}</TableHead>
                    <TableHead className="text-right">{t('freshness.ratio')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jumps.map((j) => (
                    <TableRow key={`${j.marketName}-${j.productSlug}`}>
                      <TableCell>{j.marketName}</TableCell>
                      <TableCell className="font-medium">{j.productSlug}</TableCell>
                      <TableCell className="text-right tabular-nums">{j.value}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{j.peerMedian}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{j.ratio}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
