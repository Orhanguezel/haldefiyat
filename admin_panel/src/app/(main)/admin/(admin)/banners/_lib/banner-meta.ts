import {
  BANNER_POSITIONS, type AdSlotAdmin, type BannerAdmin, type BannerLifecycleStatus,
} from '@/integrations/endpoints/banners-admin-endpoints';

export const ALL = 'all';
export const LIFECYCLES: BannerLifecycleStatus[] = ['draft', 'proposal', 'reserved', 'payment_pending', 'scheduled', 'live', 'completed', 'cancelled', 'problem', 'archived'];
export const SOURCE_TYPES = ['custom', 'listing', 'firm', 'code'] as const;
export type SortKey = 'newest' | 'endAt' | 'impressions' | 'ctr' | 'amount' | 'title';
export const SORT_KEYS: SortKey[] = ['newest', 'endAt', 'impressions', 'ctr', 'amount', 'title'];
export type Filters = { q: string; position: string; lifecycle: string; sourceType: string; device: string; sort: SortKey };
export const EMPTY_FILTERS: Filters = { q: '', position: ALL, lifecycle: ALL, sourceType: ALL, device: ALL, sort: 'newest' };

export const LIFECYCLE_VARIANT: Record<BannerLifecycleStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  live: 'default', scheduled: 'secondary', completed: 'secondary', archived: 'secondary',
  problem: 'destructive', cancelled: 'destructive',
  draft: 'outline', proposal: 'outline', reserved: 'outline', payment_pending: 'outline',
};
export const LIFECYCLE_TONE: Record<BannerLifecycleStatus, string> = {
  live: 'bg-emerald-500', scheduled: 'bg-sky-500', reserved: 'bg-amber-500', payment_pending: 'bg-amber-500', proposal: 'bg-amber-400',
  problem: 'bg-rose-500', cancelled: 'bg-rose-400', completed: 'bg-muted-foreground/50', archived: 'bg-muted-foreground/30', draft: 'bg-muted-foreground/40',
};
export const OPEN_STATUSES = new Set<BannerLifecycleStatus>(['proposal', 'reserved', 'payment_pending']);

export function positionLabel(slots: AdSlotAdmin[], key: string) {
  return slots.find((s) => s.slotKey === key)?.label ?? BANNER_POSITIONS.find((p) => p.value === key)?.label ?? key;
}

export function ctr(b: { impressions: number; clicks: number }) {
  return b.impressions ? (b.clicks / b.impressions) * 100 : null;
}
export function fmtCtr(value: number | null) {
  return value == null ? '—' : `%${value.toFixed(2)}`;
}
export function money(value: number | string | null | undefined) {
  return `${Number(value ?? 0).toLocaleString('tr-TR')} ₺`;
}
export function shortDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value.slice(0, 10) : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function daysUntil(value?: string | null) {
  if (!value) return null;
  return Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
}

/** Zarflanmis hata ({error:{message}}) ya da eski duz metin — ikisini de okur. */
export function errorMessage(err: unknown, fallback: string) {
  const data = (err as { data?: { error?: unknown } })?.data;
  const e = data?.error;
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && typeof (e as { message?: unknown }).message === 'string') return (e as { message: string }).message;
  return fallback;
}

export function applyFilters(rows: BannerAdmin[], f: Filters) {
  const q = f.q.trim().toLocaleLowerCase('tr');
  const out = rows.filter((b) => {
    if (q && !`${b.title} ${b.advertiser ?? ''} ${b.salesOwner ?? ''} ${b.notes ?? ''} ${b.position}`.toLocaleLowerCase('tr').includes(q)) return false;
    if (f.position !== ALL && b.position !== f.position) return false;
    if (f.lifecycle === 'open') return OPEN_STATUSES.has(b.lifecycleStatus);
    if (f.lifecycle === 'endingSoon') { const d = daysUntil(b.endAt); return b.lifecycleStatus === 'live' && d != null && d <= 7; }
    if (f.lifecycle !== ALL && b.lifecycleStatus !== f.lifecycle) return false;
    if (f.sourceType !== ALL && b.sourceType !== f.sourceType) return false;
    if (f.device !== ALL && b.device !== f.device) return false;
    return true;
  });
  out.sort((a, b) => {
    switch (f.sort) {
      case 'endAt': return (a.endAt ?? '9999').localeCompare(b.endAt ?? '9999');
      case 'impressions': return b.impressions - a.impressions;
      case 'ctr': return (ctr(b) ?? -1) - (ctr(a) ?? -1);
      case 'amount': return Number(b.totalAmount) - Number(a.totalAmount);
      case 'title': return a.title.localeCompare(b.title, 'tr');
      default: return b.id - a.id;
    }
  });
  return out;
}

export function summarize(rows: BannerAdmin[]) {
  const c = (fn: (b: BannerAdmin) => boolean) => rows.filter(fn).length;
  return {
    total: rows.length,
    live: c((b) => b.lifecycleStatus === 'live'),
    scheduled: c((b) => b.lifecycleStatus === 'scheduled'),
    open: c((b) => OPEN_STATUSES.has(b.lifecycleStatus)),
    problem: c((b) => b.lifecycleStatus === 'problem'),
    endingSoon: c((b) => { const d = daysUntil(b.endAt); return b.lifecycleStatus === 'live' && d != null && d <= 7; }),
    reservedRevenue: rows.filter((b) => OPEN_STATUSES.has(b.lifecycleStatus) || b.lifecycleStatus === 'scheduled').reduce((s, b) => s + Number(b.totalAmount), 0),
  };
}
