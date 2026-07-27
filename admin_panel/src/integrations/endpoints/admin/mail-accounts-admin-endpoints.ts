import { baseApi } from "@/integrations/base-api";

export type MailAccountStatus = "connected" | "expired" | "error" | "disconnected";

export interface MailAccount {
  id: string;
  provider: "gmail_oauth" | "imap_smtp";
  email: string;
  display_name: string | null;
  status: MailAccountStatus;
  scopes: string | null;
  token_expiry: string | null;
  last_synced_at: string | null;
  configured: boolean;
}

export interface GoogleIntegrationStatus {
  connected: boolean;
  reconnect_required: boolean;
  email: string | null;
  last_synced_at: string | null;
}

export interface GoogleSyncResult {
  ok: boolean;
  imported: number;
  exported: number;
  updated: number;
  total_remote: number;
}

export interface SendUserMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | null;
}

export interface MailInboxItem {
  id: string;
  thread_id: string | null;
  from: string | null;
  to: string | null;
  subject: string;
  date: string | null;
  snippet: string;
  unread: boolean;
}

export interface MailInboxResponse {
  account: MailAccount | null;
  messages: MailInboxItem[];
  nextPageToken: string | null;
}

export type MailMessage = MailInboxItem & { text: string; html: string };

export interface PersonalGoogleTask {
  id: string;
  subject: string;
  body: string | null;
  due_at: string | null;
  status: "open" | "done" | "cancelled";
  source: "google" | "osgb";
  updated_at: string;
}

export interface PersonalGoogleEvent {
  id: string;
  title: string;
  description: string | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  updated_at: string;
}

export const mailAccountsAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listMailAccounts: build.query<MailAccount[], void>({
      query: () => "/admin/mail/accounts",
      providesTags: ["MailAccounts"],
    }),
    gmailConnectUrl: build.query<{ url: string }, void>({
      query: () => "/admin/mail/accounts/gmail/connect",
    }),
    deleteMailAccount: build.mutation<void, string>({
      query: (id) => ({ url: `/admin/mail/accounts/${id}`, method: "DELETE" }),
      invalidatesTags: ["MailAccounts", "GoogleIntegration"],
    }),
    googleTasksStatus: build.query<GoogleIntegrationStatus, void>({
      query: () => "/admin/mail/accounts/google/tasks/status",
      providesTags: ["GoogleIntegration"],
    }),
    syncGoogleTasks: build.mutation<GoogleSyncResult, void>({
      query: () => ({ url: "/admin/mail/accounts/google/tasks/sync", method: "POST" }),
      invalidatesTags: ["GoogleIntegration", "MailAccounts"],
    }),
    googleCalendarStatus: build.query<GoogleIntegrationStatus, void>({
      query: () => "/admin/mail/accounts/google/calendar/status",
      providesTags: ["GoogleIntegration"],
    }),
    syncGoogleCalendar: build.mutation<GoogleSyncResult, void>({
      query: () => ({ url: "/admin/mail/accounts/google/calendar/sync", method: "POST" }),
      invalidatesTags: ["GoogleIntegration", "MailAccounts"],
    }),
    sendUserMail: build.mutation<{ ok: boolean; provider: string }, SendUserMailInput>({
      query: (body) => ({ url: "/admin/mail/send", method: "POST", body }),
    }),
    listOwnMailInbox: build.query<MailInboxResponse, { limit?: number } | void>({
      query: (params) => ({ url: "/admin/mail/inbox", params: params || undefined }),
    }),
    getOwnMailMessage: build.query<MailMessage, string>({
      query: (id) => `/admin/mail/messages/${encodeURIComponent(id)}`,
    }),
    listOwnGoogleTasks: build.query<PersonalGoogleTask[], void>({
      query: () => "/admin/mail/accounts/google/tasks",
      providesTags: ["GoogleIntegration"],
    }),
    listOwnGoogleEvents: build.query<PersonalGoogleEvent[], void>({
      query: () => "/admin/mail/accounts/google/calendar",
      providesTags: ["GoogleIntegration"],
    }),
  }),
});

export const {
  useListMailAccountsQuery,
  useLazyGmailConnectUrlQuery,
  useDeleteMailAccountMutation,
  useGoogleTasksStatusQuery,
  useSyncGoogleTasksMutation,
  useGoogleCalendarStatusQuery,
  useSyncGoogleCalendarMutation,
  useSendUserMailMutation,
  useListOwnMailInboxQuery,
  useLazyGetOwnMailMessageQuery,
  useListOwnGoogleTasksQuery,
  useListOwnGoogleEventsQuery,
} = mailAccountsAdminApi;
