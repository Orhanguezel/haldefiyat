// ===================================================================
// FILE: src/integrations/endpoints/admin/gtm-admin-endpoints.ts
// ===================================================================

import type { FetchArgs } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/base-api";
import type { GtmOverviewResp, GtmPublishResp, GtmStatusResp } from "@/integrations/shared";
import { GTM_ADMIN_BASE } from "@/integrations/shared";

export const gtmAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    gtmStatus: b.query<GtmStatusResp, void>({
      query: (): FetchArgs => ({ url: `${GTM_ADMIN_BASE}/status` }),
    }),
    gtmOverview: b.query<GtmOverviewResp, void>({
      query: (): FetchArgs => ({ url: `${GTM_ADMIN_BASE}/overview` }),
      providesTags: ["Settings"],
    }),
    gtmPublish: b.mutation<GtmPublishResp, { name?: string } | void>({
      query: (body): FetchArgs => ({ url: `${GTM_ADMIN_BASE}/publish`, method: "POST", body: body ?? {} }),
      invalidatesTags: ["Settings"],
    }),
  }),
  overrideExisting: true,
});

export const { useGtmStatusQuery, useGtmOverviewQuery, useGtmPublishMutation } = gtmAdminApi;
