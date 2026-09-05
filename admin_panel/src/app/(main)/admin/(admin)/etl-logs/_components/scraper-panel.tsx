'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TranslateFn } from '@/i18n';
import { useScraperStatusAdminQuery } from '@/integrations/hooks';

function Chips({ title, items, empty, className }: { title: string; items: string[]; empty: string; className?: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title} ({items.length})</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
          <div className="flex flex-wrap gap-2">{items.map((s) => <Badge key={s} variant="secondary" className={`font-mono text-xs ${className ?? ''}`}>{s}</Badge>)}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScraperPanel({ t, tc }: { t: TranslateFn; tc: TranslateFn }) {
  const { data, isLoading, isError } = useScraperStatusAdminQuery();
  if (isLoading) return <Card><CardContent className="py-6 text-sm text-muted-foreground">{tc('loading')}</CardContent></Card>;
  if (isError || !data) return <Card><CardContent className="py-6 text-sm text-rose-600">{t('scraper.failed')}</CardContent></Card>;
  const online = data.enabled && data.reachable;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t('scraper.title')}</CardTitle>
          <Badge className={online ? 'bg-emerald-600' : 'bg-rose-600'}>{online ? t('scraper.online') : data.enabled ? t('scraper.unreachable') : t('scraper.disabled')}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
            <div><dt className="text-muted-foreground">{t('scraper.enabled')}</dt><dd className="font-medium">{data.enabled ? tc('yes') : tc('no')}</dd></div>
            <div><dt className="text-muted-foreground">{t('scraper.reach')}</dt><dd className="font-medium">{data.reachable ? t('scraper.connected') : t('scraper.noReach')}</dd></div>
            <div><dt className="text-muted-foreground">{t('scraper.latency')}</dt><dd className="font-medium">{data.latencyMs != null ? `${data.latencyMs} ms` : '—'}</dd></div>
            <div><dt className="text-muted-foreground">URL</dt><dd className="truncate font-mono text-xs" title={data.url ?? ''}>{data.url ?? '—'}</dd></div>
          </dl>
          {data.health ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(data.health).map(([k, v]) => <Badge key={k} variant="outline" className="font-mono text-xs">{k}: {String(v)}</Badge>)}
            </div>
          ) : null}
          {data.error ? <p className="mt-4 rounded bg-rose-50 px-3 py-2 font-mono text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{data.error}</p> : null}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Chips title={t('scraper.routed')} items={data.sources} empty={t('scraper.emptyList', { env: 'HF_SCRAPER_SOURCES' })} />
        <Chips title={t('scraper.dynamic')} items={data.dynamicSources} empty={t('scraper.emptyList', { env: 'HF_SCRAPER_DYNAMIC' })} className="bg-indigo-600 text-white" />
      </div>
    </div>
  );
}
