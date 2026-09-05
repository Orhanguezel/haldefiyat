'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TranslateFn } from '@/i18n';
import type { AdPriceQuote, AdSlotAdmin, BannerAdmin } from '@/integrations/endpoints/banners-admin-endpoints';
import { useCreateAdPackageAdminMutation, useListAdPackagesAdminQuery, useQuoteAdPriceAdminMutation, useUpdateAdPackageAdminMutation } from '@/integrations/hooks';
import { errorMessage, money, positionLabel } from '../_lib/banner-meta';

const PERIODS = ['daily', 'weekly', 'monthly', 'custom'] as const;
const SCOPES = ['global', 'page_type', 'city', 'district', 'product', 'category', 'market', 'firm', 'listing'] as const;
const EMPTY_PKG = { name: '', slug: '', billingPeriod: 'monthly', durationDays: '30', price: '', impressionLimit: '', clickLimit: '', slotKeys: [] as string[], includesFirmProfile: false };

function Sel({ value, onChange, items, labelOf }: { value: string; onChange: (v: string) => void; items: readonly string[]; labelOf: (k: string) => string }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{items.map((k) => <SelectItem key={k} value={k}>{labelOf(k)}</SelectItem>)}</SelectContent></Select>;
}

export function PackagesPanel({ slots, t, tc }: { slots: AdSlotAdmin[]; t: TranslateFn; tc: TranslateFn }) {
  const { data } = useListAdPackagesAdminQuery();
  const [createPackage, cp] = useCreateAdPackageAdminMutation();
  const [updatePackage] = useUpdateAdPackageAdminMutation();
  const [quote, q] = useQuoteAdPriceAdminMutation();
  const [pkg, setPkg] = useState(EMPTY_PKG);
  const [price, setPrice] = useState({ slotKey: slots[0]?.slotKey ?? 'global_footer', device: 'all', durationDays: '30', startAt: new Date().toISOString().slice(0, 10), targetType: 'global', manualPrice: '', manualDiscountPercent: '', overrideReason: '' });
  const [result, setResult] = useState<AdPriceQuote | null>(null);
  const setP = (k: keyof typeof price, v: string) => setPrice((p) => ({ ...p, [k]: v }));

  async function create() {
    if (!pkg.name.trim() || !pkg.slug.trim() || !pkg.price) { toast.error(t('packages.required')); return; }
    try {
      await createPackage({ name: pkg.name.trim(), slug: pkg.slug.trim(), billingPeriod: pkg.billingPeriod as 'monthly', durationDays: Number(pkg.durationDays) || 30, price: Number(pkg.price), devices: ['all'],
        impressionLimit: pkg.impressionLimit ? Number(pkg.impressionLimit) : null, clickLimit: pkg.clickLimit ? Number(pkg.clickLimit) : null, includesFirmProfile: pkg.includesFirmProfile, customPriceAllowed: true, slotKeys: pkg.slotKeys as BannerAdmin['position'][] }).unwrap();
      setPkg(EMPTY_PKG); toast.success(t('packages.created'));
    } catch (err) { toast.error(errorMessage(err, tc('saveFailed'))); }
  }
  async function compute() {
    try {
      const res = await quote({ slotKey: price.slotKey as BannerAdmin['position'], device: price.device as 'all', durationDays: Number(price.durationDays) || 1, startAt: price.startAt || null, targetTypes: [price.targetType as 'global'],
        manualPrice: price.manualPrice ? Number(price.manualPrice) : undefined, manualDiscountPercent: price.manualDiscountPercent ? Number(price.manualDiscountPercent) : undefined, overrideReason: price.overrideReason.trim() || undefined }).unwrap();
      setResult(res); toast.success(res.overrideId ? t('quote.computedOverride') : t('quote.computed'));
    } catch (err) { toast.error(errorMessage(err, t('quote.failed'))); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">{t('packages.title')}</CardTitle><CardDescription>{t('packages.hint')}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <Input value={pkg.name} onChange={(e) => setPkg((p) => ({ ...p, name: e.target.value, slug: p.slug || e.target.value.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} placeholder={t('packages.name')} />
            <Input value={pkg.slug} onChange={(e) => setPkg((p) => ({ ...p, slug: e.target.value }))} placeholder="paket-slug" />
            <Sel value={pkg.billingPeriod} onChange={(v) => setPkg((p) => ({ ...p, billingPeriod: v }))} items={PERIODS} labelOf={(k) => t(`packages.periods.${k}`)} />
            <Input value={pkg.durationDays} onChange={(e) => setPkg((p) => ({ ...p, durationDays: e.target.value }))} type="number" min={1} placeholder={t('packages.duration')} />
            <Input value={pkg.price} onChange={(e) => setPkg((p) => ({ ...p, price: e.target.value }))} type="number" min={0} placeholder={t('packages.price')} />
            <Input value={pkg.impressionLimit} onChange={(e) => setPkg((p) => ({ ...p, impressionLimit: e.target.value }))} type="number" min={1} placeholder={t('packages.impressionLimit')} />
            <Input value={pkg.clickLimit} onChange={(e) => setPkg((p) => ({ ...p, clickLimit: e.target.value }))} type="number" min={1} placeholder={t('packages.clickLimit')} />
            <Button type="button" variant={pkg.includesFirmProfile ? 'default' : 'outline'} onClick={() => setPkg((p) => ({ ...p, includesFirmProfile: !p.includesFirmProfile }))}>{t('packages.firmProfile')}</Button>
          </div>
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
            {slots.map((s) => { const on = pkg.slotKeys.includes(s.slotKey); return <Button key={s.slotKey} type="button" size="sm" variant={on ? 'default' : 'outline'} onClick={() => setPkg((p) => ({ ...p, slotKeys: on ? p.slotKeys.filter((k) => k !== s.slotKey) : [...p.slotKeys, s.slotKey] }))}>{s.label}</Button>; })}
          </div>
          <Button onClick={create} disabled={cp.isLoading}>{t('packages.create')}</Button>
          <div className="grid gap-3 md:grid-cols-3">
            {(data?.items ?? []).map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-semibold">{item.name}</div><div className="text-xs text-muted-foreground">{t('packages.days', { count: item.durationDays })} · {Number(item.price).toLocaleString('tr-TR')} {item.currency}</div></div>
                  <Button size="sm" variant={item.isActive ? 'default' : 'outline'} onClick={() => updatePackage({ id: item.id, patch: { isActive: !item.isActive } })}>{item.isActive ? tc('active') : tc('passive')}</Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">{item.slotKeys.map((k) => <Badge key={k} variant="outline">{positionLabel(slots, k)}</Badge>)}</div>
                <div className="mt-2 text-xs text-muted-foreground">{item.devices.map((d) => t(`devices.${d}`)).join(', ')}{item.impressionLimit ? ` · ${t('packages.impressions', { count: item.impressionLimit })}` : ''}{item.clickLimit ? ` · ${t('packages.clicks', { count: item.clickLimit })}` : ''}{item.includesFirmProfile ? ` · ${t('packages.firmIncluded')}` : ''}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">{t('quote.title')}</CardTitle><CardDescription>{t('quote.hint')}</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <Sel value={price.slotKey} onChange={(v) => setP('slotKey', v)} items={slots.map((s) => s.slotKey)} labelOf={(k) => positionLabel(slots, k)} />
            <Sel value={price.device} onChange={(v) => setP('device', v)} items={['all', 'desktop', 'mobile']} labelOf={(k) => t(`devices.${k}`)} />
            <Input type="number" min={1} value={price.durationDays} onChange={(e) => setP('durationDays', e.target.value)} placeholder={t('packages.duration')} />
            <Input type="date" value={price.startAt} onChange={(e) => setP('startAt', e.target.value)} />
            <Sel value={price.targetType} onChange={(v) => setP('targetType', v)} items={SCOPES} labelOf={(k) => t(`scopes.${k}`)} />
            <Input type="number" min={0} value={price.manualPrice} onChange={(e) => setP('manualPrice', e.target.value)} placeholder={t('quote.manualPrice')} />
            <Input type="number" min={0} max={100} value={price.manualDiscountPercent} onChange={(e) => setP('manualDiscountPercent', e.target.value)} placeholder={t('quote.manualDiscount')} />
            <Input value={price.overrideReason} onChange={(e) => setP('overrideReason', e.target.value)} placeholder={t('quote.overrideReason')} />
          </div>
          <Button onClick={compute} disabled={q.isLoading}>{t('quote.compute')}</Button>
          {result && 'suggestedPrice' in result ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-end gap-6">
                <div><div className="text-xs text-muted-foreground">{t('quote.suggested')}</div><div className="text-2xl font-semibold">{money(result.suggestedPrice)}</div></div>
                <div><div className="text-xs text-muted-foreground">{t('quote.applied')}</div><div className="text-xl font-medium">{money(result.appliedPrice)}</div></div>
                <Badge variant="outline">{t('quote.discount', { pct: result.discountPercent })}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">{Object.entries(result.factors).map(([k, v]) => <span key={k} className="rounded border bg-background px-2 py-1">{t(`quote.factors.${k}`, undefined, k)}: {v}</span>)}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
