'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TranslateFn } from '@/i18n';
import type { CronCatalogItem } from '@/integrations/endpoints/etl-logs-admin-endpoints';
import { useCronCatalogAdminQuery } from '@/integrations/hooks';
import { CRON_CATEGORY_ORDER, cronToHuman } from './cron-format';

export function CronPanel({ t, tc }: { t: TranslateFn; tc: TranslateFn }) {
  const { data, isLoading, isError } = useCronCatalogAdminQuery();
  if (isLoading) return <Card><CardContent className="py-6 text-sm text-muted-foreground">{tc('loading')}</CardContent></Card>;
  if (isError || !data) return <Card><CardContent className="py-6 text-sm text-rose-600">{t('cron.failed')}</CardContent></Card>;

  const grouped = new Map<string, CronCatalogItem[]>();
  for (const task of data.tasks) grouped.set(task.category, [...(grouped.get(task.category) ?? []), task]);
  const categories = [...CRON_CATEGORY_ORDER.filter((c) => grouped.has(c)), ...[...grouped.keys()].filter((c) => !CRON_CATEGORY_ORDER.includes(c))];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('cron.summary', { count: data.tasks.length, tz: data.timezone })}</p>
      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader><CardTitle className="text-sm">{t(`cron.categories.${cat}`, undefined, cat)}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {grouped.get(cat)!.map((task) => (
              <div key={task.name} className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <code className="font-mono text-xs font-semibold">{task.name}</code>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="whitespace-nowrap">{cronToHuman(task.schedule, t)}</Badge>
                  <code className="font-mono text-[11px] text-muted-foreground">{task.schedule}</code>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
