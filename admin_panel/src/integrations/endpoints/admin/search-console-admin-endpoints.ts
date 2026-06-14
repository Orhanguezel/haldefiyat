// ===================================================================
// FILE: src/integrations/endpoints/admin/search-console-admin-endpoints.ts
// ===================================================================

import type { FetchArgs } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/base-api";
import type {
  GscInspectArgs,
  GscInspectResp,
  GscAnalyticsResp,
  GscIndexRefreshArgs,
  GscIndexRefreshResp,
  GscIndexResp,
  GscOverviewResp,
  GscPageQueriesResp,
  GscQueryArgs,
  GscRange,
  GscSitemapMutationArgs,
  GscSitemapsResp,
  GscSitesResp,
  GscStatusResp,
} from "@/integrations/shared";
import { SEARCH_CONSOLE_ADMIN_BASE } from "@/integrations/shared";

export const searchConsoleAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    gscStatus: b.query<GscStatusResp, void>({
      query: (): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/status` }),
    }),
    gscSites: b.query<GscSitesResp, void>({
      query: (): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/sites` }),
    }),
    gscOverview: b.query<GscOverviewResp, { range?: GscRange; site_url?: string } | void>({
      query: (params): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/overview`, params: params ?? {} }),
    }),
    gscAnalytics: b.query<GscAnalyticsResp, GscQueryArgs | void>({
      query: (params): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/analytics`, params: params ?? {} }),
    }),
    gscPageQueries: b.query<GscPageQueriesResp, (GscQueryArgs & { page: string }) | void>({
      query: (params): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/page-queries`, params: params ?? {} }),
    }),
    gscSitemaps: b.query<GscSitemapsResp, { site_url?: string } | void>({
      query: (params): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/sitemaps`, params: params ?? {} }),
      providesTags: ['Settings'],
    }),
    gscSubmitSitemap: b.mutation<{ ok: true }, GscSitemapMutationArgs>({
      query: (body): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/sitemaps`, method: "POST", body }),
      invalidatesTags: ['Settings'],
    }),
    gscDeleteSitemap: b.mutation<{ ok: true }, GscSitemapMutationArgs>({
      query: (body): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/sitemaps`, method: "DELETE", body }),
      invalidatesTags: ['Settings'],
    }),
    gscInspect: b.mutation<GscInspectResp, GscInspectArgs>({
      query: (body): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/inspect`, method: "POST", body }),
    }),
    gscIndex: b.query<GscIndexResp, void>({
      query: (): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/index` }),
      providesTags: ['Settings'],
    }),
    gscIndexRefresh: b.mutation<GscIndexRefreshResp, GscIndexRefreshArgs>({
      query: (body): FetchArgs => ({ url: `${SEARCH_CONSOLE_ADMIN_BASE}/index/refresh`, method: "POST", body }),
      invalidatesTags: ['Settings'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGscStatusQuery,
  useGscSitesQuery,
  useGscOverviewQuery,
  useGscAnalyticsQuery,
  useGscPageQueriesQuery,
  useGscSitemapsQuery,
  useGscSubmitSitemapMutation,
  useGscDeleteSitemapMutation,
  useGscInspectMutation,
  useGscIndexQuery,
  useGscIndexRefreshMutation,
} = searchConsoleAdminApi;
