export function hasContactPrivacyConsent(body: unknown): boolean {
  return Boolean(body && typeof body === "object" && (body as { privacyAccepted?: unknown }).privacyAccepted === true);
}
