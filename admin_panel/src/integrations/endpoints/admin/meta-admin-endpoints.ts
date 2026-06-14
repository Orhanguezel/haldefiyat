// ===================================================================
// FILE: src/integrations/endpoints/admin/meta-admin-endpoints.ts
// ===================================================================

import type { FetchArgs } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/base-api";
import type { MetaSaveArgs, MetaStatusResp, MetaTestResp } from "@/integrations/shared";
import { META_ADMIN_BASE } from "@/integrations/shared";

export const metaAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    metaStatus: b.query<MetaStatusResp, void>({
      query: (): FetchArgs => ({ url: `${META_ADMIN_BASE}/status` }),
      providesTags: ["Settings"],
    }),
    metaSave: b.mutation<MetaStatusResp, MetaSaveArgs>({
      query: (body): FetchArgs => ({ url: `${META_ADMIN_BASE}/settings`, method: "PUT", body }),
      invalidatesTags: ["Settings"],
    }),
    metaTest: b.mutation<MetaTestResp, void>({
      query: (): FetchArgs => ({ url: `${META_ADMIN_BASE}/test`, method: "POST", body: {} }),
    }),
  }),
  overrideExisting: true,
});

export const { useMetaStatusQuery, useMetaSaveMutation, useMetaTestMutation } = metaAdminApi;
