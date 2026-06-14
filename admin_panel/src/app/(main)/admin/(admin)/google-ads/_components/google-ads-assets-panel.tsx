// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/google-ads-assets-panel.tsx
// PMax öğe yönetimi: öğe grubu seç + reklam gücü + tüm öğe türleri (metin/görsel/video)
// =============================================================

'use client';

import * as React from 'react';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGoogleAdsAssetGroupAssetsQuery, useGoogleAdsAssetGroupsQuery } from '@/integrations/hooks';
import {
  ADS_STRENGTH_LABELS,
  GOOGLE_ADS_FIELD_DESCRIPTORS,
  adsLabel,
  type GoogleAdsAssetKind,
} from '@/integrations/shared';

import AssetSection from './asset-section';

type Props = { hasCredentials: boolean; customerId?: string };

const STRENGTH_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  EXCELLENT: 'default',
  GOOD: 'default',
  AVERAGE: 'secondary',
  POOR: 'destructive',
  PENDING: 'outline',
};

const KIND_GROUPS: { kind: GoogleAdsAssetKind; titleKey: string }[] = [
  { kind: 'text', titleKey: 'assets.groupText' },
  { kind: 'image', titleKey: 'assets.groupImage' },
  { kind: 'video', titleKey: 'assets.groupVideo' },
];

export default function GoogleAdsAssetsPanel({ hasCredentials, customerId }: Props) {
  const t = useAdminT('admin.googleAds');
  const cid = customerId || undefined;
  const { data: groups } = useGoogleAdsAssetGroupsQuery({ customer_id: cid }, { skip: !hasCredentials });
  const [groupId, setGroupId] = React.useState<string>('');
  React.useEffect(() => { setGroupId(''); }, [customerId]);

  const items = groups?.items ?? [];
  const activeId = groupId || items[0]?.id || '';
  const activeGroup = items.find((g) => g.id === activeId);

  const { data: assetsResp, refetch } = useGoogleAdsAssetGroupAssetsQuery(
    { id: activeId, customer_id: cid },
    { skip: !hasCredentials || !activeId },
  );
  const assets = React.useMemo(() => assetsResp?.items ?? [], [assetsResp]);

  if (!hasCredentials) {
    return <Card><CardContent className="py-6 text-muted-foreground text-sm">{t('assets.noCredentials')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('assets.title')}</CardTitle>
        <CardDescription>{t('assets.description')}</CardDescription>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Select value={activeId} onValueChange={setGroupId}>
            <SelectTrigger className="w-72"><SelectValue placeholder={t('assets.selectGroup')} /></SelectTrigger>
            <SelectContent>
              {items.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.campaign} — {g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeGroup ? (
            <Badge variant={STRENGTH_VARIANT[activeGroup.ad_strength] ?? 'outline'}>
              {t('assets.adStrength')}: {adsLabel(ADS_STRENGTH_LABELS, activeGroup.ad_strength)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {KIND_GROUPS.map(({ kind, titleKey }) => {
          const descriptors = GOOGLE_ADS_FIELD_DESCRIPTORS.filter((d) => d.kind === kind);
          return (
            <div key={kind} className="space-y-3">
              <h4 className="text-muted-foreground text-xs uppercase tracking-wide">{t(titleKey)}</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {descriptors.map((d) => (
                  <AssetSection
                    key={d.fieldType}
                    descriptor={d}
                    assetGroupId={activeId}
                    customerId={cid}
                    items={assets.filter((a) => a.field_type === d.fieldType)}
                    onChanged={() => void refetch()}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
