// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/google-ads-insights-panel.tsx
// Verim analizi: dönüşüm aksiyonları, arama terimleri, kelimeler, cihazlar
// =============================================================

'use client';

import * as React from 'react';
import { AlertTriangle, Pause, Play } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useGoogleAdsCampaignsQuery,
  useGoogleAdsInsightsQuery,
  useGoogleAdsKeywordStatusMutation,
} from '@/integrations/hooks';
import {
  ADS_CONV_CATEGORY_LABELS,
  ADS_COUNTING_LABELS,
  ADS_DEVICE_LABELS,
  ADS_MATCH_TYPE_LABELS,
  ADS_RECOMMENDATION_LABELS,
  ADS_STATUS_LABELS,
  adsLabel,
  formatCpa,
  formatCtr,
  formatRoas,
  getErrorMessage,
  microsToUnit,
  type GoogleAdsDateRange,
  type GoogleAdsTermRow,
} from '@/integrations/shared';

import GoogleAdsKeywordManager from './google-ads-keyword-manager';
import GoogleAdsConversionHealth from './google-ads-conversion-health';
import GoogleAdsOfflinePanel from './google-ads-offline-panel';

const ALL_CAMPAIGNS = '__all__';

type Props = {
  hasCredentials: boolean;
  range: GoogleAdsDateRange;
  customerId?: string;
};

