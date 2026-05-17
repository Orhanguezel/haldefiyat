import { baseApi } from "@/integrations/base-api";

export type PressContactStatus = "target" | "contacted" | "replied" | "published" | "blocked";
export type PressPublicationType = "newspaper" | "website" | "association" | "chamber" | "agency" | "other";
export type PressCampaignStatus = "draft" | "active" | "completed" | "archived";
export type PressLogStatus = "planned" | "sent" | "replied" | "published" | "bounced" | "rejected";
export type PressChannel = "email" | "phone" | "social" | "other";

export interface PressContact {
  id: number;
  organization: string;
  publicationType: PressPublicationType;
  contactName: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  tags: string[];
  status: PressContactStatus;
  notes: string | null;
  lastContactedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PressCampaign {
  id: number;
  slug: string;
  name: string;
  subject: string;
  pitch: string;
  templateKey: string | null;
  segmentTags: string[];
  status: PressCampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PressOutreachLog {
  id: number;
  campaignId: number;
  contactId: number;
  channel: PressChannel;
  status: PressLogStatus;
  note: string | null;
  publishedUrl: string | null;
  contactedAt: string | null;
  createdAt: string | null;
  organization: string;
  email: string;
}

export interface PressContactPayload {
  organization: string;
  publicationType?: PressPublicationType;
  contactName?: string | null;
  email: string;
  phone?: string | null;
  city?: string | null;
  tags?: string[];
  status?: PressContactStatus;
  notes?: string | null;
}

export interface PressCampaignPayload {
  name: string;
  slug?: string;
  subject: string;
  pitch: string;
  templateKey?: string | null;
  segmentTags?: string[];
  status?: PressCampaignStatus;
}

export interface PressLogPayload {
  campaignId: number;
  contactId: number;
  channel?: PressChannel;
  status?: PressLogStatus;
  note?: string | null;
  publishedUrl?: string | null;
}

export interface PublicAnalysisReport {
  slug: string;
  baslik: string;
  ozet: string;
  tarih: string;
  hafta: string;
}

export const pressAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listPressContactsAdmin: builder.query<
      { items: PressContact[] },
      { q?: string; status?: PressContactStatus; publicationType?: PressPublicationType; limit?: number } | undefined
    >({
      query: (params) => ({ url: "/admin/press/contacts", params }),
      providesTags: [{ type: "PressContacts" as const, id: "LIST" }],
    }),
    createPressContactAdmin: builder.mutation<{ data: PressContact }, PressContactPayload>({
      query: (body) => ({ url: "/admin/press/contacts", method: "POST", body }),
      invalidatesTags: [{ type: "PressContacts" as const, id: "LIST" }],
    }),
    importPressContactsAdmin: builder.mutation<
      { ok: boolean; imported: number; skipped: number; errors: string[] },
      { csv: string }
    >({
      query: (body) => ({ url: "/admin/press/contacts/import", method: "POST", body }),
      invalidatesTags: [
        { type: "PressContacts" as const, id: "LIST" },
        { type: "PressSummary" as const, id: "MAIN" },
      ],
    }),
    exportPressContactsAdmin: builder.query<Blob, void>({
      query: () => ({
        url: "/admin/press/contacts/export.csv",
        responseHandler: (response: Response) => response.blob(),
        cache: "no-cache",
      }),
    }),
    updatePressContactAdmin: builder.mutation<
      { data: PressContact },
      { id: number; patch: Partial<PressContactPayload> }
    >({
      query: ({ id, patch }) => ({ url: `/admin/press/contacts/${id}`, method: "PATCH", body: patch }),
      invalidatesTags: [{ type: "PressContacts" as const, id: "LIST" }],
    }),
    listPressCampaignsAdmin: builder.query<
      { items: PressCampaign[] },
      { status?: PressCampaignStatus; limit?: number } | undefined
    >({
      query: (params) => ({ url: "/admin/press/campaigns", params }),
      providesTags: [{ type: "PressCampaigns" as const, id: "LIST" }],
    }),
    createPressCampaignAdmin: builder.mutation<{ data: PressCampaign }, PressCampaignPayload>({
      query: (body) => ({ url: "/admin/press/campaigns", method: "POST", body }),
      invalidatesTags: [{ type: "PressCampaigns" as const, id: "LIST" }],
    }),
    updatePressCampaignAdmin: builder.mutation<
      { data: PressCampaign },
      { id: number; patch: Partial<PressCampaignPayload> }
    >({
      query: ({ id, patch }) => ({ url: `/admin/press/campaigns/${id}`, method: "PATCH", body: patch }),
      invalidatesTags: [{ type: "PressCampaigns" as const, id: "LIST" }],
    }),
    listPressLogsAdmin: builder.query<{ items: PressOutreachLog[] }, { campaignId: number }>({
      query: ({ campaignId }) => ({ url: `/admin/press/campaigns/${campaignId}/logs` }),
      providesTags: (_res, _err, { campaignId }) => [{ type: "PressLogs" as const, id: campaignId }],
    }),
    createPressLogAdmin: builder.mutation<{ ok: boolean }, PressLogPayload>({
      query: (body) => ({ url: "/admin/press/logs", method: "POST", body }),
      invalidatesTags: (_res, _err, body) => [
        { type: "PressContacts" as const, id: "LIST" },
        { type: "PressLogs" as const, id: body.campaignId },
      ],
    }),
    getPressSummaryAdmin: builder.query<
      { totals: { contacts: number; campaigns: number; publishedLinks: number } },
      void
    >({
      query: () => ({ url: "/admin/press/summary" }),
      providesTags: [{ type: "PressSummary" as const, id: "MAIN" }],
    }),
    listPublicAnalysisReportsForPress: builder.query<{ items: PublicAnalysisReport[] }, void>({
      query: () => ({ url: "/analysis/weekly-reports?limit=1" }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useListPressContactsAdminQuery,
  useCreatePressContactAdminMutation,
  useImportPressContactsAdminMutation,
  useLazyExportPressContactsAdminQuery,
  useUpdatePressContactAdminMutation,
  useListPressCampaignsAdminQuery,
  useCreatePressCampaignAdminMutation,
  useUpdatePressCampaignAdminMutation,
  useListPressLogsAdminQuery,
  useCreatePressLogAdminMutation,
  useGetPressSummaryAdminQuery,
  useListPublicAnalysisReportsForPressQuery,
} = pressAdminApi;
