import type { CompetitorSite, DiscoveryDomain, DiscoveryQuery } from '@/integrations/endpoints/competitor-monitor-admin-endpoints';

export const ALL = 'all';
export type DomainKind = 'official' | 'retail' | 'news' | 'other';

export function n(v: number | string | null | undefined) { return Number(v ?? 0); }

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value).slice(0, 16) : d.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function parseFeatures(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

/** Alan adi turu sezgiseli: resmi kaynak, perakende zinciri, haber, diger. */
export function domainKind(domain: string): DomainKind {
  if (/\.(gov|bel|edu|tsk|pol)\.tr$|\.gov$/.test(domain) || /tobb|ticaret|tarimorman|tuik/.test(domain)) return 'official';
  if (/migros|a101|bim\.com|carrefour|sok(marketleri)?\.com|tarimkredi|cimri|akakce|trendyol|hepsiburada|getir/.test(domain)) return 'retail';
  if (/haber|gazete|hurriyet|sabah|milliyet|sozcu|ntv|cnnturk|aa\.com|dha\.com|iha\.com|tv\d*\./.test(domain)) return 'news';
  return 'other';
}

export type DomainFilters = { q: string; kind: string; onlyAhead: boolean; hideTracked: boolean };
export const EMPTY_DOMAIN_FILTERS: DomainFilters = { q: '', kind: ALL, onlyAhead: false, hideTracked: false };

export function filterDomains(rows: DiscoveryDomain[], f: DomainFilters) {
  const q = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (r.isOurs) return false;
    if (q && !`${r.domain} ${r.sample_title ?? ''}`.toLowerCase().includes(q)) return false;
    if (f.kind !== ALL && domainKind(r.domain) !== f.kind) return false;
    if (f.onlyAhead && n(r.ahead_of_us) === 0) return false;
    if (f.hideTracked && n(r.tracked) > 0) return false;
    return true;
  });
}

export function summarizeDiscovery(domains: DiscoveryDomain[], queries: DiscoveryQuery[]) {
  const rivals = domains.filter((d) => !d.isOurs);
  const ranked = queries.filter((q) => q.our_position != null);
  return {
    domains: rivals.length,
    tracked: rivals.filter((d) => n(d.tracked) > 0).length,
    official: rivals.filter((d) => domainKind(d.domain) === 'official').length,
    queries: queries.length,
    weRank: ranked.length,
    weTop3: ranked.filter((q) => (q.our_position ?? 99) <= 3).length,
    missing: queries.length - ranked.length,
    avgOurPosition: ranked.length ? ranked.reduce((s, q) => s + (q.our_position ?? 0), 0) / ranked.length : null,
  };
}

export function summarizeSites(sites: CompetitorSite[]) {
  return {
    total: sites.length,
    active: sites.filter((s) => s.isActive).length,
    failing: sites.filter((s) => s.lastSnapshot && s.lastSnapshot.scrapeOk !== 1).length,
    changed: sites.filter((s) => s.lastSnapshot?.diffSummary && s.lastSnapshot.diffSummary !== 'Değişiklik yok.').length,
  };
}
