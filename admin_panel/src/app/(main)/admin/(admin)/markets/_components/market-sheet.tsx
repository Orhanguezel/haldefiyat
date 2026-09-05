'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ExternalLink, Save, Table2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TranslateFn } from '@/i18n';
import { BASE_URL } from '@/integrations/api-base';
import { useUpdateMarketAdminMutation } from '@/integrations/hooks';
import { HEALTH_TONE, MARKET_TYPES, type MarketRow, type MarketType } from '../_lib/market-meta';

const SITE = BASE_URL.replace(/\/api\/v1\/?$/, '');

function toForm(r: MarketRow) {
  return {
    name: r.name, slug: r.slug, cityName: r.cityName, regionSlug: r.regionSlug ?? '', sourceKey: r.sourceKey ?? '',
    displayOrder: String(r.displayOrder ?? 0), address: r.address ?? '', phone: r.phone ?? '', founded: r.founded ?? '', hours: r.hours ?? '',
    marketType: (r.marketType ?? 'hal') as MarketType, seoIndex: r.seoIndex == null ? true : Boolean(r.seoIndex), isActive: Boolean(r.isActive),
  };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>;
}
function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">{label}</div><div className="text-lg font-semibold tabular-nums">{value}</div></div>;
}

type Props = { row: MarketRow | null; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function MarketSheet({ row, onClose, t, tc }: Props) {
  const [update, state] = useUpdateMarketAdminMutation();
  const [form, setForm] = useState(() => (row ? toForm(row) : null));
  const rowId = row?.id ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setForm(row ? toForm(row) : null); }, [rowId]);
  const set = <K extends keyof NonNullable<typeof form>>(k: K, v: NonNullable<typeof form>[K]) => setForm((p) => (p ? { ...p, [k]: v } : p));

  async function save() {
    if (!row || !form) return;
    try {
      await update({ id: row.id, body: {
        slug: form.slug.trim(), name: form.name.trim(), cityName: form.cityName.trim(), regionSlug: form.regionSlug.trim() || null,
        sourceKey: form.sourceKey.trim() || null, displayOrder: Number(form.displayOrder || 0), address: form.address.trim() || null,
        phone: form.phone.trim() || null, founded: form.founded.trim() || null, hours: form.hours.trim() || null,
        marketType: form.marketType, seoIndex: form.seoIndex, isActive: form.isActive,
      } }).unwrap();
      toast.success(t('sheet.saved'));
    } catch { toast.error(t('sheet.saveFailed')); }
  }

  const s = row?.stats;
  return (
    <Sheet open={Boolean(row)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {row && form ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <div className="pr-8">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <span className={`size-2.5 rounded-full ${HEALTH_TONE[row.health]}`} />{row.name}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <span>{row.cityName}</span><span aria-hidden>·</span><span className="font-mono text-xs">{row.slug}</span>
                  <Badge variant="secondary" className="font-normal">{t(`types.${row.marketType ?? 'hal'}`)}</Badge>
                  <Badge variant={row.health === 'live' ? 'default' : row.health === 'dry' ? 'destructive' : 'outline'} className="font-normal">{t(`sheet.health.${row.health}`)}</Badge>
                  {!row.isActive ? <Badge variant="secondary" className="font-normal">{tc('passive')}</Badge> : null}
                </SheetDescription>
              </div>
            </SheetHeader>
            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 pt-3"><TabsList>
                <TabsTrigger value="overview">{t('sheet.tabs.overview')}</TabsTrigger>
                <TabsTrigger value="edit">{t('sheet.tabs.edit')}</TabsTrigger>
                <TabsTrigger value="contact">{t('sheet.tabs.contact')}</TabsTrigger>
              </TabsList></div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stat label={t('sheet.lastData')} value={s?.lastDate ?? '—'} />
                    <Stat label={t('sheet.rows30')} value={(s?.rows30 ?? 0).toLocaleString('tr-TR')} />
                    <Stat label={t('sheet.products30')} value={s?.products30 ?? 0} />
                    <Stat label={t('sheet.days30')} value={s?.days30 ?? 0} />
                    <Stat label={t('sheet.rowsAll')} value={(s?.rowsAll ?? 0).toLocaleString('tr-TR')} />
                    <Stat label={t('sheet.firstData')} value={s?.firstDate ?? '—'} />
                  </div>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                    <div><dt className="text-xs text-muted-foreground">{t('sheet.fields.sourceKey')}</dt><dd className="font-mono text-xs">{row.sourceKey || '—'}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">{t('sheet.fields.region')}</dt><dd>{row.regionSlug || '—'}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">{t('sheet.fields.order')}</dt><dd>{row.displayOrder}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">{t('sheet.fields.seoIndex')}</dt><dd>{row.seoIndex === 0 || row.seoIndex === false ? t('table.noindex') : 'index'}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">{t('sheet.fields.founded')}</dt><dd>{row.founded || '—'}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">{t('sheet.fields.hours')}</dt><dd>{row.hours || '—'}</dd></div>
                  </dl>
                </TabsContent>
                <TabsContent value="edit" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <Field label={t('sheet.fields.name')}><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.slug')}><Input value={form.slug} className="font-mono" onChange={(e) => set('slug', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.city')}><Input value={form.cityName} onChange={(e) => set('cityName', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.region')}><Input value={form.regionSlug} onChange={(e) => set('regionSlug', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.type')}>
                    <Select value={form.marketType} onValueChange={(v) => set('marketType', v as MarketType)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{MARKET_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`types.${k}`)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={t('sheet.fields.order')}><Input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} /></Field>
                  <div className="sm:col-span-2"><Field label={t('sheet.fields.sourceKey')} hint={t('sheet.fields.sourceHint')}><Input value={form.sourceKey} className="font-mono" onChange={(e) => set('sourceKey', e.target.value)} /></Field></div>
                  <label className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm"><span><span className="font-medium">{t('sheet.fields.active')}</span><br /><span className="text-xs text-muted-foreground">{t('sheet.fields.activeHint')}</span></span><Switch checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} /></label>
                  <label className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm"><span><span className="font-medium">{t('sheet.fields.seoIndex')}</span><br /><span className="text-xs text-muted-foreground">{t('sheet.fields.seoIndexHint')}</span></span><Switch checked={form.seoIndex} onCheckedChange={(v) => set('seoIndex', v)} /></label>
                </TabsContent>
                <TabsContent value="contact" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Field label={t('sheet.fields.address')}><Input value={form.address} placeholder={t('sheet.fields.addressPlaceholder')} onChange={(e) => set('address', e.target.value)} /></Field></div>
                  <Field label={t('sheet.fields.phone')}><Input value={form.phone} placeholder={t('sheet.fields.phonePlaceholder')} onChange={(e) => set('phone', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.founded')}><Input value={form.founded} placeholder={t('sheet.fields.foundedPlaceholder')} onChange={(e) => set('founded', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.hours')}><Input value={form.hours} placeholder={t('sheet.fields.hoursPlaceholder')} onChange={(e) => set('hours', e.target.value)} /></Field>
                </TabsContent>
              </div>
            </Tabs>
            <SheetFooter className="border-t px-6 py-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm"><a href={`${SITE}/hal/${row.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> {t('sheet.publicPage')}</a></Button>
                  <Button asChild variant="outline" size="sm"><Link href={`/admin/prices?market=${row.slug}`}><Table2 className="size-4" /> {t('sheet.pricesLink')}</Link></Button>
                </div>
                <Button onClick={save} disabled={state.isLoading}><Save className="size-4" /> {state.isLoading ? tc('saving') : tc('save')}</Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
