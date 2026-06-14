// =============================================================
// FILE: src/app/(main)/admin/(admin)/google-ads/_components/google-ads-campaigns-panel.tsx
// Kampanya raporu (salt okunur, tarih aralığı filtreli)
// =============================================================

'use client';

import * as React from 'react';
import { Pause, Pencil, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useGoogleAdsCampaignsQuery,
  useGoogleAdsSetBiddingMutation,
  useGoogleAdsSetBudgetMutation,
  useGoogleAdsSetStatusMutation,
} from '@/integrations/hooks';
import {
  ADS_BIDDING_LABELS,
  ADS_CHANNEL_LABELS,
  ADS_STATUS_LABELS,
  GOOGLE_ADS_DATE_RANGES,
  adsLabel,
  formatCpa,
  formatCtr,
  formatNumber,
  formatRoas,
  getErrorMessage,
  microsToUnit,
  type GoogleAdsBiddingStrategy,
  type GoogleAdsCampaignRow,
  type GoogleAdsDateRange,
} from '@/integrations/shared';

type Props = {
  hasCredentials: boolean;
  customerId?: string;
};

export default function GoogleAdsCampaignsPanel({ hasCredentials, customerId }: Props) {
  const t = useAdminT('admin.googleAds');
  const [range, setRange] = React.useState<GoogleAdsDateRange>('LAST_30_DAYS');
  const cid = customerId || undefined;

  const { data, isLoading, isFetching, refetch } = useGoogleAdsCampaignsQuery(
    { range, customer_id: cid },
    { skip: !hasCredentials },
  );
  const [setStatus, { isLoading: statusSaving }] = useGoogleAdsSetStatusMutation();
  const [setBudget, { isLoading: budgetSaving }] = useGoogleAdsSetBudgetMutation();
  const [setBidding, { isLoading: biddingSaving }] = useGoogleAdsSetBiddingMutation();
  const items = data?.items ?? [];
  const mutating = statusSaving || budgetSaving || biddingSaving;

  const handleEditBidding = async (row: GoogleAdsCampaignRow) => {
    const choice = window.prompt(
      `${t('campaigns.biddingPrompt')}\n\n${row.name}\n1 = ${ADS_BIDDING_LABELS.MAXIMIZE_CONVERSIONS}\n2 = ${ADS_BIDDING_LABELS.MAXIMIZE_CONVERSION_VALUE}`,
      '1',
    );
    if (choice !== '1' && choice !== '2') return;
    const strategy: GoogleAdsBiddingStrategy =
      choice === '1' ? 'MAXIMIZE_CONVERSIONS' : 'MAXIMIZE_CONVERSION_VALUE';
    const promptKey = choice === '1' ? 'campaigns.targetCpaPrompt' : 'campaigns.targetRoasPrompt';
    const raw = window.prompt(t(promptKey), '');
    if (raw === null) return;
    const trimmed = raw.trim();
    const value = trimmed ? Number(trimmed.replace(',', '.')) : undefined;
    if (trimmed && (!Number.isFinite(value) || (value as number) <= 0)) {
      toast.error(t('campaigns.budgetInvalid'));
      return;
    }
    try {
      await setBidding({
        id: row.id,
        strategy,
        target_cpa: choice === '1' ? value : undefined,
        target_roas: choice === '2' ? value : undefined,
        customer_id: cid,
      }).unwrap();
      toast.success(t('campaigns.biddingSaved'));
      void refetch();
    } catch (err) {
      toast.error(`${t('campaigns.actionFailed')}: ${getErrorMessage(err)}`);
    }
  };

  const handleToggleStatus = async (row: GoogleAdsCampaignRow) => {
    const next = row.status === 'ENABLED' ? 'PAUSED' : 'ENABLED';
    const confirmKey = next === 'PAUSED' ? 'campaigns.confirmPause' : 'campaigns.confirmEnable';
    if (!window.confirm(`${t(confirmKey)}\n\n${row.name}`)) return;
    try {
      await setStatus({ id: row.id, status: next, customer_id: cid }).unwrap();
      toast.success(t(next === 'PAUSED' ? 'campaigns.paused' : 'campaigns.enabled'));
      void refetch();
    } catch (err) {
      toast.error(`${t('campaigns.actionFailed')}: ${getErrorMessage(err)}`);
    }
  };

  const handleEditBudget = async (row: GoogleAdsCampaignRow) => {
    const current = (row.budget_micros / 1_000_000).toFixed(2);
    const input = window.prompt(`${t('campaigns.budgetPrompt')}\n\n${row.name}`, current);
    if (input === null) return;
    const amount = Number(String(input).replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('campaigns.budgetInvalid'));
      return;
    }
    if (!window.confirm(`${t('campaigns.confirmBudget')} ${amount.toLocaleString('tr-TR')}`)) return;
    try {
      await setBudget({ budget_id: row.budget_id, amount, customer_id: cid }).unwrap();
      toast.success(t('campaigns.budgetSaved'));
      void refetch();
    } catch (err) {
      toast.error(`${t('campaigns.actionFailed')}: ${getErrorMessage(err)}`);
    }
  };

  if (!hasCredentials) {
    return <p className="py-6 text-muted-foreground text-sm">{t('campaigns.needCredentials')}</p>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>{t('campaigns.title')}</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as GoogleAdsDateRange)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOOGLE_ADS_DATE_RANGES.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`campaigns.ranges.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('campaigns.refresh')}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="py-6 text-muted-foreground text-sm">{t('campaigns.loading')}</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-muted-foreground text-sm">{t('campaigns.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b text-left text-muted-foreground text-xs">
                  <th className="py-2 pr-3">{t('campaigns.columns.name')}</th>
                  <th className="py-2 pr-3">{t('campaigns.columns.status')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.budget')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.impressions')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.clicks')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.ctr')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.avgCpc')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.cost')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.conversions')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.cpa')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.convValue')}</th>
                  <th className="py-2 pr-3 text-right">{t('campaigns.columns.roas')}</th>
                  <th className="py-2 pr-3">{t('campaigns.columns.bidding')}</th>
                  <th className="py-2 text-right">{t('campaigns.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-border/60 border-b">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-muted-foreground text-xs">{adsLabel(ADS_CHANNEL_LABELS, row.channel_type)}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant={row.status === 'ENABLED' ? 'default' : 'secondary'}>
                        {adsLabel(ADS_STATUS_LABELS, row.status)}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <span className="inline-flex items-center gap-1">
                        {microsToUnit(row.budget_micros)}
                        {row.budget_id && row.status !== 'REMOVED' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={mutating}
                            onClick={() => void handleEditBudget(row)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right">{row.impressions.toLocaleString('tr-TR')}</td>
                    <td className="py-2 pr-3 text-right">{row.clicks.toLocaleString('tr-TR')}</td>
                    <td className="py-2 pr-3 text-right">{formatCtr(row.ctr)}</td>
                    <td className="py-2 pr-3 text-right">{microsToUnit(row.average_cpc_micros)}</td>
                    <td className="py-2 pr-3 text-right">{microsToUnit(row.cost_micros)}</td>
                    <td className="py-2 pr-3 text-right">{formatNumber(row.conversions)}</td>
                    <td className="py-2 pr-3 text-right">{formatCpa(row.cost_micros, row.conversions)}</td>
                    <td className="py-2 pr-3 text-right">{formatNumber(row.conversions_value)}</td>
                    <td className="py-2 pr-3 text-right">{formatRoas(row.conversions_value, row.cost_micros)}</td>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-xs">
                          {adsLabel(ADS_BIDDING_LABELS, row.bidding_strategy_type)}
                          {row.target_cpa_micros ? ` · EBM ${microsToUnit(row.target_cpa_micros)}` : ''}
                          {row.target_roas ? ` · ×${formatNumber(row.target_roas)}` : ''}
                        </span>
                        {row.status !== 'REMOVED' && (row.channel_type === 'PERFORMANCE_MAX' || row.channel_type === 'SEARCH' || row.channel_type === 'SHOPPING' || row.channel_type === 'DISPLAY') ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            disabled={mutating}
                            onClick={() => void handleEditBidding(row)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      {row.status === 'ENABLED' || row.status === 'PAUSED' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={mutating}
                          onClick={() => void handleToggleStatus(row)}
                        >
                          {row.status === 'ENABLED' ? (
                            <>
                              <Pause className="mr-1 h-3 w-3" />
                              {t('campaigns.pause')}
                            </>
                          ) : (
                            <>
                              <Play className="mr-1 h-3 w-3" />
                              {t('campaigns.enable')}
                            </>
                          )}
                        </Button>
                      ) : null}
                    </td>
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
