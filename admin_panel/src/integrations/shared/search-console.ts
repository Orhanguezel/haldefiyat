// ===================================================================
// FILE: src/integrations/shared/search-console.ts
// Google Search Console admin API tipleri + sabitler
// ===================================================================

export const SEARCH_CONSOLE_ADMIN_BASE = '/admin/search-console';

export const GSC_RANGES = ['LAST_7_DAYS', 'LAST_28_DAYS', 'LAST_3_MONTHS'] as const;
export type GscRange = (typeof GSC_RANGES)[number];
export const GSC_SEARCH_TYPES = ['web', 'image', 'video', 'news'] as const;
export type GscSearchType = (typeof GSC_SEARCH_TYPES)[number];

export const GSC_RANGE_LABELS: Record<GscRange, string> = {
  LAST_7_DAYS: 'Son 7 gün',
  LAST_28_DAYS: 'Son 28 gün',
  LAST_3_MONTHS: 'Son 3 ay',
};

export type GscSite = { site_url: string; permission: string };
export type GscRow = { key: string; clicks: number; impressions: number; ctr: number; position: number };
export type GscTotals = { clicks: number; impressions: number; ctr: number; position: number };
export type GscSitemap = { path: string; last_submitted: string; is_pending: boolean; warnings: number; errors: number; submitted?: number };
export type GscDateRow = GscRow & { date: string };
export type GscBreakdownRow = GscRow & { label: string };
export type GscIndexCategory = 'indexed' | 'not_indexed' | 'issue' | 'unknown';
export type GscIndexItem = {
  url: string; verdict: string; coverage_state: string; last_crawl: string | null; checked_at: string | null;
  category: GscIndexCategory; label: string; recommendation: string;
};

export type GscStatusResp = { connected: boolean; site: string };
export type GscSitesResp = { items: GscSite[] };
export type GscOverviewResp = { site: string; range: GscRange; totals: GscTotals; queries: GscRow[]; pages: GscRow[] };
export type GscAnalyticsResp = {
  site: string; range: GscRange; type: GscSearchType; totals: GscTotals; previous: GscTotals; delta: GscTotals;
  series: GscDateRow[]; devices: GscBreakdownRow[]; countries: GscBreakdownRow[];
};
export type GscPageQueriesResp = { site: string; page: string; items: GscRow[] };
export type GscSitemapsResp = { site: string; items: GscSitemap[] };
export type GscInspectResp = { verdict: string; coverage: string; indexing: string; last_crawl: string; robots: string };
export type GscInspectArgs = { url: string; site_url?: string };
export type GscQueryArgs = { range?: GscRange; type?: GscSearchType; site_url?: string };
export type GscSitemapMutationArgs = { feedpath: string; site_url?: string };
export type GscIndexResp = { items: GscIndexItem[]; summary: Record<GscIndexCategory, number> };
export type GscIndexRefreshArgs = { site_url?: string; force?: boolean; limit?: number };
export type GscIndexRefreshResp = {
  checked: number;
  skipped: number;
  totalUrls?: number;
  items: GscIndexItem[];
};

export function formatGscCtr(ctr: number): string {
  return `%${(ctr * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
}
export function formatGscPosition(pos: number): string {
  return pos ? pos.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) : '—';
}
export function formatGscNumber(v: number): string {
  return v.toLocaleString('tr-TR');
}

export const GSC_VERDICT_LABELS: Record<string, string> = {
  PASS: 'İndexli',
  PARTIAL: 'Kısmi',
  FAIL: 'Sorunlu',
  NEUTRAL: 'Nötr',
  VERDICT_UNSPECIFIED: 'Bilinmiyor',
};
