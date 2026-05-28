"use client";

import { getAttribution } from "@/lib/attribution";

export type ConversionEventName =
  | "newsletter_signup"
  | "pro_upgrade"
  | "embed_inquiry"
  | "price_alert_created";

type ConversionParams = Record<string, string | number | boolean | null | undefined>;

type ConversionOptions = {
  email?: string | null;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

async function sha256Lower(text: string): Promise<string | null> {
  try {
    if (typeof globalThis.crypto?.subtle?.digest !== "function") return null;
    const encoded = new TextEncoder().encode(text.trim().toLowerCase());
    const buf = await globalThis.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

export function trackConversion(
  eventName: ConversionEventName,
  params: ConversionParams = {},
  options: ConversionOptions = {},
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const attribution = getAttribution();
  const eventParams: ConversionParams & { user_data?: { email_address: string } } = {
    currency: "TRY",
    ...params,
  };

  if (attribution) {
    eventParams.gclid = attribution.gclid;
    eventParams.utm_source = attribution.utm_source;
    eventParams.utm_medium = attribution.utm_medium;
    eventParams.utm_campaign = attribution.utm_campaign;
    eventParams.utm_content = attribution.utm_content;
    eventParams.utm_term = attribution.utm_term;
    eventParams.landed_at = attribution.landed_at;
    eventParams.first_path = attribution.first_path;
  }

  // M11.8 Enhanced Conversions — SHA-256 hashed email (PII safe)
  if (options.email && options.email.includes("@")) {
    sha256Lower(options.email).then((hash) => {
      const finalParams = hash
        ? { ...eventParams, user_data: { email_address: hash } }
        : eventParams;
      window.gtag?.("event", eventName, finalParams);
    });
    return;
  }

  window.gtag("event", eventName, eventParams);
}
