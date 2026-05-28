import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET = process.env.NEWSLETTER_SECRET || process.env.JWT_SECRET || "hf-newsletter-secret";

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function makeUnsubToken(email: string): string {
  return b64url(createHmac("sha256", SECRET).update(email.toLowerCase().trim()).digest());
}

export function verifyUnsubToken(email: string, token: string): boolean {
  const expected = makeUnsubToken(email);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

export function encodeEmail(email: string): string {
  return b64url(email.toLowerCase().trim());
}

export function decodeEmail(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString("utf8").toLowerCase().trim();
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://haldefiyat.com").replace(/\/$/, "");
}

/** Mail footer'inda kullanilan kisiye ozel abonelikten cikma linki (frontend sayfasi). */
export function unsubUrl(email: string): string {
  return `${siteUrl()}/abonelik?e=${encodeEmail(email)}&t=${makeUnsubToken(email)}`;
}

/** RFC 8058 one-click icin API endpoint URL'i (List-Unsubscribe header). */
export function apiUnsubUrl(email: string): string {
  return `${siteUrl()}/api/v1/newsletter/unsubscribe?e=${encodeEmail(email)}&t=${makeUnsubToken(email)}`;
}

/** Mail gonderiminde kullanilacak List-Unsubscribe header'lari (Gmail/Outlook one-click). */
export function unsubHeaders(email: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${apiUnsubUrl(email)}>, <${unsubUrl(email)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
