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
import { AVG_METHOD_LABEL, ageLabel, MARKET_TYPE_LABEL, money, percentDiff, shortDate } from '../_lib/format';
import { PriceSparkline } from './price-sparkline';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  );
}

function PriceBlock({ item }: { item: PriceAdminItem }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {([['En düşük', item.minPrice], ['Ortalama', item.avgPrice], ['En yüksek', item.maxPrice]] as const).map(([label, value], index) => (
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
  const { data, isFetching } = useGetPriceDetailAdminQuery(item?.id ?? 0, { skip: !item });
  const detail = data?.item?.id === item?.id ? data : undefined;

  return (
    <Sheet open={Boolean(item)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {item ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <div className="pr-8">
                <SheetTitle className="truncate text-base">{item.productName}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <span>{item.marketName} · {item.cityName}</span>
                  <span aria-hidden>·</span>
                  <span>{shortDate(item.recordedDate)} ({ageLabel(item.recordedDate)})</span>
                  {item.unitMismatch ? <Badge variant="outline" className="border-amber-500/50 font-normal text-amber-700">birim uyuşmuyor</Badge> : null}
                  {item.quarantined ? <Badge variant="destructive" className="font-normal">karantinada</Badge> : null}
                  {item.productActive === false ? <Badge variant="outline" className="font-normal">pasif ürün</Badge> : null}
                </SheetDescription>
              </div>
            </SheetHeader>

            <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 pt-3">
                <TabsList>
                  <TabsTrigger value="summary">Özet</TabsTrigger>
                  <TabsTrigger value="history">Geçmiş {detail ? `(${detail.history.length})` : ''}</TabsTrigger>
                  <TabsTrigger value="peers">Aynı gün {detail ? `(${detail.peers.length})` : ''}</TabsTrigger>
                  <TabsTrigger value="quarantine">Karantina {detail?.quarantine.length ? `(${detail.quarantine.length})` : ''}</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="summary" className="mt-0 space-y-5">
                  <PriceBlock item={item} />

                  {detail?.stats ? (
                    <div className="rounded-lg border p-3">
                      <div className="mb-2 text-sm font-medium">Bu üründe bu halde son 30 gün</div>
                      <dl className="grid grid-cols-4 gap-3">
                        <Field label="Kayıt">{detail.stats.rows30}</Field>
                        <Field label="En düşük">{money(detail.stats.min30)}</Field>
                        <Field label="Ortalama">{money(detail.stats.avg30)}</Field>
                        <Field label="En yüksek">{money(detail.stats.max30)}</Field>
                      </dl>
                    </div>
                  ) : null}

                  {detail?.history.length ? (
                    <div className="rounded-lg border p-3">
                      <div className="mb-2 text-sm font-medium">Fiyat eğrisi</div>
                      <PriceSparkline points={detail.history} />
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-2 text-sm font-medium">Kayıt</div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      <Field label="Kayıt no">#{item.id}</Field>
                      <Field label="Kaynak"><span className="font-mono text-xs">{item.sourceApi}</span></Field>
                      <Field label="Ortalama yöntemi">{AVG_METHOD_LABEL[item.avgPriceMethod ?? 'unknown'] ?? item.avgPriceMethod}</Field>
                      <Field label="Birim">{item.unit}</Field>
                      <Field label="Para birimi">{item.currency ?? 'TRY'}</Field>
                      <Field label="Sisteme giriş">{item.createdAt ? new Date(item.createdAt).toLocaleString('tr-TR') : '—'}</Field>
                    </dl>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Ürün</div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      <Field label="Ürün no">#{item.productId}</Field>
                      <Field label="Slug"><span className="font-mono text-xs">{item.productSlug}</span></Field>
                      <Field label="Adı (TR)">{item.productNameTr ?? '—'}</Field>
                      <Field label="Kategori">{item.categorySlug ?? '—'}</Field>
                      <Field label="Ürün birimi">{item.productUnit ?? '—'}</Field>
                      <Field label="Kanonik">{item.canonicalSlug ?? 'kendisi'}</Field>
                      <Field label="Durum">{item.productActive === false ? 'pasif' : 'aktif'}</Field>
                    </dl>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-medium">Hal</div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                      <Field label="Hal no">#{item.marketId}</Field>
                      <Field label="Slug"><span className="font-mono text-xs">{item.marketSlug}</span></Field>
                      <Field label="Şehir">{item.cityName}</Field>
                      <Field label="Tür">{MARKET_TYPE_LABEL[item.marketType ?? 'hal'] ?? item.marketType}</Field>
                      <Field label="Durum">{item.marketActive === false ? 'pasif' : 'aktif'}</Field>
                    </dl>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                  {isFetching && !detail ? <p className="text-sm text-muted-foreground">Yükleniyor…</p> : (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>Tarih</TableHead>
                            <TableHead className="text-right">Min</TableHead>
                            <TableHead className="text-right">Ort</TableHead>
                            <TableHead className="text-right">Maks</TableHead>
                            <TableHead>Kaynak</TableHead>
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
                    {shortDate(item.recordedDate)} tarihinde aynı ürünün diğer hallerdeki fiyatı. Yüzde, bu kaydın ortalamasına göre.
                  </p>
                  {!detail?.peers.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">O gün başka halde kayıt yok.</p>
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>Hal</TableHead>
                            <TableHead className="text-right">Ort</TableHead>
                            <TableHead className="text-right">Fark</TableHead>
                            <TableHead>Birim</TableHead>
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
                    <p className="py-8 text-center text-sm text-muted-foreground">Bu ürün-hal çiftinde karantina kaydı yok.</p>
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
                        kayıt {money(entry.avgPrice)} · emsal ortancası {money(entry.peerMedian)}
                        {entry.deviationRatio ? ` · sapma ${Number(entry.deviationRatio).toFixed(2)}x` : ''}
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
                    <ExternalLink className="size-4" /> Ürün sayfası
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={`/admin/prices/${item.id}`}><Pencil className="size-4" /> Kaydı düzenle</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
