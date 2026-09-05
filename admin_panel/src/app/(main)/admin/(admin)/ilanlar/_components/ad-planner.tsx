'use client';

import { CircleDot, Lock, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatDate, formatPrice, imageSrc, PACKAGES } from '../_lib/api';
type T = (key: string, params?: Record<string, string | number>, fallback?: string) => string;
import { firstFreeRow, listingSlots, slotRowPlan, type RowPlan } from '../_lib/ads';
import type { AdDevice, AdForm, AdRow, AdSlot, PackageKey, Pricing } from '../_lib/types';

const DEVICES: AdDevice[] = ['all', 'desktop', 'mobile'];

type Props = {
  value: AdForm;
  onChange: (patch: Partial<AdForm>) => void;
  slots: AdSlot[];
  ads: AdRow[];
  currentAdId?: number;
  pricing: Pricing | null;
  listingTitle: string;
  coverImage?: string;
  t: T;
};

function RowStrip({ plan, selected, onSelect, t }: {
  plan: RowPlan; selected: boolean; onSelect: () => void; t: T;
}) {
  const cells = Array.from({ length: plan.columns });
  const blocked = plan.free === 0 || (plan.mixedLayout && plan.occupants.length > 0);
  return (
    <div className={`rounded-lg border p-2 transition ${selected ? 'border-primary bg-primary/5' : blocked ? 'bg-muted/30' : 'hover:border-primary/40'}`}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium">{t('ad.row', { row: plan.row })}</span>
        <span className="text-muted-foreground">
          {blocked ? t('ad.full') : t('ad.free', { free: plan.free, total: plan.columns })}
        </span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${plan.columns}, minmax(0, 1fr))` }}>
        {cells.map((_, index) => {
          const occupant = plan.occupants[index];
          if (occupant) {
            return (
              <div key={occupant.id} className="flex min-h-11 items-center gap-1.5 rounded-md border bg-background px-2 py-1.5 text-xs">
                <Lock className="size-3 shrink-0 text-muted-foreground" />
                <span className="truncate" title={occupant.title ?? ''}>{occupant.title ?? `#${occupant.id}`}</span>
              </div>
            );
          }
          const isTarget = selected && index === plan.occupants.length;
          return (
            <button
              key={`free-${plan.row}-${index}`}
              type="button"
              onClick={onSelect}
              className={`min-h-11 rounded-md border border-dashed px-2 text-xs transition ${
                isTarget ? 'border-primary bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:border-primary hover:text-foreground'
              }`}
            >
              {isTarget ? t('ad.here') : t('ad.pick')}
            </button>
          );
        })}
      </div>
      {plan.mixedLayout && plan.occupants.length ? (
        <p className="mt-1.5 text-xs text-amber-600">
          {t('ad.mixedLayout', { columns: plan.columns })}
        </p>
      ) : null}
    </div>
  );
}

