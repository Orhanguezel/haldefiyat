// =============================================================
// FILE: src/integrations/endpoints/admin/newsletter-admin-endpoints.ts
// =============================================================

import { baseApi } from "@/integrations/base-api";
import {
  NEWSLETTER_ADMIN_BASE,
  NEWSLETTER_DIGEST_BASE,
  type NewsletterListQueryParams,
  type NewsletterSubscriber,
  type WeeklyMailSendResult,
} from "@/integrations/shared";

export const newsletterAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listNewsletterAdmin: build.query<NewsletterSubscriber[], NewsletterListQueryParams | void>({
      query: (params?: NewsletterListQueryParams) => ({
        url: NEWSLETTER_ADMIN_BASE,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: "NewsletterSubscriber" as const, id: s.id })),
              { type: "NewsletterSubscribers" as const, id: "LIST" },
            ]
          : [{ type: "NewsletterSubscribers" as const, id: "LIST" }],
    }),

    deleteNewsletterAdmin: build.mutation<void, string>({
      query: (id) => ({
        url: `${NEWSLETTER_ADMIN_BASE}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "NewsletterSubscriber" as const, id },
        { type: "NewsletterSubscribers" as const, id: "LIST" },
      ],
    }),

    // Haftalık bülten HTML önizleme (raw HTML döner)
    previewWeeklyMailAdmin: build.query<string, void>({
      query: () => ({
        url: `${NEWSLETTER_DIGEST_BASE}/preview`,
        method: "GET",
        responseHandler: (response) => response.text(),
      }),
    }),

    // Tek adrese test maili
    sendWeeklyMailTestAdmin: build.mutation<WeeklyMailSendResult, { to: string }>({
      query: (body) => ({
        url: `${NEWSLETTER_DIGEST_BASE}/test`,
        method: "POST",
        body,
      }),
    }),

    // Tüm aktif abonelere gönder
    sendWeeklyMailAdmin: build.mutation<WeeklyMailSendResult, void>({
      query: () => ({
        url: NEWSLETTER_DIGEST_BASE,
        method: "POST",
      }),
      invalidatesTags: [{ type: "NewsletterSubscribers" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListNewsletterAdminQuery,
  useDeleteNewsletterAdminMutation,
  usePreviewWeeklyMailAdminQuery,
  useSendWeeklyMailTestAdminMutation,
  useSendWeeklyMailAdminMutation,
} = newsletterAdminApi;
