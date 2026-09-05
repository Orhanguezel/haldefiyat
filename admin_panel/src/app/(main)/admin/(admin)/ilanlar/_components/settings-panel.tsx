'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PKG_LABEL } from '../_lib/api';
import { listingSlots, rowOccupants, slotRowPlan } from '../_lib/ads';
import type { AdRow, AdSlot, PackageKey, Pricing } from '../_lib/types';

type Props = {
  pricing: Pricing | null;
  onPricingChange: (key: PackageKey, price: number) => void;
  onSave: () => void;
  saving: boolean;
  slots: AdSlot[];
  ads: AdRow[];
};

export function SettingsPanel({ pricing, onPricingChange, onSave, saving, slots, ads }: Props) {
  const available = listingSlots(slots);
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Öne çıkarma paket fiyatları</CardTitle>
            <p className="text-sm text-muted-foreground">Reklam sekmesinde bu tutarlar gösterilir.</p>
          </div>
          <Button onClick={onSave} disabled={!pricing || saving}>{saving ? 'Kaydediliyor…' : 'Kaydet'}</Button>
        </CardHeader>
        <CardContent>
          {!pricing ? <p className="text-sm text-muted-foreground">Yükleniyor…</p> : (
            <div className="grid gap-4 sm:grid-cols-3">
              {(['daily', 'weekly', 'monthly'] as PackageKey[]).map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-sm">{PKG_LABEL[key]} · {pricing[key].days} gün</Label>
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
          <CardTitle className="text-base">Reklam yeri doluluk durumu</CardTitle>
          <p className="text-sm text-muted-foreground">İlan reklamı alabilen slotlar ve boş yerleri.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {available.length === 0 ? <p className="text-sm text-muted-foreground">İlan reklamına açık slot yok.</p> : available.map((slot) => {
            const plans = slotRowPlan(ads, slot, 'all');
            const free = plans.reduce((total, plan) => total + (plan.mixedLayout && plan.occupants.length ? 0 : plan.free), 0);
            const used = rowOccupants(ads, slot.slotKey, 1, 'all').length;
            return (
              <div key={slot.slotKey} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">{slot.label}</div>
                  <div className="text-xs text-muted-foreground">
                    Satır başına {slot.desktopCapacity} reklam · 1. satırda {used} dolu
                  </div>
                </div>
                <Badge variant={free > 0 ? 'secondary' : 'outline'} className="font-normal">
                  {free > 0 ? `${free} boş yer` : 'boş yer yok'}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