export function AdPlanner({ value, onChange, slots, ads, currentAdId, pricing, listingTitle, coverImage, t }: Props) {
  const available = listingSlots(slots);
  const slot = available.find((entry) => entry.slotKey === value.position) ?? available[0];
  const plans = slotRowPlan(ads, slot, value.device, currentAdId);
  const activePlan = plans.find((plan) => plan.row === value.desktopRow);
  const days = pricing?.[value.package].days ?? { daily: 1, weekly: 7, monthly: 30 }[value.package];
  const price = pricing?.[value.package].price ?? 0;
  const endDate = new Date(Date.now() + days * 86400000).toISOString();

  function selectSlot(slotKey: string) {
    const nextSlot = available.find((entry) => entry.slotKey === slotKey);
    const nextPlans = slotRowPlan(ads, nextSlot, value.device, currentAdId);
    const row = firstFreeRow(nextPlans);
    const plan = nextPlans.find((entry) => entry.row === row);
    onChange({ position: slotKey, desktopRow: row, desktopColumns: plan?.columns ?? Number(nextSlot?.desktopCapacity ?? 1) });
  }

  function selectDevice(device: AdDevice) {
    const nextPlans = slotRowPlan(ads, slot, device, currentAdId);
    const row = nextPlans.find((entry) => entry.row === value.desktopRow)?.free ? value.desktopRow : firstFreeRow(nextPlans);
    const plan = nextPlans.find((entry) => entry.row === row);
    onChange({ device, desktopRow: row, desktopColumns: plan?.columns ?? value.desktopColumns });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="flex gap-3">
          <Megaphone className="mt-0.5 size-5 text-primary" />
          <div>
            <div className="font-medium">{t('ad.toggleTitle')}</div>
            <p className="text-sm text-muted-foreground">
              {t('ad.toggleHint')}
            </p>
          </div>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(enabled) => onChange({ enabled })} />
      </div>

      {!value.enabled ? null : available.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {t('ad.noSlots')}
        </p>
      ) : (
        <>
          <section className="space-y-2">
            <h4 className="text-sm font-medium">{t('ad.step1')}</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {(PACKAGES as readonly PackageKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ package: key })}
                  className={`rounded-lg border p-3 text-left transition ${value.package === key ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}
                >
                  <div className="text-sm font-medium">{t(`ad.packages.${key}`)}</div>
                  <div className="text-xs text-muted-foreground">{t('ad.daysUnit', { count: pricing?.[key].days ?? 0 })}</div>
                  <div className="mt-1 text-lg font-semibold">{formatPrice(pricing?.[key].price ?? 0)} ₺</div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium">{t('ad.step2')}</h4>
            <Select value={slot?.slotKey ?? ''} onValueChange={selectSlot}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t('ad.selectSlot')} /></SelectTrigger>
              <SelectContent>
                {available.map((entry) => (
                  <SelectItem key={entry.slotKey} value={entry.slotKey}>
                    {entry.label} · {t('ad.perRow', { count: entry.desktopCapacity })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DEVICES.map((device) => (
                <Button key={device} size="sm" variant={value.device === device ? 'default' : 'outline'} onClick={() => selectDevice(device)}>
                  {t(`ad.devices.${device}`)}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium">{t('ad.step3')}</h4>
            <p className="text-xs text-muted-foreground">{t('ad.placementHint')}</p>
            <div className="space-y-2">
              {plans.map((plan) => (
                <RowStrip
                  key={plan.row}
                  plan={plan}
                  selected={plan.row === value.desktopRow}
                  onSelect={() => onChange({ desktopRow: plan.row, desktopColumns: plan.columns })}
                  t={t}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium">{t('ad.step4')}</h4>
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">{t('ad.paymentTitle')}</div>
                <p className="text-xs text-muted-foreground">
                  {value.paymentConfirmed ? t('ad.paymentOn') : t('ad.paymentOff')}
                </p>
              </div>
              <Switch checked={value.paymentConfirmed} onCheckedChange={(paymentConfirmed) => onChange({ paymentConfirmed })} />
            </div>
          </section>

          <section className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <CircleDot className={`size-3.5 ${value.paymentConfirmed ? 'text-emerald-600' : 'text-amber-500'}`} />
              {value.paymentConfirmed ? t('ad.willPublish') : t('ad.willReserve')}
            </div>
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t('ad.place')}</dt><dd className="text-right">{slot?.label ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t('ad.position')}</dt><dd>{t('ad.positionValue', { row: value.desktopRow, columns: activePlan?.columns ?? value.desktopColumns })}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t('ad.duration')}</dt><dd>{t('ad.durationValue', { days, date: formatDate(endDate) })}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">{t('ad.amount')}</dt><dd className="font-medium">{formatPrice(price)} ₺</dd></div>
            </dl>
            <div className="mt-3 flex items-center gap-3 rounded-md border bg-background p-3">
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc(coverImage)} alt="" className="size-14 rounded-md border object-cover" />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-md border text-xs text-muted-foreground">{t('ad.noImage')}</div>
              )}
              <div className="min-w-0 flex-1">
                <Badge variant="secondary" className="mb-1 font-normal">{t('ad.sponsored')}</Badge>
                <div className="truncate text-sm font-medium">{listingTitle || t('ad.titleFallback')}</div>
                <div className="text-xs text-muted-foreground">{t('ad.cta')}</div>
              </div>
            </div>
            {!coverImage ? (
              <p className="mt-2 text-xs text-amber-600">{t('ad.noImageWarn')}</p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
