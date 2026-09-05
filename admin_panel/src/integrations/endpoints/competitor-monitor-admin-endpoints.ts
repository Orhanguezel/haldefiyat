import { baseApi } from '@/integrations/base-api';

export interface CompetitorSnapshot {
  id: number;
  siteKey: string;
  productCount: number | null;
  marketCount: number | null;
  detectedFeatures: string | null;
  diffSummary: string | null;
  checkedAt: string;
  scrapeOk: number;
}

export interface CompetitorSite {
  id: number;
  siteKey: string;
  displayName: string;
  url: string;
  isActive: number;
  notes: string | null;
  lastSnapshot: Omit<CompetitorSnapshot, 'id' | 'siteKey'> | null;
}

export interface DiscoveryRun {
  id: number; engine: string; status: 'running' | 'ok' | 'partial' | 'error'; query_source: string;
  queries_total: number; queries_done: number; results_total: number; error_msg: string | null; started_at: string; finished_at: string | null;
}
export interface DiscoveryDomain {
  domain: string; queries: number; avg_position: number | string; best_position: number; top3: number | string; page1: number | string;
  ahead_of_us: number | string; impressions: number | string; sample_title: string | null; sample_url: string | null; tracked: number; isOurs: boolean;
}
export interface DiscoveryQuery { query: string; impressions: number; clicks: number; our_position: number | null; results: number; top_domains: string | null }
export interface DiscoveryResultRow { position: number; page?: number; url: string; domain?: string; title: string | null; snippet?: string | null; is_ours?: number; query?: string; impressions?: number; our_position?: number | null }
export interface DiscoveryPayload {
  run: DiscoveryRun | null; running: boolean; domains: DiscoveryDomain[]; queries: DiscoveryQuery[]; runs: DiscoveryRun[];
  delta: { appeared: string[]; disappeared: string[]; previousRunId: number | null } | null;
}

export const competitorMonitorAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCompetitorDiscoveryAdmin: builder.query<DiscoveryPayload, { runId?: number } | void>({
      query: (params) => ({ url: `/admin/competitor-monitor/discovery${params?.runId ? `?runId=${params.runId}` : ''}` }),
      providesTags: [{ type: 'CompetitorSites' as const, id: 'DISCOVERY' }],
    }),
    getCompetitorDiscoveryResultsAdmin: builder.query<{ items: DiscoveryResultRow[] }, { runId: number; domain?: string; query?: string }>({
      query: ({ runId, domain, query }) => ({ url: `/admin/competitor-monitor/discovery/results?runId=${runId}${domain ? `&domain=${encodeURIComponent(domain)}` : ''}${query ? `&query=${encodeURIComponent(query)}` : ''}` }),
    }),
    startCompetitorDiscoveryAdmin: builder.mutation<{ ok: boolean; started: boolean }, { queries?: string[]; limit?: number; pages?: 1 | 2 }>({
      query: (body) => ({ url: '/admin/competitor-monitor/discover', method: 'POST', body }),
      invalidatesTags: [{ type: 'CompetitorSites' as const, id: 'DISCOVERY' }],
    }),
    addCompetitorSiteAdmin: builder.mutation<{ ok: boolean; siteKey: string }, { domain: string; name?: string; url?: string }>({
      query: (body) => ({ url: '/admin/competitor-monitor/sites', method: 'POST', body }),
      invalidatesTags: [{ type: 'CompetitorSites' as const, id: 'LIST' }, { type: 'CompetitorSites' as const, id: 'DISCOVERY' }],
    }),
    listCompetitorSitesAdmin: builder.query<{ items: CompetitorSite[] }, void>({
      query: () => ({ url: '/admin/competitor-monitor/sites' }),
      providesTags: [{ type: 'CompetitorSites' as const, id: 'LIST' }],
    }),
    getCompetitorHistoryAdmin: builder.query<
      { siteKey: string; items: CompetitorSnapshot[] },
      { siteKey: string; limit?: number }
    >({
      query: ({ siteKey, limit = 20 }) => ({
        url: `/admin/competitor-monitor/history/${siteKey}?limit=${limit}`,
      }),
      providesTags: (_res, _err, { siteKey }) => [
        { type: 'CompetitorSnapshots' as const, id: siteKey },
      ],
    }),
    runCompetitorCheckAdmin: builder.mutation<
      { ok: boolean; results: unknown[] },
      { siteKey?: string }
    >({
      query: (body) => ({ url: '/admin/competitor-monitor/run', method: 'POST', body }),
      invalidatesTags: [
        { type: 'CompetitorSites' as const, id: 'LIST' },
        { type: 'CompetitorSnapshots' as const, id: 'ALL' },
      ],
    }),
    toggleCompetitorSiteAdmin: builder.mutation<
      { ok: boolean },
      { siteKey: string; isActive: 0 | 1 }
    >({
      query: ({ siteKey, isActive }) => ({
        url: `/admin/competitor-monitor/sites/${siteKey}`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: [{ type: 'CompetitorSites' as const, id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCompetitorDiscoveryAdminQuery,
  useGetCompetitorDiscoveryResultsAdminQuery,
  useStartCompetitorDiscoveryAdminMutation,
  useAddCompetitorSiteAdminMutation,
  useListCompetitorSitesAdminQuery,
  useGetCompetitorHistoryAdminQuery,
  useRunCompetitorCheckAdminMutation,
  useToggleCompetitorSiteAdminMutation,
} = competitorMonitorAdminApi;
