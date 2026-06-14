// ===================================================================
// FILE: src/integrations/endpoints/admin/google-ads-admin-endpoints.ts
// Google Ads admin endpoints
// ===================================================================

import type { FetchArgs } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/base-api";
import type {
  GoogleAdsAccountsResp,
  GoogleAdsProductsResp,
  GoogleAdsConversionHealthResp,
  GoogleAdsOfflineStatus,
  GoogleAdsOfflineUploadResp,
  GoogleAdsAdGroupsResp,
  GoogleAdsBiddingArgs,
  GoogleAdsBiddingResp,
  GoogleAdsKeywordAddArgs,
  GoogleAdsKeywordMutationResp,
  GoogleAdsNegativeKeywordArgs,
  GoogleAdsReportResp,
  GoogleAdsAssetGroupsResp,
  GoogleAdsAssetsResp,
  GoogleAdsAssetMutationResp,
  GoogleAdsAssetRemoveBody,
  GoogleAdsAssetRemoveResp,
  GoogleAdsAssetUploadArgs,
  GoogleAdsAssetUrlArgs,
  GoogleAdsAssetTextArgs,
  GoogleAdsAssetVideoArgs,
  GoogleAdsCampaignsResp,
  GoogleAdsDateRange,
  GoogleAdsInsightsResp,
  GoogleAdsKeywordStatusBody,
  GoogleAdsKeywordStatusResp,
  GoogleAdsSetBudgetBody,
  GoogleAdsSetBudgetResp,
  GoogleAdsSetStatusBody,
  GoogleAdsSetStatusResp,
  GoogleAdsStatusResp,
  GoogleAdsVerifyResp,
} from "@/integrations/shared";
import { GOOGLE_ADS_ADMIN_BASE } from "@/integrations/shared";

