// =============================================================
// FILE: src/integrations/endpoints/admin/support-admin-endpoints.ts
// =============================================================
import { baseApi } from "@/integrations/base-api";
import type {
  SupportFaqCreatePayload,
  SupportFaqDto,
  SupportFaqListQueryParams,
  SupportFaqReorderPayload,
  SupportFaqUpdatePayload,
  SupportTicketDto,
  SupportTicketListQueryParams,
  SupportTicketUpdatePayload,
} from "@/integrations/shared";
import { cleanParams } from "@/integrations/shared";

export const supportAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // --- FAQs ---

    // GET /admin/support/faqs
    listSupportFaqsAdmin: b.query<SupportFaqDto[], SupportFaqListQueryParams | undefined>({
      query: (params) => ({
        url: "/admin/support/faqs",
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: "Faqs" as const, id: "LIST" }],
    }),

    // GET /admin/support/faqs/:id
    getSupportFaqAdmin: b.query<SupportFaqDto, { id: string; locale?: string }>({
      query: ({ id, locale }) => ({
        url: `/admin/support/faqs/${encodeURIComponent(id)}`,
        params: cleanParams(locale ? { locale } : undefined),
      }),
      providesTags: (_r, _e, { id }) => [{ type: "Faqs" as const, id }],
    }),

    // POST /admin/support/faqs
    createSupportFaqAdmin: b.mutation<SupportFaqDto, SupportFaqCreatePayload>({
      query: (body) => ({ url: "/admin/support/faqs", method: "POST", body }),
      invalidatesTags: [{ type: "Faqs" as const, id: "LIST" }],
    }),

    // PATCH /admin/support/faqs/:id
    updateSupportFaqAdmin: b.mutation<SupportFaqDto, { id: string; body: SupportFaqUpdatePayload }>({
      query: ({ id, body }) => ({
        url: `/admin/support/faqs/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Faqs" as const, id: "LIST" }],
    }),

    // DELETE /admin/support/faqs/:id
    deleteSupportFaqAdmin: b.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/admin/support/faqs/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Faqs" as const, id: "LIST" }],
    }),

    // POST /admin/support/faqs/reorder
    reorderSupportFaqsAdmin: b.mutation<{ ok: boolean }, SupportFaqReorderPayload>({
      query: (body) => ({ url: "/admin/support/faqs/reorder", method: "POST", body }),
      invalidatesTags: [{ type: "Faqs" as const, id: "LIST" }],
    }),

    // --- Tickets ---

    // GET /admin/support/tickets
    listSupportTicketsAdmin: b.query<SupportTicketDto[], SupportTicketListQueryParams | undefined>({
      query: (params) => ({
        url: "/admin/support/tickets",
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
      providesTags: [{ type: "SupportTickets" as const, id: "LIST" }],
    }),

    // GET /admin/support/tickets/:id
    getSupportTicketAdmin: b.query<SupportTicketDto, string>({
      query: (id) => ({
        url: `/admin/support/tickets/${encodeURIComponent(id)}`,
      }),
      providesTags: (_r, _e, id) => [{ type: "SupportTickets" as const, id }],
    }),

    // PATCH /admin/support/tickets/:id
    updateSupportTicketAdmin: b.mutation<SupportTicketDto, { id: string; body: SupportTicketUpdatePayload }>({
      query: ({ id, body }) => ({
        url: `/admin/support/tickets/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: "SupportTickets" as const, id: "LIST" },
        { type: "SupportTickets" as const, id },
      ],
    }),

    // DELETE /admin/support/tickets/:id
    deleteSupportTicketAdmin: b.mutation<{ ok: boolean }, string>({
      query: (id) => ({
        url: `/admin/support/tickets/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "SupportTickets" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListSupportFaqsAdminQuery,
  useGetSupportFaqAdminQuery,
  useCreateSupportFaqAdminMutation,
  useUpdateSupportFaqAdminMutation,
  useDeleteSupportFaqAdminMutation,
  useReorderSupportFaqsAdminMutation,
  useListSupportTicketsAdminQuery,
  useGetSupportTicketAdminQuery,
  useUpdateSupportTicketAdminMutation,
  useDeleteSupportTicketAdminMutation,
} = supportAdminApi;
