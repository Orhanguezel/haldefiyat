"use client";

import { getAttribution } from "@/lib/attribution";
import { trackProductJourney, type ProductJourneyEvent } from "@/lib/cta-tracking";

export type ConversionEventName =
  | "newsletter_signup"
  | "price_alert_created"
  | "pro_inquiry"
  | "urun_favorited"
  | "pro_upgrade"
  | "embed_inquiry"
  | "call_request_view"
  | "call_request_submit"
  | "call_request_notified"
  | "call_request_accepted"
  | "call_request_declined"
  | "call_request_cancelled"
  | "call_request_completed"
  | "whatsapp_channel_follow";

type ConversionParams = Record<string, string | number | boolean | null | undefined>;

type ConversionOptions = {
  email?: string | null;
};

export type DiscoveryEventName =
  | "search_opened"
  | "search_submitted"
  | "search_result_selected"
  | "price_viewed"
  | "price_filter_changed"
  | "price_filter_zero_results";

export type DiscoveryEventParams = {
  trigger?: "hero" | "header" | "keyboard" | "programmatic";
  query_length?: number;
  product_results?: number;
  market_results?: number;
  result_count?: number;
  zero_results?: boolean;
  result_type?: "product" | "market";
  result_position?: number;
  item_slug?: string;
  product_slug?: string;
  market_count?: number;
  source_count?: number;
  filter_name?: "query" | "city" | "market" | "category" | "unit" | "range" | "sort" | "page_size" | "reset";
  filter_value?: string;
  active_filter_count?: number;
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
  call_request_notified: 55,
  call_request_accepted: 70,
  call_request_declined: 0,
  call_request_cancelled: 0,
  call_request_completed: 90,
  whatsapp_channel_follow: 30,
};

const DISCOVERY_KEYS = new Set<keyof DiscoveryEventParams>([
  "trigger",
  "query_length",
  "product_results",
  "market_results",
  "result_count",
  "zero_results",
  "result_type",
  "result_position",
  "item_slug",
  "product_slug",
  "market_count",
  "source_count",
  "filter_name",
  "filter_value",
  "active_filter_count",
]);

const PII_VALUE_PATTERN = /(?:@|\b(?:\+?90)?5\d{9}\b)/u;

export function trackDiscoveryEvent(
  eventName: DiscoveryEventName,
  params: DiscoveryEventParams = {},
): void {
  const journeyEvent: Partial<Record<DiscoveryEventName, ProductJourneyEvent>> = {
    search_opened: "opened",
    search_submitted: params.zero_results ? "zero_results" : "submitted",
    search_result_selected: "selected",
    price_viewed: "price_viewed",
  };
  const firstPartyEvent = journeyEvent[eventName];
  if (firstPartyEvent) {
    trackProductJourney(firstPartyEvent);
    // Sıfır sonuç da bir gönderimdir; paydanın eksilmemesi için iki olay yazılır.
    if (eventName === "search_submitted" && params.zero_results) trackProductJourney("submitted");
  }

  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  const safeParams: Record<string, string | number | boolean> = {
    event_category: "product_discovery",
  };
  for (const [rawKey, rawValue] of Object.entries(params)) {
    const key = rawKey as keyof DiscoveryEventParams;
    if (!DISCOVERY_KEYS.has(key) || rawValue == null) continue;
    if (typeof rawValue === "string") {
      const value = rawValue.trim().slice(0, 100);
      if (!value || PII_VALUE_PATTERN.test(value)) continue;
      safeParams[key] = value;
    } else if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      safeParams[key] = rawValue;
    } else if (typeof rawValue === "boolean") {
      safeParams[key] = rawValue;
    }
  }

  const attribution = getAttribution();
  window.gtag("event", eventName, {
    ...safeParams,
    ...(attribution ? {
      gclid: attribution.gclid,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      first_path: attribution.first_path,
    } : {}),
  });
}

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
