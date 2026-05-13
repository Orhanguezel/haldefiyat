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

export const competitorMonitorAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  useListCompetitorSitesAdminQuery,
  useGetCompetitorHistoryAdminQuery,
  useRunCompetitorCheckAdminMutation,
  useToggleCompetitorSiteAdminMutation,
} = competitorMonitorAdminApi;
