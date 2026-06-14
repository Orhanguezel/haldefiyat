// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/google-ads-keyword-manager.tsx
// Kelime yönetimi: negatif kelime ekle (kampanya) + kelime ekle (reklam grubu)
// =============================================================

'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useGoogleAdsAddKeywordMutation,
  useGoogleAdsAddNegativeKeywordMutation,
  useLazyGoogleAdsAdGroupsQuery,
} from '@/integrations/hooks';
import {
  ADS_MATCH_TYPE_LABELS,
  adsLabel,
  getErrorMessage,
  type GoogleAdsMatchType,
} from '@/integrations/shared';

type Props = { campaignId: string; campaignName: string; customerId?: string; onChanged: () => void };

const MATCH_TYPES: GoogleAdsMatchType[] = ['BROAD', 'PHRASE', 'EXACT'];

function MatchSelect({ value, onChange }: { value: GoogleAdsMatchType; onChange: (v: GoogleAdsMatchType) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as GoogleAdsMatchType)}>
      <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
      <SelectContent>
        {MATCH_TYPES.map((m) => (
          <SelectItem key={m} value={m}>{adsLabel(ADS_MATCH_TYPE_LABELS, m)}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function GoogleAdsKeywordManager({ campaignId, campaignName, customerId, onChanged }: Props) {
  const t = useAdminT('admin.googleAds');
  const [negText, setNegText] = React.useState('');
  const [negMatch, setNegMatch] = React.useState<GoogleAdsMatchType>('PHRASE');
  const [posText, setPosText] = React.useState('');
  const [posMatch, setPosMatch] = React.useState<GoogleAdsMatchType>('PHRASE');
  const [adGroupId, setAdGroupId] = React.useState('');

  const [loadAdGroups, { data: adGroups }] = useLazyGoogleAdsAdGroupsQuery();
  const [addNegative, { isLoading: addingNeg }] = useGoogleAdsAddNegativeKeywordMutation();
  const [addKeyword, { isLoading: addingPos }] = useGoogleAdsAddKeywordMutation();

  React.useEffect(() => {
    setAdGroupId('');
    void loadAdGroups({ id: campaignId, customer_id: customerId });
  }, [campaignId, customerId, loadAdGroups]);

  const groups = adGroups?.items ?? [];
  const activeAg = adGroupId || groups[0]?.id || '';

  const run = async (fn: () => Promise<unknown>, okMsg: string, reset: () => void) => {
    try {
      await fn();
      toast.success(t(okMsg));
      reset();
      onChanged();
    } catch (err) {
      toast.error(`${t('campaigns.actionFailed')}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('keywords.title')}</CardTitle>
        <CardDescription>{campaignName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="font-medium text-sm">{t('keywords.negativeTitle')}</div>
          <p className="text-muted-foreground text-xs">{t('keywords.negativeDesc')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={negText} onChange={(e) => setNegText(e.target.value)} placeholder={t('keywords.placeholder')} className="h-8 w-64 text-sm" />
            <MatchSelect value={negMatch} onChange={setNegMatch} />
            <Button
              size="sm"
              disabled={addingNeg || !negText.trim()}
              onClick={() =>
                run(
                  () => addNegative({ campaign_id: campaignId, text: negText.trim(), match_type: negMatch, customer_id: customerId }).unwrap(),
                  'keywords.negativeAdded',
                  () => setNegText(''),
                )
              }
            >
              <Plus className="mr-1 h-4 w-4" />{t('keywords.addNegative')}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 border-border border-t pt-3">
          <div className="font-medium text-sm">{t('keywords.positiveTitle')}</div>
          <p className="text-muted-foreground text-xs">{t('keywords.positiveDesc')}</p>
          {groups.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('keywords.noAdGroups')}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Select value={activeAg} onValueChange={setAdGroupId}>
                <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={posText} onChange={(e) => setPosText(e.target.value)} placeholder={t('keywords.placeholder')} className="h-8 w-56 text-sm" />
              <MatchSelect value={posMatch} onChange={setPosMatch} />
              <Button
                size="sm"
                disabled={addingPos || !posText.trim() || !activeAg}
                onClick={() =>
                  run(
                    () => addKeyword({ ad_group_id: activeAg, text: posText.trim(), match_type: posMatch, customer_id: customerId }).unwrap(),
                    'keywords.positiveAdded',
                    () => setPosText(''),
                  )
                }
              >
                <Plus className="mr-1 h-4 w-4" />{t('keywords.addPositive')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
