import { baseApi } from "@/integrations/base-api";

export type PressContactStatus = "target" | "contacted" | "replied" | "published" | "blocked";
export type PressPublicationType = "newspaper" | "website" | "association" | "chamber" | "agency" | "other";
export type PressCampaignStatus = "draft" | "active" | "completed" | "archived";
export type PressLogStatus =
  | "planned"
  | "processing"
  | "sent"
  | "replied"
  | "published"
  | "bounced"
  | "rejected"
  | "failed"
  | "skipped"
  | "uncertain";
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
  fromEmail: string;
  replyToEmail: string;
  ratePerMinute: number;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  status: PressCampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  lastError: string | null;
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
  fromEmail?: string;
  replyToEmail?: string;
  ratePerMinute?: number;
  delayMinSeconds?: number;
  delayMaxSeconds?: number;
}

export interface PressPreflight {
  campaignId: number;
  total: number;
  counts: { allowed: number; blocked: number; invalid: number; duplicate: number; suppressed: number };
  canSend: boolean;
  approved: boolean;
  preflightHash: string;
  sender: { from: string; replyTo: string };
  rate: { perMinute: number; delayMinSeconds: number; delayMaxSeconds: number };
  branding: PressEmailBranding;
  preview: { subject: string; html: string; text: string };
  items: Array<{
    log_id: number;
    contact_id: number;
    organization: string;
    email: string;
    preflightStatus: string;
    preflightReason: string;
  }>;
}

export interface PressEmailBranding {
  logoUrl: string;
  logoAlt: string;
  tagline: string;
  signatureName: string;
  signatureTitle: string;
  email: string;
  website: string;
  accentColor: string;
}

export interface PressSentMessage {
  logId: number;
  campaignId: number;
  contactId: number;
  campaignName: string;
  recipientEmail: string;
  status: PressLogStatus;
  subject: string | null;
  html: string | null;
  previewHtml: string | null;
  text: string | null;
  fromEmail: string | null;
  replyToEmail: string | null;
  sentAt: string | null;
  providerMessageId: string | null;
  snapshotSource: "delivery" | "approval" | "unavailable";
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
    getPressEmailBrandingAdmin: builder.query<{ data: PressEmailBranding }, void>({
      query: () => ({ url: "/admin/press/email-branding", cache: "no-cache" }),
      providesTags: [{ type: "PressCampaigns" as const, id: "BRANDING" }],
    }),
    updatePressEmailBrandingAdmin: builder.mutation<{ data: PressEmailBranding }, PressEmailBranding>({
      query: (body) => ({ url: "/admin/press/email-branding", method: "PATCH", body }),
      invalidatesTags: [
        { type: "PressCampaigns" as const, id: "BRANDING" },
        { type: "PressCampaigns" as const, id: "LIST" },
      ],
    }),
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
    getPressCampaignPreflightAdmin: builder.query<{ data: PressPreflight }, { id: number }>({
      query: ({ id }) => ({ url: `/admin/press/campaigns/${id}/preflight`, cache: "no-cache" }),
      providesTags: (_res, _err, { id }) => [
        { type: "PressCampaigns" as const, id },
        { type: "PressCampaigns" as const, id: "BRANDING" },
      ],
    }),
    approvePressCampaignAdmin: builder.mutation<{ data: PressPreflight }, { id: number; preflightHash: string }>({
      query: ({ id, preflightHash }) => ({
        url: `/admin/press/campaigns/${id}/approve`,
        method: "POST",
        body: { preflightHash },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "PressCampaigns" as const, id },
        { type: "PressCampaigns" as const, id: "LIST" },
      ],
    }),
    sendPressCampaignAdmin: builder.mutation<
      { data: { ok: boolean; campaignId: number; queued: number; scheduledAt: string } },
      { id: number; preflightHash: string; scheduledAt?: string }
    >({
      query: ({ id, preflightHash, scheduledAt }) => ({
        url: `/admin/press/campaigns/${id}/send`,
        method: "POST",
        body: { preflightHash, scheduledAt },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "PressCampaigns" as const, id },
        { type: "PressCampaigns" as const, id: "LIST" },
        { type: "PressLogs" as const, id },
      ],
    }),
    listPressLogsAdmin: builder.query<{ items: PressOutreachLog[] }, { campaignId: number }>({
      query: ({ campaignId }) => ({ url: `/admin/press/campaigns/${campaignId}/logs` }),
      providesTags: (_res, _err, { campaignId }) => [{ type: "PressLogs" as const, id: campaignId }],
    }),
    getPressContactMessageAdmin: builder.query<{ data: PressSentMessage }, { campaignId: number; contactId: number }>({
      query: ({ campaignId, contactId }) => ({
        url: `/admin/press/campaigns/${campaignId}/contacts/${contactId}/message`,
        cache: "no-cache",
      }),
      providesTags: (_res, _err, { campaignId, contactId }) => [
        { type: "PressLogs" as const, id: `${campaignId}-${contactId}` },
      ],
    }),
    getPressLogMessageAdmin: builder.query<{ data: PressSentMessage }, { campaignId: number; logId: number }>({
      query: ({ campaignId, logId }) => ({
        url: `/admin/press/campaigns/${campaignId}/logs/${logId}/message`,
        cache: "no-cache",
      }),
      providesTags: (_res, _err, { campaignId, logId }) => [
        { type: "PressLogs" as const, id: `${campaignId}-log-${logId}` },
      ],
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
  useGetPressEmailBrandingAdminQuery,
  useUpdatePressEmailBrandingAdminMutation,
  useListPressContactsAdminQuery,
  useCreatePressContactAdminMutation,
  useImportPressContactsAdminMutation,
  useLazyExportPressContactsAdminQuery,
  useUpdatePressContactAdminMutation,
  useListPressCampaignsAdminQuery,
  useCreatePressCampaignAdminMutation,
  useUpdatePressCampaignAdminMutation,
  useGetPressCampaignPreflightAdminQuery,
  useApprovePressCampaignAdminMutation,
  useSendPressCampaignAdminMutation,
  useListPressLogsAdminQuery,
  useGetPressContactMessageAdminQuery,
  useGetPressLogMessageAdminQuery,
  useCreatePressLogAdminMutation,
  useGetPressSummaryAdminQuery,
  useListPublicAnalysisReportsForPressQuery,
} = pressAdminApi;
