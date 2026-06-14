'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGscIndexQuery, useGscIndexRefreshMutation } from '@/integrations/hooks';
import { getErrorMessage, type GscIndexCategory } from '@/integrations/shared';
import { IndexRows } from './gsc-tables';

type T = (k: string) => string;

export function IndexTab({ site, t }: { site?: string; t: T }) {
  const { data } = useGscIndexQuery();
  const [filter, setFilter] = React.useState<GscIndexCategory | 'all'>('all');
  const [refresh, { isLoading }] = useGscIndexRefreshMutation();
  const items = (data?.items ?? []).filter((item) => filter === 'all' || item.category === filter);
  const summary = data?.summary ?? { indexed: 0, not_indexed: 0, issue: 0, unknown: 0 };

  const runRefresh = async () => {
    try {
      const res = await refresh({ site_url: site, limit: 100 }).unwrap();
      toast.success(
        t('index.refreshed')
          .replace('{count}', String(res.checked))
          .replace('{skipped}', String(res.skipped ?? 0))
          .replace('{total}', String(res.totalUrls ?? res.items.length)),
      );
    } catch (err) {
      toast.error(`${t('index.failed')}: ${getErrorMessage(err)}`);
    }
  };

  const cards = [
    { key: 'indexed', label: t('index.indexed'), value: summary.indexed },
    { key: 'not_indexed', label: t('index.notIndexed'), value: summary.not_indexed },
    { key: 'issue', label: t('index.issue'), value: summary.issue },
    { key: 'unknown', label: t('index.unknown'), value: summary.unknown },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => (
          <div key={card.key} className="rounded-md border border-border p-3">
            <div className="text-muted-foreground text-xs">{card.label}</div>
            <div className="font-semibold text-lg tabular-nums">{card.value}</div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-sm">{t('tabs.index')}</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as GscIndexCategory | 'all')}>
              <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('index.all')}</SelectItem>
                <SelectItem value="indexed">{t('index.indexed')}</SelectItem>
                <SelectItem value="not_indexed">{t('index.notIndexed')}</SelectItem>
                <SelectItem value="issue">{t('index.issue')}</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={runRefresh} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />{isLoading ? t('index.refreshing') : t('index.refresh')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <IndexRows items={items} t={t} />
          <div className="rounded-md border border-border bg-muted/30 p-3 text-muted-foreground text-sm">
            {t('index.help')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
