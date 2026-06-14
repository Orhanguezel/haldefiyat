// ===================================================================
// FILE: src/integrations/endpoints/admin/twitter-admin-endpoints.ts
// Twitter/X admin endpoints
// ===================================================================

import type { FetchArgs } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/base-api";
import type {
  SocialPlatform,
  TwitterPlansResp,
  TwitterAiDraftBody,
  TwitterAiDraftResp,
  TwitterLogListParams,
  TwitterLogListResp,
  TwitterSendBody,
  TwitterSendResp,
  TwitterSyncHistoryResp,
  TwitterStatusResp,
  TwitterTemplatePreviewResp,
  TwitterVerifyResp,
} from "@/integrations/shared";
import { TWITTER_ADMIN_BASE } from "@/integrations/shared";

export const twitterAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /admin/twitter/status?platform= */
    twitterStatus: b.query<TwitterStatusResp, { platform?: SocialPlatform } | void>({
      query: (params): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/status`,
        params: params ?? {},
      }),
    }),

    /** GET /admin/twitter/templates?platform= */
    twitterTemplatePreviews: b.query<TwitterTemplatePreviewResp, { platform?: SocialPlatform } | void>({
      query: (params): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/templates`,
        params: params ?? {},
      }),
    }),

    /** POST /admin/twitter/verify */
    twitterVerify: b.mutation<TwitterVerifyResp, { platform?: SocialPlatform } | void>({
      query: (body): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/verify`,
        method: "POST",
        body: body ?? {},
      }),
    }),

    /** POST /admin/twitter/sync-history */
    twitterSyncHistory: b.mutation<TwitterSyncHistoryResp, void>({
      query: (): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/sync-history`,
        method: "POST",
        body: {},
      }),
    }),

    /** POST /admin/twitter/ai-draft */
    twitterAiDraft: b.mutation<TwitterAiDraftResp, TwitterAiDraftBody>({
      query: (body): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/ai-draft`,
        method: "POST",
        body,
      }),
    }),

    /** POST /admin/twitter/send */
    twitterSend: b.mutation<TwitterSendResp, TwitterSendBody>({
      query: (body): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/send`,
        method: "POST",
        body,
      }),
    }),

    /** GET /admin/twitter/tweets */
    twitterListTweets: b.query<TwitterLogListResp, TwitterLogListParams | undefined>({
      query: (params): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/tweets`,
        params: params ?? {},
      }),
    }),

    /** GET /admin/twitter/plans?platform= */
    twitterPlans: b.query<TwitterPlansResp, { platform?: SocialPlatform } | void>({
      query: (params): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/plans`,
        params: params ?? {},
      }),
    }),

    /** POST /admin/twitter/tweets/:id/cancel */
    twitterCancelTweet: b.mutation<{ ok: boolean }, string>({
      query: (id): FetchArgs => ({
        url: `${TWITTER_ADMIN_BASE}/tweets/${id}/cancel`,
        method: "POST",
        body: {},
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useTwitterStatusQuery,
  useTwitterTemplatePreviewsQuery,
  useTwitterVerifyMutation,
  useTwitterSyncHistoryMutation,
  useTwitterAiDraftMutation,
  useTwitterSendMutation,
  useTwitterListTweetsQuery,
  useTwitterPlansQuery,
  useLazyTwitterListTweetsQuery,
  useTwitterCancelTweetMutation,
} = twitterAdminApi;
