import type { ErrorEvent } from "@sentry/node";

const SENSITIVE_KEY = /(?:authorization|cookie|phone|telefon|email|mail|note|message|name|token|otp|password|secret)/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const TURKISH_MOBILE = /(?<!\d)(?:\+?90[\s().-]*)?(?:0?5\d{2})[\s().-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}(?!\d)/g;

function redactText(value: string): string {
  return value.replace(EMAIL, "[redacted-email]").replace(TURKISH_MOBILE, "[redacted-phone]");
}

function scrubValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return "[redacted]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => scrubValue("item", item));
  if (value && typeof value === "object") return scrubRecord(value as Record<string, unknown>);
  return value;
}

function scrubRecord(value: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!value) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrubValue(key, item)]));
}

export function scrubBackendSentryEvent<T extends ErrorEvent>(event: T): T {
  if (event.request) {
    event.request.data = undefined;
    event.request.cookies = undefined;
    event.request.headers = undefined;
    if (event.request.url) event.request.url = event.request.url.split("?")[0];
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }
  if (event.message) event.message = redactText(event.message);
  event.exception?.values?.forEach((exception) => {
    if (exception.value) exception.value = redactText(exception.value);
  });
  event.extra = scrubRecord(event.extra);
  event.contexts = scrubRecord(event.contexts as Record<string, unknown>) as ErrorEvent["contexts"];
  event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({
    ...breadcrumb,
    message: breadcrumb.message ? redactText(breadcrumb.message) : breadcrumb.message,
    data: scrubRecord(breadcrumb.data as Record<string, unknown> | undefined),
  }));
  return event;
}
