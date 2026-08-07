"use client";

export type AdConversionEvent = "listing_view" | "offer_submit" | "phone_click" | "whatsapp_click" | "firm_contact" | "directions_click" | "favorite_add";

export function trackAdConversion(eventType: AdConversionEvent, entityType: "listing" | "firm" | "product", entityId: string | number): void {
  void fetch("/api/v1/banners/conversion", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, entityType, entityId: String(entityId) }),
    keepalive: true,
  }).catch(() => undefined);
}
