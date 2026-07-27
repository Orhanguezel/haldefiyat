'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCronCatalogAdminQuery } from '@/integrations/hooks';
import { cronToHuman, CRON_CATEGORY_LABELS, CRON_CATEGORY_ORDER } from './cron-format';
import type { CronCatalogItem } from '@/integrations/endpoints/etl-logs-admin-endpoints';

export function CronPanel() {
  const { data, isLoading, isError } = useCronCatalogAdminQuery();

  if (isLoading) {
    return <Card><CardContent className="py-6 text-sm text-muted-foreground">Cron katalogu yükleniyor...</CardContent></Card>;
  }
  if (isError || !data) {
    return <Card><CardContent className="py-6 text-sm text-red-600">Cron katalogu alınamadı.</CardContent></Card>;
  }

  const grouped = new Map<string, CronCatalogItem[]>();
  for (const task of data.tasks) {
    const list = grouped.get(task.category) ?? [];
    list.push(task);
    grouped.set(task.category, list);
  }
  const categories = [...CRON_CATEGORY_ORDER.filter((c) => grouped.has(c)), ...[...grouped.keys()].filter((c) => !CRON_CATEGORY_ORDER.includes(c))];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Toplam <strong>{data.tasks.length}</strong> zamanlanmış görev · Zaman dilimi: <code className="font-mono">{data.timezone}</code>
        {' '}(saatler TRT / UTC+3 gösteriliyor)
      </p>

      {categories.map((cat) => (
        <Card key={cat}>
          <CardHeader><CardTitle className="text-sm">{CRON_CATEGORY_LABELS[cat] ?? cat}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {grouped.get(cat)!.map((task) => (
              <div key={task.name} className="flex flex-col gap-1 border-b pb-2 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs font-semibold">{task.name}</code>
                  </div>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="secondary" className="whitespace-nowrap">{cronToHuman(task.schedule)}</Badge>
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
