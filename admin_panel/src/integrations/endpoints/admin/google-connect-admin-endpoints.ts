// ===================================================================
// FILE: src/integrations/endpoints/admin/google-connect-admin-endpoints.ts
// ===================================================================

import type { FetchArgs } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/base-api";
import type {
  GoogleAuthUrlResp,
  GoogleCredentialsArgs,
  GoogleConnectStatusResp,
  GoogleDisconnectResp,
  GoogleExchangeArgs,
  GoogleExchangeResp,
  GoogleRedirectResp,
} from "@/integrations/shared";
import { GOOGLE_CONNECT_ADMIN_BASE } from "@/integrations/shared";

export const googleConnectAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    googleConnectStatus: b.query<GoogleConnectStatusResp, void>({
      query: (): FetchArgs => ({ url: `${GOOGLE_CONNECT_ADMIN_BASE}/status` }),
      providesTags: ["Settings"],
    }),
    googleConnectRedirect: b.query<GoogleRedirectResp, void>({
      query: (): FetchArgs => ({ url: `${GOOGLE_CONNECT_ADMIN_BASE}/redirect` }),
    }),
    googleConnectAuthUrl: b.query<GoogleAuthUrlResp, { redirect_uri?: string } | void>({
      query: (params): FetchArgs => ({ url: `${GOOGLE_CONNECT_ADMIN_BASE}/auth-url`, params: params ?? {} }),
    }),
    googleConnectExchange: b.mutation<GoogleExchangeResp, GoogleExchangeArgs>({
      query: (body): FetchArgs => ({ url: `${GOOGLE_CONNECT_ADMIN_BASE}/exchange`, method: "POST", body }),
      invalidatesTags: ["Settings"],
    }),
    googleConnectDisconnect: b.mutation<GoogleDisconnectResp, void>({
      query: (): FetchArgs => ({ url: `${GOOGLE_CONNECT_ADMIN_BASE}/disconnect`, method: "POST" }),
      invalidatesTags: ["Settings"],
    }),
    googleConnectCredentials: b.mutation<{ ok: boolean }, GoogleCredentialsArgs>({
      query: (body): FetchArgs => ({ url: `${GOOGLE_CONNECT_ADMIN_BASE}/credentials`, method: "POST", body }),
      invalidatesTags: ["Settings"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGoogleConnectStatusQuery,
  useGoogleConnectRedirectQuery,
  useLazyGoogleConnectAuthUrlQuery,
  useGoogleConnectExchangeMutation,
  useGoogleConnectDisconnectMutation,
  useGoogleConnectCredentialsMutation,
} = googleConnectAdminApi;