function TermTable({ rows, showMatchType, t, onToggle, toggling }: {
  rows: GoogleAdsTermRow[];
  showMatchType?: boolean;
  t: (key: string) => string;
  onToggle?: (row: GoogleAdsTermRow) => void;
  toggling?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b text-left text-muted-foreground text-xs">
            <th className="py-1.5 pr-3">{t('insights.columns.term')}</th>
            {showMatchType ? <th className="py-1.5 pr-3">{t('insights.columns.matchType')}</th> : null}
            <th className="py-1.5 pr-3">{t('insights.columns.campaign')}</th>
            <th className="py-1.5 pr-3 text-right">{t('insights.columns.clicks')}</th>
            <th className="py-1.5 pr-3 text-right">{t('insights.columns.ctr')}</th>
            <th className="py-1.5 pr-3 text-right">{t('insights.columns.cost')}</th>
            <th className="py-1.5 pr-3 text-right">{t('insights.columns.conversions')}</th>
            <th className="py-1.5 pr-3 text-right">{t('campaigns.columns.cpa')}</th>
            <th className="py-1.5 pr-3 text-right">{t('campaigns.columns.roas')}</th>
            {onToggle ? <th className="py-1.5 text-right">{t('insights.columns.actions')}</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.term}-${idx}`} className="border-border/60 border-b">
              <td className="py-1.5 pr-3 font-medium">{row.term}</td>
              {showMatchType ? (
                <td className="py-1.5 pr-3">
                  <span className="inline-flex items-center gap-1">
                    <Badge variant="outline">{adsLabel(ADS_MATCH_TYPE_LABELS, row.match_type || '')}</Badge>
                    {row.status && row.status !== 'ENABLED' ? (
                      <Badge variant="secondary">{adsLabel(ADS_STATUS_LABELS, row.status)}</Badge>
                    ) : null}
                  </span>
                </td>
              ) : null}
              <td className="py-1.5 pr-3 text-muted-foreground text-xs">{row.campaign}</td>
              <td className="py-1.5 pr-3 text-right">{row.clicks.toLocaleString('tr-TR')}</td>
              <td className="py-1.5 pr-3 text-right">{formatCtr(row.ctr)}</td>
              <td className="py-1.5 pr-3 text-right">{microsToUnit(row.cost_micros)}</td>
              <td className="py-1.5 pr-3 text-right">{row.conversions.toLocaleString('tr-TR')}</td>
              <td className="py-1.5 pr-3 text-right">{formatCpa(row.cost_micros, row.conversions)}</td>
              <td className="py-1.5 pr-3 text-right">{formatRoas(row.conversions_value, row.cost_micros)}</td>
              {onToggle ? (
                <td className="py-1.5 text-right">
                  {row.resource_name && (row.status === 'ENABLED' || row.status === 'PAUSED') ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      disabled={toggling}
                      onClick={() => onToggle(row)}
                    >
                      {row.status === 'ENABLED' ? (
                        <>
                          <Pause className="mr-1 h-3 w-3" />
                          {t('insights.pauseKeyword')}
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          {t('insights.enableKeyword')}
                        </>
                      )}
                    </Button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GoogleAdsInsightsPanel({ hasCredentials, range, customerId }: Props) {
  const t = useAdminT('admin.googleAds');
  const [campaignId, setCampaignId] = React.useState<string>(ALL_CAMPAIGNS);
  const cid = customerId || undefined;
  const { data: campaignData } = useGoogleAdsCampaignsQuery({ range, customer_id: cid }, { skip: !hasCredentials });
  const { data, isLoading, refetch } = useGoogleAdsInsightsQuery(
    { range, customer_id: cid, ...(campaignId !== ALL_CAMPAIGNS ? { campaign_id: campaignId } : {}) },
    { skip: !hasCredentials },
  );
  React.useEffect(() => { setCampaignId(ALL_CAMPAIGNS); }, [customerId]);
  const [setKeywordStatus, { isLoading: toggling }] = useGoogleAdsKeywordStatusMutation();

  const selectedCampaign = (campaignData?.items ?? []).find((c) => c.id === campaignId);
  const isPmaxSelected = selectedCampaign?.channel_type === 'PERFORMANCE_MAX';

  const handleToggleKeyword = async (row: GoogleAdsTermRow) => {
    if (!row.resource_name) return;
    const next = row.status === 'ENABLED' ? 'PAUSED' : 'ENABLED';
    const confirmKey = next === 'PAUSED' ? 'insights.confirmPauseKeyword' : 'insights.confirmEnableKeyword';
    if (!window.confirm(`${t(confirmKey)}\n\n"${row.term}" — ${row.campaign}`)) return;
    try {
      await setKeywordStatus({ resource_name: row.resource_name, status: next, customer_id: cid }).unwrap();
      toast.success(t(next === 'PAUSED' ? 'insights.keywordPaused' : 'insights.keywordEnabled'));
      void refetch();
    } catch (err) {
      toast.error(`${t('campaigns.actionFailed')}: ${getErrorMessage(err)}`);
    }
  };

  if (!hasCredentials) {
    return <p className="py-6 text-muted-foreground text-sm">{t('campaigns.needCredentials')}</p>;
  }
  if (isLoading) {
    return <p className="py-6 text-muted-foreground text-sm">{t('insights.loading')}</p>;
  }

  const totalConversions = (data?.search_terms ?? []).reduce((sum, row) => sum + row.conversions, 0)
    + (data?.devices ?? []).reduce((sum, row) => sum + row.conversions, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={campaignId} onValueChange={setCampaignId}>
          <SelectTrigger className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CAMPAIGNS}>{t('insights.allCampaigns')}</SelectItem>
            {(campaignData?.items ?? []).map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <GoogleAdsConversionHealth hasCredentials={hasCredentials} range={range} customerId={cid} />

      <GoogleAdsOfflinePanel hasCredentials={hasCredentials} customerId={cid} />

      {totalConversions === 0 ? (
        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-sm">{t('insights.noConversionsTitle')}</CardTitle>
              <CardDescription>{t('insights.noConversionsDesc')}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('insights.recommendations')}</CardTitle>
          <CardDescription>{t('insights.recommendationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {(data?.recommendations ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('insights.noRecommendations')}</p>
          ) : (
            <div className="space-y-2">
              {(data?.recommendations ?? []).map((rec, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3 text-sm">
                  <span className="font-medium">
                    {ADS_RECOMMENDATION_LABELS[rec.type] ?? rec.type}
                  </span>
                  {rec.campaign ? <Badge variant="outline">{rec.campaign}</Badge> : null}
                  {rec.dismissed ? <Badge variant="secondary">{t('insights.dismissed')}</Badge> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('insights.conversionActions')}</CardTitle>
          <CardDescription>{t('insights.conversionActionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.conversion_actions ?? []).map((action, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2 text-sm">
              <span className="font-medium">{action.name}</span>
              <Badge variant={action.status === 'ENABLED' ? 'default' : 'outline'}>
                {adsLabel(ADS_STATUS_LABELS, action.status)}
              </Badge>
              <Badge variant={action.primary ? 'default' : 'secondary'}>
                {action.primary ? t('insights.primary') : t('insights.secondary')}
              </Badge>
              {action.category ? (
                <Badge variant="outline">{adsLabel(ADS_CONV_CATEGORY_LABELS, action.category)}</Badge>
              ) : null}
              <span className="text-muted-foreground text-xs">{adsLabel(ADS_COUNTING_LABELS, action.counting_type)}</span>
              {action.default_value ? (
                <span className="text-muted-foreground text-xs">{t('insights.defaultValue')}: {action.default_value}</span>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('insights.searchTerms')}</CardTitle>
          <CardDescription>{t('insights.searchTermsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isPmaxSelected ? (
            <p className="py-4 text-muted-foreground text-sm">{t('insights.pmaxNoTerms')}</p>
          ) : (data?.search_terms ?? []).length === 0 ? (
            <p className="py-4 text-muted-foreground text-sm">{t('insights.emptyTable')}</p>
          ) : (
            <TermTable rows={data?.search_terms ?? []} t={t} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('insights.keywords')}</CardTitle>
          <CardDescription>{t('insights.keywordsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isPmaxSelected ? (
            <p className="py-4 text-muted-foreground text-sm">{t('insights.pmaxNoKeywords')}</p>
          ) : (data?.keywords ?? []).length === 0 ? (
            <p className="py-4 text-muted-foreground text-sm">{t('insights.emptyTable')}</p>
          ) : (
            <TermTable
              rows={data?.keywords ?? []}
              showMatchType
              t={t}
              onToggle={(row) => void handleToggleKeyword(row)}
              toggling={toggling}
            />
          )}
        </CardContent>
      </Card>

      {campaignId !== ALL_CAMPAIGNS && !isPmaxSelected ? (
        <GoogleAdsKeywordManager
          campaignId={campaignId}
          campaignName={selectedCampaign?.name ?? ''}
          customerId={cid}
          onChanged={() => void refetch()}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('insights.devices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b text-left text-muted-foreground text-xs">
                  <th className="py-1.5 pr-3">{t('insights.columns.campaign')}</th>
                  <th className="py-1.5 pr-3">{t('insights.columns.device')}</th>
                  <th className="py-1.5 pr-3 text-right">{t('insights.columns.clicks')}</th>
                  <th className="py-1.5 pr-3 text-right">{t('insights.columns.cost')}</th>
                  <th className="py-1.5 text-right">{t('insights.columns.conversions')}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.devices ?? []).map((row, idx) => (
                  <tr key={idx} className="border-border/60 border-b">
                    <td className="py-1.5 pr-3">{row.campaign}</td>
                    <td className="py-1.5 pr-3">{adsLabel(ADS_DEVICE_LABELS, row.device)}</td>
                    <td className="py-1.5 pr-3 text-right">{row.clicks.toLocaleString('tr-TR')}</td>
                    <td className="py-1.5 pr-3 text-right">{microsToUnit(row.cost_micros)}</td>
                    <td className="py-1.5 text-right">{row.conversions.toLocaleString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
