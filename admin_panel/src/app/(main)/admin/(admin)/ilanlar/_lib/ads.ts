import type { AdDevice, AdRow, AdSlot } from './types';

const OCCUPYING_STATUSES = new Set(['reserved', 'payment_pending', 'scheduled', 'live']);
export const MAX_AD_ROW = 12;

export function isLiveAd(ad?: AdRow) {
  return Boolean(ad?.isActive && (!ad.endAt || new Date(ad.endAt).getTime() >= Date.now()));
}

/** Odemesi/yayini bekleyen, slotu tutan reklam. Biten veya iptal olan sayilmaz. */
export function isPendingAd(ad?: AdRow) {
  if (!ad || isLiveAd(ad) || ad.archivedAt) return false;
  if (ad.endAt && new Date(ad.endAt).getTime() < Date.now()) return false;
  return OCCUPYING_STATUSES.has(ad.lifecycleStatus ?? '');
}

function devicesOverlap(requested: AdDevice, existing: AdDevice) {
  return requested === 'all' || existing === 'all' || requested === existing;
}

/** Backend findLayoutConflicts ile ayni kural: satiri gercekten isgal eden kayitlar. */
export function rowOccupants(ads: AdRow[], position: string, row: number, device: AdDevice, excludeId?: number) {
  const now = Date.now();
  return ads.filter((ad) => {
    if (excludeId && ad.id === excludeId) return false;
    if (ad.position !== position || Number(ad.desktopRow ?? 1) !== row) return false;
    if (ad.archivedAt) return false;
    if (!OCCUPYING_STATUSES.has(ad.lifecycleStatus ?? (ad.isActive ? 'live' : 'draft'))) return false;
    if (ad.endAt && new Date(ad.endAt).getTime() < now) return false;
    return devicesOverlap(device, ad.device);
  });
}

export type RowPlan = {
  row: number;
  columns: number;
  occupants: AdRow[];
  free: number;
  mixedLayout: boolean;
};

/** Bir slotun satir haritasi: her satirin duzeni, dolu hucreleri ve bos yeri. */
export function slotRowPlan(ads: AdRow[], slot: AdSlot | undefined, device: AdDevice, excludeId?: number): RowPlan[] {
  const capacity = Math.max(1, Number(slot?.desktopCapacity ?? 1));
  const usedRows = ads
    .filter((ad) => ad.position === slot?.slotKey)
    .map((ad) => Number(ad.desktopRow ?? 1));
  const lastRow = Math.min(MAX_AD_ROW, Math.max(1, ...usedRows, 0) + 1);
  const plans: RowPlan[] = [];
  for (let row = 1; row <= lastRow; row += 1) {
    const occupants = rowOccupants(ads, slot?.slotKey ?? '', row, device, excludeId);
    const columns = occupants.length ? Number(occupants[0].desktopColumns ?? capacity) : capacity;
    const mixedLayout = occupants.some((ad) => Number(ad.desktopColumns ?? capacity) !== columns) || columns !== capacity;
    plans.push({ row, columns, occupants, free: Math.max(0, columns - occupants.length), mixedLayout });
  }
  return plans;
}

export function firstFreeRow(plans: RowPlan[]) {
  return plans.find((plan) => plan.free > 0 && !plan.mixedLayout)?.row ?? plans.length + 1;
}

export function listingSlots(slots: AdSlot[]) {
  return slots.filter((slot) => slot.isActive && slot.sourceTypes?.includes('listing'));
}

export function buildBannerPayload(input: {
  title: string; description: string; listingId: number;
  position: string; device: AdDevice; desktopRow: number; desktopColumns: number;
  paymentConfirmed: boolean; days: number;
}) {
  return {
    position: input.position,
    title: `${input.title} · sponsorlu ilan`,
    // Bu iki metin yonetim paneli metni degil, PUBLIC sitede banner icinde gorunen icerik; kayitla birlikte saklanir.
    advertiser: 'Sponsorlu İlan',
    type: 'image',
    sourceType: 'listing',
    listingId: input.listingId,
    alt: input.title,
    linkTarget: '_self',
    rel: 'sponsored nofollow noopener',
    caption: input.description.slice(0, 300) || null,
    ctaLabel: 'İlanı İncele',
    device: input.device,
    desktopRow: input.desktopRow,
    desktopColumns: input.desktopColumns,
    displayOrder: 1,
    weight: 1,
    lifecycleStatus: input.paymentConfirmed ? 'live' : 'payment_pending',
    paymentStatus: input.paymentConfirmed ? 'paid' : 'unpaid',
    isActive: input.paymentConfirmed,
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + input.days * 86400000).toISOString(),
  };
}
