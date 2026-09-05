'use client';

import Link from 'next/link';
import { ExternalLink, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetPriceDetailAdminQuery } from '@/integrations/hooks';
import type { PriceAdminItem } from '@/integrations/endpoints/prices-admin-endpoints';
import { ageLabel, money, percentDiff, shortDate } from '../_lib/format';
import { useAdminT } from '../../../_components/common/use-admin-t';
import { useProductImage } from '../_lib/product-images';
import { PriceSparkline } from './price-sparkline';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  );
}

function PriceBlock({ item, labels }: { item: PriceAdminItem; labels: [string, string, string] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {([[labels[0], item.minPrice], [labels[1], item.avgPrice], [labels[2], item.maxPrice]] as const).map(([label, value], index) => (
        <div key={label} className={`rounded-lg border p-3 ${index === 1 ? 'bg-primary/5' : ''}`}>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tabular-nums">{money(value)}</div>
          <div className="text-xs text-muted-foreground">{item.currency ?? 'TRY'} / {item.unit}</div>
        </div>
      ))}
    </div>
  );
}

export function PriceDetailSheet({ item, onClose }: { item: PriceAdminItem | null; onClose: () => void }) {
  const t = useAdminT('admin.prices.detail');
  const tc = useAdminT('admin.common');
  const { data, isFetching } = useGetPriceDetailAdminQuery(item?.id ?? 0, { skip: !item });
  const detail = data?.item?.id === item?.id ? data : undefined;
  const productImage = useProductImage();
  const cover = item ? productImage(item.productSlug, item.canonicalSlug) : null;

  return (
    <Sheet open={Boolean(item)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {item ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <div className="flex items-start gap-3 pr-8">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cover} alt="" className="size-12 shrink-0 rounded-lg border object-cover" />
                ) : null}
                <div className="min-w-0">
                <SheetTitle className="truncate text-base">{item.productName}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <span>{item.marketName} · {item.cityName}</span>
                  <span aria-hidden>·</span>
                  <span>{shortDate(item.recordedDate)} ({ageLabel(item.recordedDate, tc)})</span>
                  {item.unitMismatch ? <Badge variant="outline" className="border-amber-500/50 font-normal text-amber-700">{t('unitMismatch')}</Badge> : null}
                  {item.quarantined ? <Badge variant="destructive" className="font-normal">{t('inQuarantine')}</Badge> : null}
                  {item.productActive === false ? <Badge variant="outline" className="font-normal">{t('passiveProduct')}</Badge> : null}
                </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 pt-3">
                <TabsList>
                  <TabsTrigger value="summary">{t('tabs.summary')}</TabsTrigger>
                  <TabsTrigger value="history">{t('tabs.history')} {detail ? `(${detail.history.length})` : ''}</TabsTrigger>
                  <TabsTrigger value="peers">{t('tabs.peers')} {detail ? `(${detail.peers.length})` : ''}</TabsTrigger>
                  <TabsTrigger value="quarantine">{t('tabs.quarantine')} {detail?.quarantine.length ? `(${detail.quarantine.length})` : ''}</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="summary" className="mt-0 space-y-5">
                  <PriceBlock item={item} labels={[t('min'), t('avg'), t('max')]} />

                  {detail?.stats ? (
                    <div className="rounded-lg border p-3">
                      <div className="mb-2 text-sm font-medium">{t('last30')}</div>
                      <dl className="grid grid-cols-4 gap-3">
                        <Field label={t('rows')}>{detail.stats.rows30}</Field>
                        <Field label={t('min')}>{money(detail.stats.min30)}</Field>
                        <Field label={t('avg')}>{money(detail.stats.avg30)}</Field>
                        <Field label={t('max')}>{money(detail.stats.max30)}</Field>
                      </dl>
                    </div>
                  ) : null}

                  {detail?.history.length ? (
                    <div className="rounded-lg border p-3">
                      <div className="mb-2 text-sm font-medium">{t('curve')}</div>
                      <PriceSparkline points={detail.history} t={t} />
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-2 text-sm font-medium">{t('record')}</div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      <Field label={t('recordNo')}>#{item.id}</Field>
                      <Field label={t('source')}><span className="font-mono text-xs">{item.sourceApi}</span></Field>
                      <Field label={t('avgMethod')}>{t(`avgMethods.${item.avgPriceMethod ?? 'unknown'}`, undefined, item.avgPriceMethod)}</Field>
                      <Field label={t('unit')}>{item.unit}</Field>
                      <Field label={t('currency')}>{item.currency ?? 'TRY'}</Field>
                      <Field label={t('createdAt')}>{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : '—'}</Field>
                    </dl>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">{t('product')}</div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      <Field label={t('productNo')}>#{item.productId}</Field>
                      <Field label={t('slug')}><span className="font-mono text-xs">{item.productSlug}</span></Field>
                      <Field label={t('nameTr')}>{item.productNameTr ?? '—'}</Field>
                      <Field label={t('category')}>{item.categorySlug ?? '—'}</Field>
                      <Field label={t('productUnit')}>{item.productUnit ?? '—'}</Field>
                      <Field label={t('canonical')}>{item.canonicalSlug ?? t('self')}</Field>
                      <Field label={t('status')}>{item.productActive === false ? t('passive') : t('active')}</Field>
                    </dl>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">{t('market')}</div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      <Field label={t('marketNo')}>#{item.marketId}</Field>
                      <Field label={t('slug')}><span className="font-mono text-xs">{item.marketSlug}</span></Field>
                      <Field label={t('city')}>{item.cityName}</Field>
                      <Field label={t('type')}>{t(`marketTypes.${item.marketType ?? 'hal'}`, undefined, item.marketType)}</Field>
                      <Field label={t('status')}>{item.marketActive === false ? t('passive') : t('active')}</Field>
                    </dl>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  {isFetching && !detail ? <p className="text-sm text-muted-foreground">{tc('loading')}</p> : (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>{tc('date', undefined, 'Tarih')}</TableHead>
                            <TableHead className="text-right">{t('min')}</TableHead>
                            <TableHead className="text-right">{t('avg')}</TableHead>
                            <TableHead className="text-right">{t('max')}</TableHead>
                            <TableHead>{t('source')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail?.history.map((point) => (
                            <TableRow key={point.id} className={point.id === item.id ? 'bg-primary/5' : ''}>
                              <TableCell className="whitespace-nowrap">{shortDate(point.recordedDate)}</TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">{money(point.minPrice)}</TableCell>
                              <TableCell className="text-right font-medium tabular-nums">{money(point.avgPrice)}</TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">{money(point.maxPrice)}</TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">{point.sourceApi}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="peers" className="mt-0 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t('peersHint', { date: shortDate(item.recordedDate) })}
                  </p>
                  {!detail?.peers.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t('peersEmpty')}</p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>{t('market')}</TableHead>
                            <TableHead className="text-right">{t('avg')}</TableHead>
                            <TableHead className="text-right">{t('diff')}</TableHead>
                            <TableHead>{t('unit')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.peers.map((peer) => {
                            const diff = percentDiff(peer.avgPrice, item.avgPrice);
                            return (
                              <TableRow key={peer.id}>
                                <TableCell>
                                  <div className="text-sm">{peer.marketName}</div>
                                  <div className="text-xs text-muted-foreground">{peer.cityName}</div>
                                </TableCell>
                                <TableCell className="text-right font-medium tabular-nums">{money(peer.avgPrice)}</TableCell>
                                <TableCell className={`text-right tabular-nums ${diff == null ? '' : diff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                  {diff == null ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{peer.unit}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="quarantine" className="mt-0 space-y-2">
                  {!detail?.quarantine.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">{t('quarantineEmpty')}</p>
                  ) : detail.quarantine.map((entry) => (
                    <div key={entry.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{shortDate(entry.recordedDate)} · {entry.reasonCode}</span>
                        <div className="flex gap-1.5">
                          <Badge variant={entry.severity === 'critical' ? 'destructive' : 'secondary'} className="font-normal">{entry.severity}</Badge>
                          <Badge variant="outline" className="font-normal">{entry.status}</Badge>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {t('quarantineLine', { price: money(entry.avgPrice), median: money(entry.peerMedian) })}
                        {entry.deviationRatio ? ` · ${t('deviation', { ratio: Number(entry.deviationRatio).toFixed(2) })}` : ''}
                      </div>
                      {entry.reviewNote ? <p className="mt-1 text-muted-foreground">{entry.reviewNote}</p> : null}
                    </div>
                  ))}
                </TabsContent>
              </div>
            </Tabs>

            <SheetFooter className="border-t px-6 py-3">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline">
                  <Link href={`https://haldefiyat.com/urun/${item.productSlug}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" /> {t('productPage')}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/admin/prices/${item.id}`}><Pencil className="size-4" /> {t('editRecord')}</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
