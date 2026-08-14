"use client";

import { getAttribution } from "@/lib/attribution";

export type ConversionEventName =
  | "newsletter_signup"
  | "price_alert_created"
  | "pro_inquiry"
  | "urun_favorited"
  | "pro_upgrade"
  | "embed_inquiry"
  | "call_request_view"
  | "call_request_submit"
  | "call_request_accepted"
  | "call_request_declined"
  | "call_request_cancelled"
  | "call_request_completed"
  | "whatsapp_channel_follow";

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

const EVENT_VALUE: Record<ConversionEventName, number> = {
  price_alert_created: 50,
  newsletter_signup: 30,
  pro_inquiry: 40,
  urun_favorited: 10,
  pro_upgrade: 40,
  embed_inquiry: 35,
  call_request_view: 5,
  call_request_submit: 45,
  call_request_accepted: 70,
  call_request_declined: 0,
  call_request_cancelled: 0,
  call_request_completed: 90,
  whatsapp_channel_follow: 30,
};

function eventCategory(eventName: ConversionEventName): "conversion" | "engagement" {
  return ["urun_favorited", "call_request_view", "call_request_declined", "call_request_cancelled"].includes(eventName)
    ? "engagement"
    : "conversion";
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
    event_category: eventCategory(eventName),
    event_label: params.event_label ?? params.product_slug ?? params.method ?? "",
    value: params.value ?? EVENT_VALUE[eventName],
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
