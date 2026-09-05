import type { MarketAdminItem, MarketStatsItem } from '@/integrations/endpoints/markets-admin-endpoints';

export const ALL = 'all';
export type Health = 'live' | 'stale' | 'dry' | 'noData';
export type SortKey = 'order' | 'name' | 'city' | 'lastDate' | 'rows30' | 'products30';
export type MarketType = 'hal' | 'borsa' | 'resmi' | 'kooperatif';
export const MARKET_TYPES: MarketType[] = ['hal', 'borsa', 'resmi', 'kooperatif'];
export const SORT_KEYS: SortKey[] = ['order', 'name', 'city', 'lastDate', 'rows30', 'products30'];

export type MarketRow = MarketAdminItem & { stats?: MarketStatsItem; health: Health; ageDays: number | null };

export type Filters = { q: string; type: string; city: string; health: string; sort: SortKey };
export const EMPTY_FILTERS: Filters = { q: '', type: ALL, city: ALL, health: ALL, sort: 'order' };

export function ageDays(date?: string | null) {
  if (!date) return null;
  const t = new Date(`${date}T00:00:00`).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - t) / 86400000);
}

export function healthOf(stats?: MarketStatsItem): Health {
  if (!stats || !stats.lastDate) return 'noData';
  const age = ageDays(stats.lastDate) ?? 9999;
  if (age <= 7) return 'live';
  if (age <= 30) return 'stale';
  return 'dry';
}

export const HEALTH_TONE: Record<Health, string> = {
  live: 'bg-emerald-500', stale: 'bg-amber-500', dry: 'bg-rose-500', noData: 'bg-muted-foreground/40',
};

export function enrich(items: MarketAdminItem[], stats: MarketStatsItem[]): MarketRow[] {
  const byId = new Map(stats.map((s) => [s.marketId, s]));
  return items.map((item) => {
    const s = byId.get(item.id);
    return { ...item, stats: s, health: healthOf(s), ageDays: ageDays(s?.lastDate) };
  });
}

export function applyFilters(rows: MarketRow[], f: Filters) {
  const q = f.q.trim().toLocaleLowerCase('tr');
  return rows.filter((r) => {
    if (q && !`${r.name} ${r.cityName} ${r.slug} ${r.sourceKey ?? ''}`.toLocaleLowerCase('tr').includes(q)) return false;
    if (f.type !== ALL && (r.marketType ?? 'hal') !== f.type) return false;
    if (f.city !== ALL && r.cityName !== f.city) return false;
    if (f.health === 'passive') return !r.isActive;
    if (f.health === 'noIndex') return !r.seoIndex;
    if (f.health !== ALL && r.health !== f.health) return false;
    return true;
  });
}

export function sortRows(rows: MarketRow[], sort: SortKey) {
  const arr = [...rows];
  arr.sort((a, b) => {
    switch (sort) {
      case 'name': return a.name.localeCompare(b.name, 'tr');
      case 'city': return a.cityName.localeCompare(b.cityName, 'tr') || a.name.localeCompare(b.name, 'tr');
      case 'lastDate': return (b.stats?.lastDate ?? '').localeCompare(a.stats?.lastDate ?? '');
      case 'rows30': return (b.stats?.rows30 ?? 0) - (a.stats?.rows30 ?? 0);
      case 'products30': return (b.stats?.products30 ?? 0) - (a.stats?.products30 ?? 0);
      default: return (a.displayOrder - b.displayOrder) || a.name.localeCompare(b.name, 'tr');
    }
  });
  return arr;
}

export function summarize(rows: MarketRow[]) {
  const c = (fn: (r: MarketRow) => boolean) => rows.filter(fn).length;
  return {
    total: rows.length,
    active: c((r) => Boolean(r.isActive)),
    cities: new Set(rows.map((r) => r.cityName)).size,
    live: c((r) => r.health === 'live'),
    stale: c((r) => r.health === 'stale'),
    dry: c((r) => r.health === 'dry'),
    noData: c((r) => r.health === 'noData'),
    borsa: c((r) => (r.marketType ?? 'hal') !== 'hal'),
  };
}
