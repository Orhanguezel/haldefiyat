const SENSITIVE_KEY = /(?:phone|telefon|tel|email|e_mail|mail|note|message|mesaj|name|ad|soyad|token|code|otp|password|secret)/i;
const EMAIL = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g;
const TURKISH_MOBILE = /(?:\+?90|0)?\s*5\d{2}(?:[\s().-]*\d){7}/g;

function redactValue(value: string): string {
  return value.replace(EMAIL, "[redacted-email]").replace(TURKISH_MOBILE, "[redacted-phone]");
}
/** Keeps route/attribution visibility while removing query-string PII. */
export function sanitizeAuditUrl(raw: string): string {
  if (!raw) return "/";
  try {
    const absolute = /^[a-z][a-z\d+.-]*:\/\//i.test(raw);
    const parsed = new URL(raw, "http://haldefiyat.local");
    for (const [key, value] of parsed.searchParams.entries()) {
      parsed.searchParams.set(key, SENSITIVE_KEY.test(key) ? "[redacted]" : redactValue(value));
    }
    const suffix = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return absolute ? `${parsed.origin}${suffix}` : suffix;
  } catch {
    return redactValue(raw).slice(0, 2048);
  }
}
