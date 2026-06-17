// ===================================================================
// FILE: src/integrations/endpoints/admin/social-admin-endpoints.ts
// Sosyal medya admin endpoint'leri — hal-backend → ekosistem-sosyal-medya proxy
// ===================================================================

import type { FetchArgs } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/base-api";
import type {
  SocialComposeBody,
  SocialFeedParams,
  SocialFeedResp,
  SocialPlanResp,
  SocialPostsParams,
  SocialPostsResp,
  SocialStatusResp,
  SocialTemplatesResp,
  SocialFeedPlatform,
} from "@/integrations/shared";
import { SOCIAL_ADMIN_BASE } from "@/integrations/shared";

const POSTS_TAG = "SocialPosts";

export const socialAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    socialFeed: b.query<SocialFeedResp, SocialFeedParams>({
      query: ({ platform, limit }): FetchArgs => ({
        url: `${SOCIAL_ADMIN_BASE}/feed`,
        params: { platform, ...(limit ? { limit } : {}) },
      }),
    }),

    socialStatus: b.query<SocialStatusResp, { platform: SocialFeedPlatform }>({
      query: ({ platform }): FetchArgs => ({ url: `${SOCIAL_ADMIN_BASE}/status`, params: { platform } }),
    }),

    socialChartPreview: b.query<{ success: boolean; url: string | null }, { platform: SocialFeedPlatform }>({
      query: ({ platform }): FetchArgs => ({ url: `${SOCIAL_ADMIN_BASE}/chart-preview`, params: { platform } }),
    }),

    socialPlan: b.query<SocialPlanResp, { platform: SocialFeedPlatform }>({
      query: ({ platform }): FetchArgs => ({ url: `${SOCIAL_ADMIN_BASE}/plan`, params: { platform } }),
    }),

    socialTemplates: b.query<SocialTemplatesResp, { platform: SocialFeedPlatform }>({
      query: ({ platform }): FetchArgs => ({ url: `${SOCIAL_ADMIN_BASE}/templates`, params: { platform } }),
    }),

    socialPosts: b.query<SocialPostsResp, SocialPostsParams>({
      query: ({ platform, scope }): FetchArgs => ({ url: `${SOCIAL_ADMIN_BASE}/posts`, params: { platform, scope } }),
      providesTags: [POSTS_TAG],
    }),

    socialSend: b.mutation<{ success: boolean; id: number }, SocialComposeBody>({
      query: (body): FetchArgs => ({ url: `${SOCIAL_ADMIN_BASE}/send`, method: "POST", body }),
      invalidatesTags: [POSTS_TAG],
    }),

    socialSavePost: b.mutation<{ success: boolean; id: number }, SocialComposeBody>({
      query: (body): FetchArgs => ({ url: `${SOCIAL_ADMIN_BASE}/posts`, method: "POST", body }),
      invalidatesTags: [POSTS_TAG],
    }),

    socialDeletePost: b.mutation<{ success: boolean }, number>({
      query: (id): FetchArgs => ({ url: `${SOCIAL_ADMIN_BASE}/posts/${id}`, method: "DELETE" }),
      invalidatesTags: [POSTS_TAG],
    }),
  }),
  overrideExisting: true,
});

export const {
  useSocialFeedQuery,
  useSocialStatusQuery,
  useLazySocialChartPreviewQuery,
  useSocialPlanQuery,
  useSocialTemplatesQuery,
  useSocialPostsQuery,
  useSocialSendMutation,
  useSocialSavePostMutation,
  useSocialDeletePostMutation,
} = socialAdminApi;
