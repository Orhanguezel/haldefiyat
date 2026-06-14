// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/google-ads.tsx
// Admin Google Ads Page — çoklu hesap (MCC) + kampanya/analiz/rapor/ürün/öğe
// =============================================================

'use client';

import * as React from 'react';
import { Settings, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useGoogleAdsAccountsQuery,
  useGoogleAdsStatusQuery,
  useGoogleAdsVerifyMutation,
} from '@/integrations/hooks';
import { getErrorMessage } from '@/integrations/shared';

import GoogleAdsCampaignsPanel from './_components/google-ads-campaigns-panel';
import GoogleAdsInsightsPanel from './_components/google-ads-insights-panel';
import GoogleAdsReportPanel from './_components/google-ads-report-panel';
import GoogleAdsProductsPanel from './_components/google-ads-products-panel';
import GoogleAdsAssetsPanel from './_components/google-ads-assets-panel';

export default function GoogleAdsAdminPage() {
  const t = useAdminT('admin.googleAds');
  const { data: status, refetch: refetchStatus } = useGoogleAdsStatusQuery();
  const [adsVerify, { isLoading: verifying }] = useGoogleAdsVerifyMutation();
  const hasCredentials = Boolean(status?.has_credentials);

  const { data: accounts } = useGoogleAdsAccountsQuery(undefined, { skip: !hasCredentials });
  const [customerId, setCustomerId] = React.useState<string>('');
  const accountItems = accounts?.items ?? [];
  const activeCustomerId = customerId || status?.customer_id || '';
  const activeAccount = accountItems.find((a) => a.id === activeCustomerId);

  const handleVerify = async () => {
    try {
      const res = await adsVerify().unwrap();
      if (res.ok) {
        toast.success(`${t('header.verified')} (${res.customers?.length ?? 0} ${t('header.accounts')})`);
      } else {
        toast.error(t('header.verifyFailed'));
      }
    } catch (err) {
      toast.error(`${t('header.verifyFailed')}: ${getErrorMessage(err)}`);
    } finally {
      void refetchStatus();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-base">{t('header.title')}</CardTitle>
            <CardDescription>{t('header.description')}</CardDescription>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={hasCredentials ? 'default' : 'destructive'}>
                {hasCredentials ? t('header.credentialsOk') : t('header.credentialsMissing')}
              </Badge>
              {accountItems.length > 1 ? (
                <Select value={activeCustomerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="h-8 w-64">
                    <SelectValue placeholder={t('header.selectAccount')} />
                  </SelectTrigger>
                  <SelectContent>
                    {accountItems.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} {a.manager ? `(${t('header.mcc')})` : ''} — {a.currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : status?.customer_id ? (
                <Badge variant="outline">{status.customer_id}</Badge>
              ) : null}
              {activeAccount?.aw_id ? <Badge variant="outline">{activeAccount.aw_id}</Badge> : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerify}
              disabled={verifying || !hasCredentials}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {verifying ? t('header.verifying') : t('header.verify')}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/admin/site-settings?tab=api">
                <Settings className="mr-2 h-4 w-4" />
                {t('header.apiSettings')}
              </a>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList>
          <TabsTrigger value="campaigns">{t('tabs.campaigns')}</TabsTrigger>
          <TabsTrigger value="insights">{t('tabs.insights')}</TabsTrigger>
          <TabsTrigger value="report">{t('tabs.report')}</TabsTrigger>
          <TabsTrigger value="products">{t('tabs.products')}</TabsTrigger>
          <TabsTrigger value="assets">{t('tabs.assets')}</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <GoogleAdsCampaignsPanel hasCredentials={hasCredentials} customerId={activeCustomerId} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <GoogleAdsInsightsPanel hasCredentials={hasCredentials} range="LAST_30_DAYS" customerId={activeCustomerId} />
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <GoogleAdsReportPanel hasCredentials={hasCredentials} customerId={activeCustomerId} />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <GoogleAdsProductsPanel hasCredentials={hasCredentials} customerId={activeCustomerId} />
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <GoogleAdsAssetsPanel hasCredentials={hasCredentials} customerId={activeCustomerId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
