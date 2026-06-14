// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/google-ads-products-panel.tsx
// Ürün performansı (Shopping/PMax feed) — e-ticaret hesapları için
// =============================================================

'use client';

import * as React from 'react';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGoogleAdsProductsQuery } from '@/integrations/hooks';
import {
  GOOGLE_ADS_DATE_RANGES,
  formatCpa,
  formatNumber,
  formatRoas,
  microsToUnit,
  type GoogleAdsDateRange,
} from '@/integrations/shared';

type Props = { hasCredentials: boolean; customerId?: string };

export default function GoogleAdsProductsPanel({ hasCredentials, customerId }: Props) {
  const t = useAdminT('admin.googleAds');
  const [range, setRange] = React.useState<GoogleAdsDateRange>('LAST_30_DAYS');
  const { data, isFetching } = useGoogleAdsProductsQuery(
    { range, customer_id: customerId || undefined },
    { skip: !hasCredentials },
  );
  const items = data?.items ?? [];

  if (!hasCredentials) {
    return <Card><CardContent className="py-6 text-muted-foreground text-sm">{t('campaigns.needCredentials')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{t('products.title')}</CardTitle>
          <CardDescription>{t('products.description')}</CardDescription>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as GoogleAdsDateRange)}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {GOOGLE_ADS_DATE_RANGES.map((item) => (
              <SelectItem key={item} value={item}>{t(`campaigns.ranges.${item}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isFetching && !data ? (
          <p className="py-6 text-muted-foreground text-sm">{t('campaigns.loading')}</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-muted-foreground text-sm">{t('products.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b text-left text-muted-foreground text-xs">
                  <th className="py-2 pr-3">{t('products.columns.product')}</th>
                  <th className="py-2 pr-3">{t('insights.columns.campaign')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.impressions')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.clicks')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.cost')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.conversions')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.cpa')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.convValue')}</th>
                  <th className="py-2 text-right">{t('campaigns.columns.roas')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={`${row.item_id}-${idx}`} className="border-border/60 border-b">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{row.title || row.item_id}</div>
                      {row.title ? <div className="text-muted-foreground text-xs">{row.item_id}</div> : null}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground text-xs">{row.campaign}</td>
                    <td className="py-2 pr-3 text-right">{formatNumber(row.impressions)}</td>
                    <td className="py-2 pr-3 text-right">{formatNumber(row.clicks)}</td>
                    <td className="py-2 pr-3 text-right">{microsToUnit(row.cost_micros)}</td>
                    <td className="py-2 pr-3 text-right">{formatNumber(row.conversions)}</td>
                    <td className="py-2 pr-3 text-right">{formatCpa(row.cost_micros, row.conversions)}</td>
                    <td className="py-2 pr-3 text-right">{formatNumber(row.conversions_value)}</td>
                    <td className="py-2 text-right">{formatRoas(row.conversions_value, row.cost_micros)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
