// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/google-ads-conversion-health.tsx
// Dönüşüm sağlığı izleme — web (etiket) vs Google otomatik aksiyonlar, teşhis
// =============================================================

'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleAdsConversionHealthQuery } from '@/integrations/hooks';
import {
  ADS_CONV_CATEGORY_LABELS,
  ADS_CONV_ORIGIN_LABELS,
  ADS_CONV_VERDICT,
  adsLabel,
  formatNumber,
  type GoogleAdsDateRange,
} from '@/integrations/shared';

type Props = { hasCredentials: boolean; range: GoogleAdsDateRange; customerId?: string };

const TONE_ICON = {
  ok: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  warn: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  info: <Info className="h-5 w-5 text-muted-foreground" />,
};

export default function GoogleAdsConversionHealth({ hasCredentials, range, customerId }: Props) {
  const t = useAdminT('admin.googleAds');
  const { data } = useGoogleAdsConversionHealthQuery(
    { range, customer_id: customerId || undefined },
    { skip: !hasCredentials },
  );
  if (!data) return null;

  const verdict = ADS_CONV_VERDICT[data.verdict] ?? ADS_CONV_VERDICT.LOW_TRAFFIC;
  const border =
    verdict.tone === 'ok' ? 'border-emerald-500/40' : verdict.tone === 'warn' ? 'border-amber-500/50' : 'border-border';

  return (
    <Card className={border}>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-3">
          {TONE_ICON[verdict.tone]}
          <div>
            <CardTitle className="text-sm">{t('health.title')}</CardTitle>
            <CardDescription>{verdict.label}</CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline">{t('health.clicks')}: {formatNumber(data.clicks)}</Badge>
          <Badge variant={data.website_conversions > 0 ? 'default' : 'destructive'}>
            {t('health.websiteConv')}: {formatNumber(data.website_conversions)}
          </Badge>
          <Badge variant="secondary">{t('health.counted')}: {formatNumber(data.conversions)}</Badge>
          <Badge variant="outline">{t('health.allConv')}: {formatNumber(data.all_conversions)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-muted-foreground text-xs">{t('health.note')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b text-left text-muted-foreground text-xs">
                <th className="py-1.5 pr-3">{t('health.columns.action')}</th>
                <th className="py-1.5 pr-3">{t('health.columns.origin')}</th>
                <th className="py-1.5 pr-3">{t('health.columns.primary')}</th>
                <th className="py-1.5 pr-3 text-right">{t('health.columns.counted')}</th>
                <th className="py-1.5 text-right">{t('health.columns.all')}</th>
              </tr>
            </thead>
            <tbody>
              {data.actions.map((a) => (
                <tr key={a.name} className="border-border/60 border-b">
                  <td className="py-1.5 pr-3 font-medium">{a.name}</td>
                  <td className="py-1.5 pr-3">
                    <Badge variant={a.origin === 'WEBSITE' ? 'default' : 'secondary'}>
                      {adsLabel(ADS_CONV_ORIGIN_LABELS, a.origin)}
                    </Badge>
                  </td>
                  <td className="py-1.5 pr-3 text-muted-foreground text-xs">
                    {adsLabel(ADS_CONV_CATEGORY_LABELS, a.category)}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">{formatNumber(a.conversions)}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">{formatNumber(a.all_conversions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
