'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ListingAnalytics } from '../_lib/types';
type T = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function TermList({ title, items, empty }: { title: string; items: Array<{ term: string; hits: number }>; empty: string }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <div className="space-y-1 text-sm">
          {items.slice(0, 8).map((item) => (
            <div key={item.term} className="flex items-center justify-between gap-2 border-b py-1 last:border-0">
              <span className="truncate">{item.term}</span>
              <span className="tabular-nums text-muted-foreground">{item.hits}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Props = { analytics: ListingAnalytics | null; days: number; onDaysChange: (days: number) => void; t: T; tc: T };

export function TrafficPanel({ analytics, days, onDaysChange, t, tc }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t('traffic.title', { days })}</CardTitle>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((value) => (
            <Button key={value} size="sm" variant={days === value ? 'default' : 'outline'} onClick={() => onDaysChange(value)}>
              {value} {tc('days')}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!analytics ? <p className="text-sm text-muted-foreground">{tc('loading')}</p> : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric title={t('traffic.listViews')} value={analytics.summary.listViews} />
              <Metric title={t('traffic.detailViews')} value={analytics.summary.detailViews} />
              <Metric title={t('traffic.ilanVerViews')} value={analytics.summary.ilanVerViews} />
              <Metric title={t('traffic.inquiries')} value={analytics.summary.inquiries} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
              <div>
                <div className="mb-2 text-sm font-medium">{t('traffic.topListings')}</div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>{t('table.listing')}</TableHead>
                        <TableHead className="w-28 text-right">{t('traffic.views')}</TableHead>
                        <TableHead className="w-20 text-right">{t('traffic.offers')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.perListing.slice(0, 10).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="max-w-[260px] truncate">{item.title || `#${item.id}`}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{item.viewCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{item.inquiries}</TableCell>
                        </TableRow>
                      ))}
                      {analytics.perListing.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="text-muted-foreground">{tc('notFound')}</TableCell></TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="space-y-5">
                <TermList title={t('traffic.topProducts')} items={analytics.searches.products} empty={t('traffic.noData')} />
                <TermList title={t('traffic.topCities')} items={analytics.searches.cities} empty={t('traffic.noData')} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
