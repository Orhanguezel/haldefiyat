'use client';

import { CircleDot, Lock, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatDate, formatPrice, imageSrc, PKG_LABEL } from '../_lib/api';
import { firstFreeRow, listingSlots, slotRowPlan, type RowPlan } from '../_lib/ads';
import type { AdDevice, AdForm, AdRow, AdSlot, PackageKey, Pricing } from '../_lib/types';

const DEVICES: Array<{ value: AdDevice; label: string }> = [
  { value: 'all', label: 'Tüm cihazlar' },
  { value: 'desktop', label: 'Masaüstü' },
  { value: 'mobile', label: 'Mobil' },
];

type Props = {
  value: AdForm;
  onChange: (patch: Partial<AdForm>) => void;
  slots: AdSlot[];
  ads: AdRow[];
  currentAdId?: number;
  pricing: Pricing | null;
  listingTitle: string;
  coverImage?: string;
};

function RowStrip({ plan, selected, onSelect }: {
  plan: RowPlan; selected: boolean; onSelect: () => void;
}) {
  const cells = Array.from({ length: plan.columns });
  const blocked = plan.free === 0 || (plan.mixedLayout && plan.occupants.length > 0);
  return (
    <div className={`rounded-lg border p-2 transition ${selected ? 'border-primary bg-primary/5' : blocked ? 'bg-muted/30' : 'hover:border-primary/40'}`}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium">Satır {plan.row}</span>
        <span className="text-muted-foreground">
          {blocked ? 'dolu' : `${plan.free} / ${plan.columns} yer boş`}
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
              {isTarget ? 'Bu ilan burada' : 'Boş · seç'}
            </button>
          );
        })}
      </div>
      {plan.mixedLayout && plan.occupants.length ? (
        <p className="mt-1.5 text-xs text-amber-600">
          Bu satır {plan.columns} sütunlu farklı bir düzenle kurulmuş, karışık yerleşim yapılamaz.
        </p>
      ) : null}
    </div>
  );
}

export function AdPlanner({ value, onChange, slots, ads, currentAdId, pricing, listingTitle, coverImage }: Props) {
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
            <div className="font-medium">Bu ilanı reklamda yayınla</div>
            <p className="text-sm text-muted-foreground">
              Açıldığında ilan sponsorlu banner olarak gösterilir ve öne çıkan işareti alır.
            </p>
          </div>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(enabled) => onChange({ enabled })} />
      </div>

      {!value.enabled ? null : available.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          İlan reklamına açık bir slot bulunamadı. Reklam ayarları sekmesinden slot durumunu kontrol edin.
        </p>
      ) : (
        <>
          <section className="space-y-2">
            <h4 className="text-sm font-medium">1 · Süre paketi</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {(['daily', 'weekly', 'monthly'] as PackageKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onChange({ package: key })}
                  className={`rounded-lg border p-3 text-left transition ${value.package === key ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}
                >
                  <div className="text-sm font-medium">{PKG_LABEL[key]}</div>
                  <div className="text-xs text-muted-foreground">{pricing?.[key].days ?? 0} gün</div>
                  <div className="mt-1 text-lg font-semibold">{formatPrice(pricing?.[key].price ?? 0)} ₺</div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium">2 · Reklam yeri</h4>
            <Select value={slot?.slotKey ?? ''} onValueChange={selectSlot}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Slot seçin" /></SelectTrigger>
              <SelectContent>
                {available.map((entry) => (
                  <SelectItem key={entry.slotKey} value={entry.slotKey}>
                    {entry.label} · satır başına {entry.desktopCapacity} reklam
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DEVICES.map((device) => (
                <Button
                  key={device.value}
                  size="sm"
                  variant={value.device === device.value ? 'default' : 'outline'}
                  onClick={() => selectDevice(device.value)}
                >
                  {device.label}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium">3 · Yerleşim</h4>
            <p className="text-xs text-muted-foreground">Boş bir hücreye tıklayın. Dolu hücreler başka reklamlara ait.</p>
            <div className="space-y-2">
              {plans.map((plan) => (
                <RowStrip
                  key={plan.row}
                  plan={plan}
                  selected={plan.row === value.desktopRow}
                  onSelect={() => onChange({ desktopRow: plan.row, desktopColumns: plan.columns })}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium">4 · Ödeme ve yayın</h4>
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Ödeme alındı</div>
                <p className="text-xs text-muted-foreground">
                  {value.paymentConfirmed
                    ? 'Reklam kaydedildiği anda yayına girer.'
                    : 'Kapalıyken slot rezerve edilir, reklam yayınlanmaz.'}
                </p>
              </div>
              <Switch checked={value.paymentConfirmed} onCheckedChange={(paymentConfirmed) => onChange({ paymentConfirmed })} />
            </div>
          </section>

          <section className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <CircleDot className={`size-3.5 ${value.paymentConfirmed ? 'text-emerald-600' : 'text-amber-500'}`} />
              {value.paymentConfirmed ? 'Yayına alınacak' : 'Rezerve edilecek'}
            </div>
            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Yer</dt><dd className="text-right">{slot?.label ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Konum</dt><dd>Satır {value.desktopRow} · {activePlan?.columns ?? value.desktopColumns} sütunlu</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Süre</dt><dd>{days} gün · {formatDate(endDate)} sonuna kadar</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Tutar</dt><dd className="font-medium">{formatPrice(price)} ₺</dd></div>
            </dl>
            <div className="mt-3 flex items-center gap-3 rounded-md border bg-background p-3">
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc(coverImage)} alt="" className="size-14 rounded-md border object-cover" />
              ) : (
                <div className="flex size-14 items-center justify-center rounded-md border text-xs text-muted-foreground">görsel yok</div>
              )}
              <div className="min-w-0 flex-1">
                <Badge variant="secondary" className="mb-1 font-normal">Sponsorlu</Badge>
                <div className="truncate text-sm font-medium">{listingTitle || 'İlan başlığı'}</div>
                <div className="text-xs text-muted-foreground">İlanı İncele →</div>
              </div>
            </div>
            {!coverImage ? (
              <p className="mt-2 text-xs text-amber-600">Görseller sekmesinden en az bir görsel ekleyin, reklam görselsiz zayıf görünür.</p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
