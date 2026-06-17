// ===================================================================
// FILE: src/integrations/endpoints/admin/social-admin-endpoints.ts
// Sosyal izleme paneli admin endpoint'leri (read-only)
// ===================================================================

import type { FetchArgs } from "@reduxjs/toolkit/query";

import { baseApi } from "@/integrations/base-api";
import type { SocialFeedParams, SocialFeedResp } from "@/integrations/shared";
import { SOCIAL_ADMIN_BASE } from "@/integrations/shared";

export const socialAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /admin/social/feed?platform=&limit= */
    socialFeed: b.query<SocialFeedResp, SocialFeedParams>({
      query: ({ platform, limit }): FetchArgs => ({
        url: `${SOCIAL_ADMIN_BASE}/feed`,
        params: { platform, ...(limit ? { limit } : {}) },
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useSocialFeedQuery } = socialAdminApi;
