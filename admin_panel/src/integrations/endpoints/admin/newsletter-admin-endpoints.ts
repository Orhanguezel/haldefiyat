// =============================================================
// FILE: src/integrations/endpoints/admin/newsletter-admin-endpoints.ts
// =============================================================

import { baseApi } from "@/integrations/base-api";
import {
  NEWSLETTER_ADMIN_BASE,
  NEWSLETTER_DIGEST_BASE,
  NEWSLETTER_SENDS_BASE,
  type NewsletterFunnel,
  type NewsletterListQueryParams,
  type NewsletterSend,
  type NewsletterSendDetail,
  type NewsletterSubscriber,
  type WeeklyMailSendResult,
} from "@/integrations/shared";

export const newsletterAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    newsletterFunnelAdmin: build.query<NewsletterFunnel, void>({
      query: () => ({ url: `${NEWSLETTER_ADMIN_BASE}/funnel`, method: "GET" }),
      transformResponse: (response: { data: NewsletterFunnel }) => response.data,
      providesTags: [{ type: "NewsletterSubscribers" as const, id: "FUNNEL" }],
    }),
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
      invalidatesTags: [
        { type: "NewsletterSubscribers" as const, id: "LIST" },
        { type: "NewsletterSends" as const, id: "LIST" },
      ],
    }),

    // Gönderim arşivi
    listNewsletterSendsAdmin: build.query<NewsletterSend[], { limit?: number } | void>({
      query: (params?: { limit?: number }) => ({
        url: NEWSLETTER_SENDS_BASE,
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (response: { items: NewsletterSend[] }) => response.items ?? [],
      providesTags: [{ type: "NewsletterSends" as const, id: "LIST" }],
    }),

    getNewsletterSendAdmin: build.query<NewsletterSendDetail, string>({
      query: (id) => ({ url: `${NEWSLETTER_SENDS_BASE}/${id}`, method: "GET" }),
      transformResponse: (response: { item: NewsletterSendDetail }) => response.item,
      providesTags: (result, error, id) => [{ type: "NewsletterSends" as const, id }],
    }),

    createNewsletterDraftAdmin: build.mutation<{ id: string; subject: string }, void>({
      query: () => ({ url: `${NEWSLETTER_SENDS_BASE}/draft`, method: "POST" }),
      invalidatesTags: [{ type: "NewsletterSends" as const, id: "LIST" }],
    }),

    updateNewsletterDraftAdmin: build.mutation<void, { id: string; subject?: string; html?: string }>({
      query: ({ id, ...body }) => ({ url: `${NEWSLETTER_SENDS_BASE}/${id}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => [
        { type: "NewsletterSends" as const, id },
        { type: "NewsletterSends" as const, id: "LIST" },
      ],
    }),

    sendNewsletterDraftAdmin: build.mutation<WeeklyMailSendResult, string>({
      query: (id) => ({ url: `${NEWSLETTER_SENDS_BASE}/${id}/send`, method: "POST" }),
      invalidatesTags: [{ type: "NewsletterSends" as const, id: "LIST" }],
    }),

    deleteNewsletterDraftAdmin: build.mutation<void, string>({
      query: (id) => ({ url: `${NEWSLETTER_SENDS_BASE}/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "NewsletterSends" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useNewsletterFunnelAdminQuery,
  useListNewsletterAdminQuery,
  useDeleteNewsletterAdminMutation,
  usePreviewWeeklyMailAdminQuery,
  useSendWeeklyMailTestAdminMutation,
  useSendWeeklyMailAdminMutation,
  useListNewsletterSendsAdminQuery,
  useGetNewsletterSendAdminQuery,
  useCreateNewsletterDraftAdminMutation,
  useUpdateNewsletterDraftAdminMutation,
  useSendNewsletterDraftAdminMutation,
  useDeleteNewsletterDraftAdminMutation,
} = newsletterAdminApi;
