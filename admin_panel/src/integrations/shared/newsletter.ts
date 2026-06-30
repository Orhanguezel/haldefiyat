// =============================================================
// FILE: src/integrations/shared/newsletter.ts
// Newsletter (bülten) admin — shared types + helpers + base paths
// =============================================================

export const NEWSLETTER_ADMIN_BASE = "/admin/newsletter";
export const NEWSLETTER_DIGEST_BASE = "/admin/hal/newsletter/weekly-mail";

export interface NewsletterFunnel {
  total: number;
  active: number;
  unsubscribed: number;
  last7: number;
  last30: number;
  bySource: { source: string; n: number; active: number }[];
  byDay: { day: string; n: number }[];
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_verified: number | boolean;
  locale: string | null;
  meta: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type NewsletterListQueryParams = {
  q?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: "asc" | "desc";
};

export type NewsletterStatus = "active" | "unsubscribed";

export interface WeeklyMailSendResult {
  ok: boolean;
  sent?: boolean;
  reason?: string;
  recipients?: number;
  successes?: number;
  failures?: number;
}

export function getNewsletterStatus(
  subscriber: Pick<NewsletterSubscriber, "unsubscribed_at">,
): NewsletterStatus {
  return subscriber.unsubscribed_at ? "unsubscribed" : "active";
}

export function getNewsletterStatusKey(status: NewsletterStatus): string {
  return `status.${status}`;
}

export function getNewsletterStatusVariant(status: NewsletterStatus): "success" | "muted" {
  return status === "active" ? "success" : "muted";
}

export function formatNewsletterDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
}

export function computeNewsletterStats(subscribers: NewsletterSubscriber[]): NewsletterStats {
  let active = 0;
  let unsubscribed = 0;
  for (const s of subscribers) {
    if (s.unsubscribed_at) unsubscribed++;
    else active++;
  }
  return { total: subscribers.length, active, unsubscribed };
}
