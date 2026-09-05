import type { FirmAdminItem } from '@/integrations/endpoints/firms-admin-endpoints';

export const ALL = 'all';
export const PAGE_SIZE = 50;
export const FIRM_TYPES = ['komisyoncu', 'soguk_hava', 'nakliye', 'zirai_ilac'] as const;
export const STATUSES = ['all', 'pending', 'approved', 'rejected'] as const;
export const CLAIMS = ['unclaimed', 'pending', 'verified'] as const;
export const SOURCES = ['halkatalogu', 'user'] as const;
export const SORTS = ['default', 'name', 'city', 'lastSeen', 'newest'] as const;

export type Filters = {
  q: string; city: string; type: string; status: (typeof STATUSES)[number];
  claim: string; source: string; phone: string; sponsored: boolean; stale: boolean; sort: (typeof SORTS)[number];
};
export const EMPTY_FILTERS: Filters = {
  q: '', city: ALL, type: ALL, status: 'all', claim: ALL, source: ALL, phone: ALL, sponsored: false, stale: false, sort: 'default',
};

export function toQuery(f: Filters, page: number) {
  return {
    q: f.q.trim() || undefined,
    city: f.city === ALL ? undefined : f.city,
    type: f.type === ALL ? undefined : f.type,
    status: f.status,
    claimStatus: f.claim === ALL ? undefined : f.claim,
    source: f.source === ALL ? undefined : f.source,
    hasPhone: f.phone === ALL ? undefined : (f.phone as 'true' | 'false'),
    sponsored: f.sponsored ? ('true' as const) : undefined,
    staleDays: f.stale ? 45 : undefined,
    sort: f.sort === 'default' ? undefined : f.sort,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  };
}

export function isDirty(f: Filters) {
  return JSON.stringify(f) !== JSON.stringify(EMPTY_FILTERS);
}

export function daysSince(value?: string | null) {
  if (!value) return null;
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 86400000));
}

export function firmStatus(item: FirmAdminItem) {
  return item.status ?? 'approved';
}
