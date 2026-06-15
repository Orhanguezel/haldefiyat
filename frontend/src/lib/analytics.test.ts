import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureAttribution, getAttribution } from "@/lib/attribution";
import { type ConversionEventName, trackConversion } from "@/lib/analytics";

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0`;
}

describe("attribution and conversion analytics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-28T10:00:00.000Z"));
    window.history.replaceState(null, "", "/tr/canli-hal-fiyatlari?gclid=test123&utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_content=ad-1&utm_term=hal");
    window.localStorage.clear();
    clearCookie("hf_attr");
    window.gtag = vi.fn();
  });

  afterEach(() => {
    clearCookie("hf_attr");
    window.localStorage.clear();
    delete window.gtag;
    vi.useRealTimers();
  });

  it("captures first-touch gclid and UTM values only after consent", () => {
    captureAttribution();
    expect(getAttribution()).toBeNull();

    window.localStorage.setItem("hf_cookie_consent", "accepted");
    captureAttribution();

    expect(getAttribution()).toMatchObject({
      gclid: "test123",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "brand",
      utm_content: "ad-1",
      utm_term: "hal",
      landed_at: "2026-05-28T10:00:00.000Z",
      first_path: "/tr/canli-hal-fiyatlari?gclid=test123&utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_content=ad-1&utm_term=hal",
    });
  });

  it("keeps the original first-touch attribution on later page views", () => {
    window.localStorage.setItem("hf_cookie_consent", "accepted");
    captureAttribution();

    window.history.replaceState(null, "", "/tr/fiyatlar?gclid=later&utm_source=bing&utm_medium=cpc");
    captureAttribution();

    expect(getAttribution()).toMatchObject({
      gclid: "test123",
      utm_source: "google",
      first_path: "/tr/canli-hal-fiyatlari?gclid=test123&utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_content=ad-1&utm_term=hal",
    });
  });

  it("sends conversion events with persisted attribution parameters", () => {
    window.localStorage.setItem("hf_cookie_consent", "accepted");
    captureAttribution();

    trackConversion("newsletter_signup", { method: "live_prices_landing" });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "newsletter_signup",
      expect.objectContaining({
        currency: "TRY",
        event_category: "conversion",
        event_label: "live_prices_landing",
        value: 30,
        method: "live_prices_landing",
        gclid: "test123",
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "brand",
        utm_content: "ad-1",
        utm_term: "hal",
        first_path: "/tr/canli-hal-fiyatlari?gclid=test123&utm_source=google&utm_medium=cpc&utm_campaign=brand&utm_content=ad-1&utm_term=hal",
      }),
    );
  });

  it("supports all Google Ads conversion event names", () => {
    const events: ConversionEventName[] = [
      "newsletter_signup",
      "price_alert_created",
      "pro_inquiry",
      "urun_favorited",
    ];

    for (const eventName of events) {
      trackConversion(eventName, { method: "contract_test" });
    }

    for (const eventName of events) {
      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        eventName,
        expect.objectContaining({
          currency: "TRY",
          event_label: "contract_test",
          method: "contract_test",
        }),
      );
    }
  });

  it("attaches SHA-256 hashed email for enhanced conversions", async () => {
    window.localStorage.setItem("hf_cookie_consent", "accepted");
    captureAttribution();

    trackConversion("newsletter_signup", { method: "newsletter_cta" }, { email: " USER@Example.COM " });
    await vi.waitFor(() => expect(window.gtag).toHaveBeenCalled());

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "newsletter_signup",
      expect.objectContaining({
        method: "newsletter_cta",
        event_label: "newsletter_cta",
        user_data: {
          email_address: "b4c9a289323b21a01c3e940f150eb9b8c542587f1abfd8f0e1cc1ffc5e475514",
        },
      }),
    );
  });
});
