import type { AnalysisReportAdmin, AnalysisReportStatus } from '@/integrations/endpoints/analysis-reports-admin-endpoints';

export const ALL = 'all';
export const STATUSES: AnalysisReportStatus[] = ['draft', 'published', 'archived'];
export type SortKey = 'newest' | 'published' | 'records' | 'title';
export const SORT_KEYS: SortKey[] = ['newest', 'published', 'records', 'title'];
export type Filters = { q: string; status: string; source: string; sort: SortKey };
export const EMPTY_FILTERS: Filters = { q: '', status: ALL, source: ALL, sort: 'newest' };

export const STATUS_VARIANT: Record<AnalysisReportStatus, 'default' | 'secondary' | 'outline'> = { published: 'default', archived: 'secondary', draft: 'outline' };

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value.slice(0, 10)).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function wordCount(text?: string | null) {
  return (text ?? '').trim().split(/\s+/).filter(Boolean).length;
}

export function applyFilters(rows: AnalysisReportAdmin[], f: Filters) {
  const q = f.q.trim().toLocaleLowerCase('tr');
  const out = rows.filter((r) => {
    if (q && !`${r.baslik} ${r.slug} ${r.hafta} ${r.yazar} ${r.etiketler.join(' ')}`.toLocaleLowerCase('tr').includes(q)) return false;
    if (f.status !== ALL && r.status !== f.status) return false;
    if (f.source !== ALL && r.source !== f.source) return false;
    return true;
  });
  out.sort((a, b) => {
    switch (f.sort) {
      case 'published': return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
      case 'records': return b.totalRecords - a.totalRecords;
      case 'title': return a.baslik.localeCompare(b.baslik, 'tr');
      default: return (b.tarih ?? '').localeCompare(a.tarih ?? '') || b.id - a.id;
    }
  });
  return out;
}

export function summarize(rows: AnalysisReportAdmin[]) {
  const c = (fn: (r: AnalysisReportAdmin) => boolean) => rows.filter(fn).length;
  return {
    total: rows.length,
    published: c((r) => r.status === 'published'),
    draft: c((r) => r.status === 'draft'),
    archived: c((r) => r.status === 'archived'),
    auto: c((r) => r.source === 'auto'),
    thin: c((r) => r.status === 'published' && wordCount(r.icerik) < 300),
  };
}
