import type { Event } from "@sentry/nextjs";

const SENSITIVE_KEY = /(?:authorization|cookie|phone|telefon|email|mail|note|message|name|token|otp|password|secret)/i;

function scrubRecord(value: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!value) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    SENSITIVE_KEY.test(key) ? "[redacted]" : item,
  ]));
}
/** Sentry keeps diagnostics, never form/contact payloads or auth headers. */
export function scrubSentryEvent(event: Event): Event {
  if (event.request) {
    event.request.data = undefined;
    event.request.cookies = undefined;
    event.request.headers = scrubRecord(event.request.headers as Record<string, unknown>) as Record<string, string>;
    if (event.request.url) {
      try {
        const url = new URL(event.request.url, "https://haldefiyat.com");
        for (const key of [...url.searchParams.keys()]) {
          if (SENSITIVE_KEY.test(key)) url.searchParams.set(key, "[redacted]");
        }
        event.request.url = url.toString();
      } catch {
        event.request.url = event.request.url.split("?")[0];
      }
    }
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }
  event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({
    ...breadcrumb,
    data: scrubRecord(breadcrumb.data as Record<string, unknown> | undefined),
  }));
  return event;
}
