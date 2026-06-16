'use client';

import * as React from 'react';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGa4OverviewQuery, useGa4ReportQuery, useGa4StatusQuery } from '@/integrations/hooks';
import { GA4_RANGES, GA4_RANGE_LABELS, type Ga4Range } from '@/integrations/shared';
import { ConversionsTab } from './ga4-conversions-tab';
import { OverviewTab } from './ga4-overview-tab';
import { AcquisitionTab, EcommerceTab, EngagementTab, EventsTab } from './ga4-report-tabs';
import { RealtimeTab } from './ga4-realtime-tab';
import { SettingsTab } from './ga4-settings-tab';
import AdminAnalyticsClient from './_components/admin-analytics-client';

export default function Ga4Page() {
  const t = useAdminT('admin.ga4');
  const { data: status } = useGa4StatusQuery();
  const [range, setRange] = React.useState<Ga4Range>('LAST_28_DAYS');
  const [presetEvent, setPresetEvent] = React.useState('');
  const [tab, setTab] = React.useState('overview');
  const { data: ov, isFetching } = useGa4OverviewQuery({ range });
  const { data: report } = useGa4ReportQuery({ range });

  const makeKeyEvent = (name: string) => {
    setPresetEvent(name);
    setTab('conversions');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div><CardTitle className="text-base">{t('title')}</CardTitle><CardDescription>{t('description')}</CardDescription></div>
            <div className="flex items-center gap-2">
              <Badge variant={status?.connected ? 'default' : 'destructive'}>{status?.connected ? t('connected') : t('disconnected')}</Badge>
              {status?.property ? <Badge variant="outline">#{status.property}</Badge> : null}
            </div>
          </div>
          <Select value={range} onValueChange={(v) => setRange(v as Ga4Range)}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{GA4_RANGES.map((r) => <SelectItem key={r} value={r}>{GA4_RANGE_LABELS[r]}</SelectItem>)}</SelectContent>
          </Select>
        </CardHeader>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="realtime">{t('tabs.realtime')}</TabsTrigger>
          <TabsTrigger value="acquisition">{t('tabs.acquisition')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('tabs.engagement')}</TabsTrigger>
          <TabsTrigger value="events">{t('tabs.events')}</TabsTrigger>
          <TabsTrigger value="conversions">{t('tabs.conversions')}</TabsTrigger>
          <TabsTrigger value="ecommerce">{t('tabs.ecommerce')}</TabsTrigger>
          <TabsTrigger value="site">Site Analitiği</TabsTrigger>
          <TabsTrigger value="settings">{t('tabs.settings')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OverviewTab ov={ov} report={report} loading={isFetching} t={t} /></TabsContent>
        <TabsContent value="realtime"><RealtimeTab t={t} /></TabsContent>
        <TabsContent value="acquisition"><AcquisitionTab report={report} t={t} /></TabsContent>
        <TabsContent value="engagement"><EngagementTab report={report} t={t} /></TabsContent>
        <TabsContent value="events"><EventsTab report={report} t={t} onMakeKey={makeKeyEvent} /></TabsContent>
        <TabsContent value="conversions"><ConversionsTab t={t} presetEvent={presetEvent} /></TabsContent>
        <TabsContent value="ecommerce"><EcommerceTab report={report} t={t} /></TabsContent>
        <TabsContent value="site"><AdminAnalyticsClient /></TabsContent>
        <TabsContent value="settings"><SettingsTab t={t} /></TabsContent>
      </Tabs>
    </div>
  );
}
