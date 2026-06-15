"use client";

export interface AttributionData {
  gclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landed_at: string;
  first_path: string;
}

const ATTRIBUTION_COOKIE = "hf_attr";
const CONSENT_KEY = "hf_cookie_consent";
const ATTRIBUTION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
const ATTRIBUTION_KEYS = [
  "gclid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function canUseBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getCookie(name: string): string | null {
  if (!canUseBrowser()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!canUseBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const domain = window.location.hostname.endsWith("haldefiyat.com") ? "; Domain=.haldefiyat.com" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}${domain}`;
}

export function getAttribution(): AttributionData | null {
  const raw = getCookie(ATTRIBUTION_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AttributionData>;
    if (!parsed.landed_at || !parsed.first_path) return null;
    return parsed as AttributionData;
  } catch {
    return null;
  }
}

export function captureAttribution(): void {
  if (!canUseBrowser()) return;
  if (window.localStorage.getItem(CONSENT_KEY) !== "accepted") return;
  if (getAttribution()) return;

  const params = new URLSearchParams(window.location.search);
  const captured: Partial<AttributionData> = {};

  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) captured[key] = value.slice(0, 256);
  }

  if (!captured.gclid && !captured.utm_source && !captured.utm_medium && !captured.utm_campaign) {
    return;
  }

  setCookie(
    ATTRIBUTION_COOKIE,
    JSON.stringify({
      ...captured,
      landed_at: new Date().toISOString(),
      first_path: `${window.location.pathname}${window.location.search}`,
    }),
    ATTRIBUTION_MAX_AGE_SECONDS,
  );
}
