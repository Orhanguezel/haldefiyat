'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EarlyWarningPanel } from '@/components/common/early-warning-panel';
import { SourceFreshnessPanel } from './_components/source-freshness-panel';
import { LogsPanel } from './_components/logs-panel';
import { ScraperPanel } from './_components/scraper-panel';
import { CronPanel } from './_components/cron-panel';

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ETL & Otomasyon</h1>
        <p className="text-sm text-muted-foreground">
          Veri çekme çalışmaları, kaynak tazeliği, scraper mikroservisi ve zamanlanmış görevler.
        </p>
      </div>

      <EarlyWarningPanel />

      <Tabs defaultValue="logs">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="logs">Loglar</TabsTrigger>
          <TabsTrigger value="errors">Hatalar</TabsTrigger>
          <TabsTrigger value="freshness">Kaynak Tazeliği</TabsTrigger>
          <TabsTrigger value="scraper">Scraper</TabsTrigger>
          <TabsTrigger value="cron">Cron</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <LogsPanel />
        </TabsContent>
        <TabsContent value="errors" className="mt-4">
          <LogsPanel onlyErrors />
        </TabsContent>
        <TabsContent value="freshness" className="mt-4">
          <SourceFreshnessPanel />
        </TabsContent>
        <TabsContent value="scraper" className="mt-4">
          <ScraperPanel />
        </TabsContent>
        <TabsContent value="cron" className="mt-4">
          <CronPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
