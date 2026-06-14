// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/google-ads-offline-panel.tsx
// Offline dönüşüm import — gerçek teklifleri (gclid'li) Ads'e yükler
// =============================================================

'use client';

import * as React from 'react';
import { UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoogleAdsOfflineStatusQuery, useGoogleAdsOfflineUploadMutation } from '@/integrations/hooks';
import { formatNumber, getErrorMessage } from '@/integrations/shared';

type Props = { hasCredentials: boolean; customerId?: string };

export default function GoogleAdsOfflinePanel({ hasCredentials, customerId }: Props) {
  const t = useAdminT('admin.googleAds');
  const { data, refetch } = useGoogleAdsOfflineStatusQuery(undefined, { skip: !hasCredentials });
  const [upload, { isLoading }] = useGoogleAdsOfflineUploadMutation();

  const handleUpload = async () => {
    try {
      const res = await upload({ customer_id: customerId || undefined }).unwrap();
      if (res.uploaded > 0) {
        toast.success(`${res.uploaded} ${t('offline.uploadedToast')}`);
      } else if (res.received === 0) {
        toast.info(t('offline.nothingReady'));
      } else {
        toast.warning(`${t('offline.partial')} (${res.failed}/${res.received})`);
      }
      void refetch();
    } catch (err) {
      toast.error(`${t('offline.uploadFailed')}: ${getErrorMessage(err)}`);
    }
  };

  if (!hasCredentials || !data) return null;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle className="text-sm">{t('offline.title')}</CardTitle>
        <CardDescription>{t('offline.description')}</CardDescription>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline">{t('offline.withGclid')}: {formatNumber(data.with_gclid)}</Badge>
          <Badge variant="default">{t('offline.uploaded')}: {formatNumber(data.uploaded)}</Badge>
          <Badge variant="secondary">{t('offline.pending')}: {formatNumber(data.pending)}</Badge>
          <Badge variant={data.ready > 0 ? 'destructive' : 'outline'}>{t('offline.ready')}: {formatNumber(data.ready)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-muted-foreground text-xs">{t('offline.note')}</p>
        <Button size="sm" onClick={handleUpload} disabled={isLoading || data.ready === 0}>
          <UploadCloud className="mr-2 h-4 w-4" />
          {isLoading ? t('offline.uploading') : `${t('offline.uploadNow')} (${formatNumber(data.ready)})`}
        </Button>
      </CardContent>
    </Card>
  );
}