export const googleAdsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /admin/google-ads/status */
    googleAdsStatus: b.query<GoogleAdsStatusResp, void>({
      query: (): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/status` }),
    }),

    /** POST /admin/google-ads/verify */
    googleAdsVerify: b.mutation<GoogleAdsVerifyResp, void>({
      query: (): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/verify`,
        method: "POST",
        body: {},
      }),
    }),

    /** GET /admin/google-ads/campaigns?range= */
    googleAdsCampaigns: b.query<GoogleAdsCampaignsResp, { range?: GoogleAdsDateRange; customer_id?: string } | void>({
      query: (params): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/campaigns`,
        params: params ?? {},
      }),
    }),

    /** GET /admin/google-ads/insights?range=&campaign_id= */
    googleAdsInsights: b.query<GoogleAdsInsightsResp, { range?: GoogleAdsDateRange; campaign_id?: string; customer_id?: string } | void>({
      query: (params): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/insights`,
        params: params ?? {},
      }),
    }),

    /** POST /admin/google-ads/keywords/status */
    googleAdsKeywordStatus: b.mutation<GoogleAdsKeywordStatusResp, GoogleAdsKeywordStatusBody>({
      query: (body): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/keywords/status`,
        method: "POST",
        body,
      }),
    }),

    /** POST /admin/google-ads/campaigns/:id/status */
    googleAdsSetStatus: b.mutation<GoogleAdsSetStatusResp, GoogleAdsSetStatusBody>({
      query: ({ id, ...body }): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/campaigns/${id}/status`,
        method: "POST",
        body,
      }),
    }),

    /** POST /admin/google-ads/campaigns/budget */
    googleAdsSetBudget: b.mutation<GoogleAdsSetBudgetResp, GoogleAdsSetBudgetBody>({
      query: (body): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/campaigns/budget`,
        method: "POST",
        body,
      }),
    }),

    /** GET /admin/google-ads/accounts */
    googleAdsAccounts: b.query<GoogleAdsAccountsResp, void>({
      query: (): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/accounts` }),
    }),

    /** GET /admin/google-ads/products?range=&customer_id= */
    googleAdsProducts: b.query<GoogleAdsProductsResp, { range?: GoogleAdsDateRange; customer_id?: string } | void>({
      query: (params): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/products`, params: params ?? {} }),
    }),

    /** GET /admin/google-ads/conversion-health?range=&customer_id= */
    googleAdsConversionHealth: b.query<GoogleAdsConversionHealthResp, { range?: GoogleAdsDateRange; customer_id?: string } | void>({
      query: (params): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/conversion-health`, params: params ?? {} }),
    }),

    /** GET /admin/google-ads/offline/status */
    googleAdsOfflineStatus: b.query<GoogleAdsOfflineStatus, void>({
      query: (): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/offline/status` }),
    }),

    /** POST /admin/google-ads/offline/upload */
    googleAdsOfflineUpload: b.mutation<GoogleAdsOfflineUploadResp, { customer_id?: string } | void>({
      query: (body): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/offline/upload`, method: "POST", body: body ?? {} }),
    }),

    /** POST /admin/google-ads/campaigns/:id/bidding */
    googleAdsSetBidding: b.mutation<GoogleAdsBiddingResp, GoogleAdsBiddingArgs>({
      query: ({ id, ...body }): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/campaigns/${id}/bidding`,
        method: "POST",
        body,
      }),
    }),

    /** GET /admin/google-ads/report?range= */
    googleAdsReport: b.query<GoogleAdsReportResp, { range?: GoogleAdsDateRange; customer_id?: string } | void>({
      query: (params): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/report`, params: params ?? {} }),
    }),

    /** GET /admin/google-ads/campaigns/:id/ad-groups */
    googleAdsAdGroups: b.query<GoogleAdsAdGroupsResp, { id: string; customer_id?: string }>({
      query: ({ id, ...params }): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/campaigns/${id}/ad-groups`,
        params,
      }),
    }),

    /** POST /admin/google-ads/keywords/negative */
    googleAdsAddNegativeKeyword: b.mutation<GoogleAdsKeywordMutationResp, GoogleAdsNegativeKeywordArgs>({
      query: (body): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/keywords/negative`, method: "POST", body }),
    }),

    /** POST /admin/google-ads/keywords/add */
    googleAdsAddKeyword: b.mutation<GoogleAdsKeywordMutationResp, GoogleAdsKeywordAddArgs>({
      query: (body): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/keywords/add`, method: "POST", body }),
    }),

    /** GET /admin/google-ads/asset-groups */
    googleAdsAssetGroups: b.query<GoogleAdsAssetGroupsResp, { customer_id?: string } | void>({
      query: (params): FetchArgs => ({ url: `${GOOGLE_ADS_ADMIN_BASE}/asset-groups`, params: params ?? {} }),
    }),

    /** GET /admin/google-ads/asset-groups/:id/assets */
    googleAdsAssetGroupAssets: b.query<GoogleAdsAssetsResp, { id: string; customer_id?: string }>({
      query: ({ id, ...params }): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/asset-groups/${id}/assets`,
        params,
      }),
    }),

    /** POST /admin/google-ads/asset-groups/:id/images (multipart) */
    googleAdsUploadAsset: b.mutation<GoogleAdsAssetMutationResp, GoogleAdsAssetUploadArgs>({
      query: ({ assetGroupId, fieldType, file, customer_id }): FetchArgs => {
        const form = new FormData();
        form.append("file", file);
        return {
          url: `${GOOGLE_ADS_ADMIN_BASE}/asset-groups/${assetGroupId}/images`,
          method: "POST",
          params: customer_id ? { field_type: fieldType, customer_id } : { field_type: fieldType },
          body: form,
        };
      },
    }),

    /** POST /admin/google-ads/asset-groups/:id/image-url (kütüphane/galeri URL'i) */
    googleAdsUploadAssetUrl: b.mutation<GoogleAdsAssetMutationResp, GoogleAdsAssetUrlArgs>({
      query: ({ assetGroupId, fieldType, url, customer_id }): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/asset-groups/${assetGroupId}/image-url`,
        method: "POST",
        body: { field_type: fieldType, url, ...(customer_id ? { customer_id } : {}) },
      }),
    }),

    /** POST /admin/google-ads/asset-groups/:id/text */
    googleAdsAddText: b.mutation<GoogleAdsAssetMutationResp, GoogleAdsAssetTextArgs>({
      query: ({ assetGroupId, fieldType, text, customer_id }): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/asset-groups/${assetGroupId}/text`,
        method: "POST",
        body: { field_type: fieldType, text, ...(customer_id ? { customer_id } : {}) },
      }),
    }),

    /** POST /admin/google-ads/asset-groups/:id/video */
    googleAdsAddVideo: b.mutation<GoogleAdsAssetMutationResp, GoogleAdsAssetVideoArgs>({
      query: ({ assetGroupId, youtube, customer_id }): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/asset-groups/${assetGroupId}/video`,
        method: "POST",
        body: { youtube, ...(customer_id ? { customer_id } : {}) },
      }),
    }),

    /** POST /admin/google-ads/asset-groups/assets/remove */
    googleAdsRemoveAsset: b.mutation<GoogleAdsAssetRemoveResp, GoogleAdsAssetRemoveBody>({
      query: (body): FetchArgs => ({
        url: `${GOOGLE_ADS_ADMIN_BASE}/asset-groups/assets/remove`,
        method: "POST",
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGoogleAdsStatusQuery,
  useGoogleAdsVerifyMutation,
  useGoogleAdsCampaignsQuery,
  useLazyGoogleAdsCampaignsQuery,
  useGoogleAdsSetStatusMutation,
  useGoogleAdsSetBudgetMutation,
  useGoogleAdsInsightsQuery,
  useGoogleAdsKeywordStatusMutation,
  useGoogleAdsSetBiddingMutation,
  useGoogleAdsReportQuery,
  useGoogleAdsAccountsQuery,
  useGoogleAdsProductsQuery,
  useGoogleAdsConversionHealthQuery,
  useGoogleAdsOfflineStatusQuery,
  useGoogleAdsOfflineUploadMutation,
  useLazyGoogleAdsAdGroupsQuery,
  useGoogleAdsAddNegativeKeywordMutation,
  useGoogleAdsAddKeywordMutation,
  useGoogleAdsAssetGroupsQuery,
  useGoogleAdsAssetGroupAssetsQuery,
  useGoogleAdsUploadAssetMutation,
  useGoogleAdsUploadAssetUrlMutation,
  useGoogleAdsAddTextMutation,
  useGoogleAdsAddVideoMutation,
  useGoogleAdsRemoveAssetMutation,
} = googleAdsAdminApi;
