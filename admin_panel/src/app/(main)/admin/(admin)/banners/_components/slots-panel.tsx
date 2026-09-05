'use client';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { TranslateFn } from '@/i18n';
import type { AdSlotAdmin, AdSlotAvailability } from '@/integrations/endpoints/banners-admin-endpoints';
import { useUpdateAdSlotAdminMutation } from '@/integrations/hooks';

const MULTIPLIERS = ['trafficMultiplier', 'visibilityMultiplier', 'desktopMultiplier', 'mobileMultiplier'] as const;

/** Satilabilir alan katalogu: kapasite, fiyat carpanlari ve bugunku uygunluk. */
export function SlotsPanel({ slots, availability, t }: { slots: AdSlotAdmin[]; availability: AdSlotAvailability[]; t: TranslateFn }) {
  const [update] = useUpdateAdSlotAdminMutation();
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {slots.map((slot) => {
        const avail = availability.find((a) => a.slotKey === slot.slotKey);
        return (
          <div key={slot.slotKey} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div><div className="font-medium">{slot.label}</div><div className="mt-1 font-mono text-[10px] text-muted-foreground">{slot.slotKey}</div></div>
              <button type="button" onClick={() => update({ slotKey: slot.slotKey, patch: { isActive: !slot.isActive } })}>
                <Badge variant={slot.isActive ? 'default' : 'outline'}>{slot.isActive ? t('slots.open') : t('slots.closed')}</Badge>
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{slot.placementDescription}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Badge variant="secondary">{t('slots.desktop', { count: slot.desktopCapacity })}</Badge>
              <Badge variant="secondary">{t('slots.mobile', { count: slot.mobileCapacity })}</Badge>
              <Badge variant="outline">{slot.deliveryMode === 'fixed' ? t('slots.fixed') : t('slots.rotation')}</Badge>
              {slot.recommendedSize ? <Badge variant="outline">{slot.recommendedSize}</Badge> : null}
            </div>
            <div className="mt-3 text-[11px] text-muted-foreground">{t('slots.sources')}: {slot.sourceTypes.map((s) => t(`sources.${s}`)).join(', ')} · {t('slots.mobileBehavior')}: {slot.mobileBehavior}</div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
              <div className="text-[10px] text-muted-foreground">{t('slots.basePrice')}<Input aria-label={t('slots.basePrice')} className="mt-1 h-7 text-xs" type="number" defaultValue={slot.baseDailyPrice} onBlur={(e) => update({ slotKey: slot.slotKey, patch: { baseDailyPrice: e.target.value } })} /></div>
              {MULTIPLIERS.map((key) => (
                <div key={key} className="text-[10px] text-muted-foreground">{t(`slots.${key}`)}<Input aria-label={t(`slots.${key}`)} className="mt-1 h-7 text-xs" type="number" step="0.01" defaultValue={slot[key]} onBlur={(e) => update({ slotKey: slot.slotKey, patch: { [key]: e.target.value } })} /></div>
              ))}
            </div>
            <div className="mt-2 border-t pt-2 text-[11px]">
              {!avail ? <span className="text-muted-foreground">{t('slots.computing')}</span>
                : avail.available > 0 ? <span className="font-medium text-emerald-700">{t('slots.freeToday', { count: avail.available })}</span>
                : <span className="font-medium text-amber-700">{t('slots.nextFree', { date: avail.nextAvailableAt ? new Date(`${avail.nextAvailableAt}T12:00:00`).toLocaleDateString('tr-TR') : t('slots.none365') })}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
