'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ListingAnalytics } from '../_lib/types';

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function TermList({ title, items }: { title: string; items: Array<{ term: string; hits: number }> }) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium">{title}</div>
      {items.length === 0 ? <p className="text-sm text-muted-foreground">Veri yok.</p> : (
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

type Props = { analytics: ListingAnalytics | null; days: number; onDaysChange: (days: number) => void };

export function TrafficPanel({ analytics, days, onDaysChange }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">İlan trafiği · son {days} gün</CardTitle>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((value) => (
            <Button key={value} size="sm" variant={days === value ? 'default' : 'outline'} onClick={() => onDaysChange(value)}>
              {value} gün
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!analytics ? <p className="text-sm text-muted-foreground">Yükleniyor…</p> : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric title="Liste görüntüleme" value={analytics.summary.listViews} />
              <Metric title="İlan detay tıklama" value={analytics.summary.detailViews} />
              <Metric title="İlan ver ziyareti" value={analytics.summary.ilanVerViews} />
              <Metric title="Teklif / iletişim" value={analytics.summary.inquiries} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
              <div>
                <div className="mb-2 text-sm font-medium">En çok görüntülenen ilanlar</div>
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead>İlan</TableHead>
                        <TableHead className="w-28 text-right">Görüntüleme</TableHead>
                        <TableHead className="w-20 text-right">Teklif</TableHead>
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
                        <TableRow><TableCell colSpan={3} className="text-muted-foreground">Kayıt yok.</TableCell></TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="space-y-5">
                <TermList title="En çok aranan ürünler" items={analytics.searches.products} />
                <TermList title="En çok aranan iller" items={analytics.searches.cities} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
