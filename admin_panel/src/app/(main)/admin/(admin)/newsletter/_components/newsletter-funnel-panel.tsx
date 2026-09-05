'use client';

import { BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TranslateFn } from '@/i18n';
import { useNewsletterFunnelAdminQuery } from '@/integrations/hooks';

const SOURCE_KEYS: Record<string, string> = {
  fiyatlar_strip: 'pricesStrip', home_strip: 'homeStrip', urun_strip: 'productPage', hal_strip: 'marketPage',
  sticky_mobile: 'stickyMobile', 'hal-local': 'legacy', 'full-test': 'test', '(belirsiz)': 'unknown',
};

/** Hangi CTA kac abone getiriyor + son 30 gun akisi: donusen kaynaga yatirim yapmak icin. */
export function NewsletterFunnelPanel({ t, tc }: { t: TranslateFn; tc: TranslateFn }) {
  const { data, isFetching } = useNewsletterFunnelAdminQuery();
  const maxSource = Math.max(1, ...(data?.bySource ?? []).map((s) => s.n));
  const maxDay = Math.max(1, ...(data?.byDay ?? []).map((d) => d.n));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="size-4" />{t('funnel.title')}</CardTitle>
        <CardDescription>{t('funnel.hint')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!data ? <div className="text-sm text-muted-foreground">{isFetching ? tc('loading') : tc('noData')}</div> : (
          <>
            <div>
              <div className="mb-2 text-sm font-medium">{t('funnel.bySource')}</div>
              <div className="space-y-1.5">
                {data.bySource.map((s) => (
                  <div key={s.source} className="flex items-center gap-2 text-sm">
                    <div className="w-40 shrink-0 truncate text-muted-foreground" title={s.source}>{SOURCE_KEYS[s.source] ? t(`funnel.sources.${SOURCE_KEYS[s.source]}`) : s.source}</div>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-emerald-500/70" style={{ width: `${(s.n / maxSource) * 100}%` }} /></div>
                    <div className="w-10 shrink-0 text-right font-mono text-xs">{s.n}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium"><TrendingUp className="size-3.5" /> {t('funnel.byDay')}</div>
              {data.byDay.length === 0 ? <div className="text-xs text-muted-foreground">{t('funnel.noRecent')}</div> : (
                <div className="flex items-end gap-1" style={{ height: 56 }}>
                  {data.byDay.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center justify-end" title={`${d.day}: ${d.n}`}>
                      <div className="w-full rounded-t bg-sky-500/70" style={{ height: `${Math.max(6, (d.n / maxDay) * 48)}px` }} />
                      <div className="mt-1 text-[9px] text-muted-foreground">{d.day.slice(8, 10)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
