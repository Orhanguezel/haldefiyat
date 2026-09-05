'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PACKAGES } from '../_lib/api';
type T = (key: string, params?: Record<string, string | number>, fallback?: string) => string;
import { listingSlots, rowOccupants, slotRowPlan } from '../_lib/ads';
import type { AdRow, AdSlot, PackageKey, Pricing } from '../_lib/types';

type Props = {
  pricing: Pricing | null;
  onPricingChange: (key: PackageKey, price: number) => void;
  onSave: () => void;
  saving: boolean;
  slots: AdSlot[];
  ads: AdRow[];
  t: T;
  tc: T;
};

export function SettingsPanel({ pricing, onPricingChange, onSave, saving, slots, ads, t, tc }: Props) {
  const available = listingSlots(slots);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">{t('settings.pricingTitle')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('settings.pricingHint')}</p>
          </div>
          <Button onClick={onSave} disabled={!pricing || saving}>{saving ? tc('saving') : tc('save')}</Button>
        </CardHeader>
        <CardContent>
          {!pricing ? <p className="text-sm text-muted-foreground">{tc('loading')}</p> : (
            <div className="grid gap-4 sm:grid-cols-3">
              {(PACKAGES as readonly PackageKey[]).map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm">{t(`ad.packages.${key}`)} · {pricing[key].days} {tc('days')}</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      className="pr-8"
                      value={pricing[key].price}
                      onChange={(event) => onPricingChange(key, Number(event.target.value))}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₺</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('settings.slotsTitle')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('settings.slotsHint')}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {available.length === 0 ? <p className="text-sm text-muted-foreground">{t('settings.noSlots')}</p> : available.map((slot) => {
            const plans = slotRowPlan(ads, slot, 'all');
            const free = plans.reduce((total, plan) => total + (plan.mixedLayout && plan.occupants.length ? 0 : plan.free), 0);
            const used = rowOccupants(ads, slot.slotKey, 1, 'all').length;
            return (
              <div key={slot.slotKey} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">{slot.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {t('settings.slotMeta', { capacity: slot.desktopCapacity, used })}
                  </div>
                </div>
                <Badge variant={free > 0 ? 'secondary' : 'outline'} className="font-normal">
                  {free > 0 ? t('settings.freeSlots', { count: free }) : t('settings.noFree')}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
