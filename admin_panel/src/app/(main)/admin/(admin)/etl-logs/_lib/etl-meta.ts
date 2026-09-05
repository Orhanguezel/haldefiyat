import type { EtlLogItem } from '@/integrations/endpoints/etl-logs-admin-endpoints';

export const ALL = 'all';
export const STATUS_KEYS = ['ok', 'partial', 'error'] as const;
export const DAY_OPTIONS = [1, 3, 7, 14, 30, 90] as const;

export type Filters = { q: string; source: string; status: string; days: number; sort: SortKey };
export type SortKey = 'newest' | 'inserted' | 'duration' | 'source';
export const SORT_KEYS: SortKey[] = ['newest', 'inserted', 'duration', 'source'];
export const EMPTY_FILTERS: Filters = { q: '', source: ALL, status: ALL, days: 14, sort: 'newest' };

export const STATUS_TONE: Record<EtlLogItem['status'], string> = {
  ok: 'bg-emerald-500', partial: 'bg-amber-500', error: 'bg-rose-500',
};

/** "ok" ama 0 satir eklenmis: kaynak calisti, yeni veri gelmedi (bayat bulten ya da bos gun). */
export function isEmptyOk(item: EtlLogItem) {
  return item.status === 'ok' && (item.rowsInserted ?? 0) === 0;
}

export function applyFilters(logs: EtlLogItem[], f: Filters) {
  const q = f.q.trim().toLocaleLowerCase('tr');
  const rows = logs.filter((l) => {
    if (q && !`${l.sourceApi} ${l.errorMsg ?? ''} ${String(l.runDate).slice(0, 10)}`.toLocaleLowerCase('tr').includes(q)) return false;
    if (f.status === 'emptyOk') return isEmptyOk(l);
    if (f.status !== ALL && l.status !== f.status) return false;
    return true;
  });
  rows.sort((a, b) => {
    switch (f.sort) {
      case 'inserted': return (b.rowsInserted ?? 0) - (a.rowsInserted ?? 0);
      case 'duration': return (b.durationMs ?? 0) - (a.durationMs ?? 0);
      case 'source': return a.sourceApi.localeCompare(b.sourceApi) || String(b.createdAt).localeCompare(String(a.createdAt));
      default: return String(b.createdAt).localeCompare(String(a.createdAt));
    }
  });
  return rows;
}

export function summarize(logs: EtlLogItem[]) {
  const c = (fn: (l: EtlLogItem) => boolean) => logs.filter(fn).length;
  return {
    total: logs.length,
    ok: c((l) => l.status === 'ok'),
    partial: c((l) => l.status === 'partial'),
    error: c((l) => l.status === 'error'),
    emptyOk: c(isEmptyOk),
    inserted: logs.reduce((sum, l) => sum + (l.rowsInserted ?? 0), 0),
    sources: new Set(logs.map((l) => l.sourceApi)).size,
  };
}

export function formatDuration(ms: number | null) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} sn`;
  return `${Math.floor(ms / 60000)} dk ${Math.round((ms % 60000) / 1000)} sn`;
}

export function formatDateTime(value: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 16);
  return d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
