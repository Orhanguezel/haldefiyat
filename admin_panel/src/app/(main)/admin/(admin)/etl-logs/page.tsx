'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EarlyWarningPanel } from '@/components/common/early-warning-panel';
import { useAdminT } from '../../_components/common/use-admin-t';
import { CronPanel } from './_components/cron-panel';
import { RunsPanel } from './_components/runs-panel';
import { ScraperPanel } from './_components/scraper-panel';
import { SourceFreshnessPanel } from './_components/source-freshness-panel';

export default function Page() {
  const t = useAdminT('admin.etl');
  const tc = useAdminT('admin.common');
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="runs">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="runs">{t('tabs.runs')}</TabsTrigger>
          <TabsTrigger value="freshness">{t('tabs.freshness')}</TabsTrigger>
          <TabsTrigger value="warning">{t('tabs.warning')}</TabsTrigger>
          <TabsTrigger value="scraper">{t('tabs.scraper')}</TabsTrigger>
          <TabsTrigger value="cron">{t('tabs.cron')}</TabsTrigger>
        </TabsList>
        <TabsContent value="runs" className="mt-4"><RunsPanel t={t} tc={tc} /></TabsContent>
        <TabsContent value="freshness" className="mt-4"><SourceFreshnessPanel t={t} tc={tc} /></TabsContent>
        <TabsContent value="warning" className="mt-4"><EarlyWarningPanel /></TabsContent>
        <TabsContent value="scraper" className="mt-4"><ScraperPanel t={t} tc={tc} /></TabsContent>
        <TabsContent value="cron" className="mt-4"><CronPanel t={t} tc={tc} /></TabsContent>
      </Tabs>
    </div>
  );
}
