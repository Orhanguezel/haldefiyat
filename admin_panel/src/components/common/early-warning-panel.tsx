'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEarlyWarningAdminQuery } from '@/integrations/hooks';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

/**
 * Erken uyari — sogan imzasi: onemli temel gida 4 hafta kesintisiz tirmandiginda
 * mainstream haber olmadan ~2 hafta once yakalanir. Haftalik cron da bildirir.
 */
export function EarlyWarningPanel() {
  const t = useAdminT('admin.etl.warning');
  const tc = useAdminT('admin.common');
  const { data, isLoading } = useEarlyWarningAdminQuery();
  const items = data?.items ?? [];

  return (
    <Card className={items.some((i) => i.tier === 'güçlü') ? 'border-rose-300' : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {t('title')}
          {items.length > 0 ? <Badge variant="destructive">{items.length}</Badge> : null}
        </CardTitle>
        <CardDescription>{t('hint')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('product')}</TableHead>
                <TableHead>{t('trend')}</TableHead>
                <TableHead className="text-right">{t('total')}</TableHead>
                <TableHead className="text-right">{t('lastWeek')}</TableHead>
                <TableHead className="text-right">{t('markets')}</TableHead>
                <TableHead>{t('signal')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6}>{tc('loading')}</TableCell></TableRow> : null}
              {!isLoading && items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">{t('empty')}</TableCell></TableRow> : null}
              {items.map((it) => (
                <TableRow key={it.productSlug}>
                  <TableCell className="font-medium">{it.name}</TableCell>
                  <TableCell className="font-mono text-xs">{it.buckets.join(' → ')}</TableCell>
                  <TableCell className="text-right font-semibold text-rose-600">+%{it.pctChange}</TableCell>
                  <TableCell className="text-right">+%{it.lastWeekPct}</TableCell>
                  <TableCell className="text-right">{it.hals}</TableCell>
                  <TableCell><Badge variant={it.tier === 'güçlü' ? 'destructive' : 'secondary'}>{it.tier === 'güçlü' ? t('strong') : t('watch')}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
