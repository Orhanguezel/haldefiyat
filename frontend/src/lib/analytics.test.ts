import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureAttribution, getAttribution } from "@/lib/attribution";
import { type ConversionEventName, trackConversion, trackDiscoveryEvent } from "@/lib/analytics";

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
      "call_request_view",
      "call_request_submit",
      "call_request_accepted",
      "call_request_declined",
      "call_request_cancelled",
      "call_request_completed",
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

  it("tracks call requests without contact or free-text PII", () => {
    trackConversion("call_request_submit", { listing_id: 7, preferred_slot: "morning" });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "call_request_submit",
      expect.objectContaining({ listing_id: 7, preferred_slot: "morning", value: 45 }),
    );
    const payload = (window.gtag as ReturnType<typeof vi.fn>).mock.calls[0]?.[2];
    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("note");
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

  it("tracks the search funnel without query text or PII", () => {
    trackDiscoveryEvent("search_submitted", {
      query_length: 17,
      product_results: 3,
      market_results: 2,
      result_count: 5,
      zero_results: false,
      item_slug: "orhan@example.com",
    });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "search_submitted",
      expect.objectContaining({
        event_category: "product_discovery",
        query_length: 17,
        product_results: 3,
        market_results: 2,
        result_count: 5,
        zero_results: false,
      }),
    );
    const payload = (window.gtag as ReturnType<typeof vi.fn>).mock.calls[0]?.[2];
    expect(payload).not.toHaveProperty("query");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("item_slug");
  });

  it("tracks price filters without sending the typed query", () => {
    trackDiscoveryEvent("price_filter_changed", {
      filter_name: "query",
      filter_value: "7_chars",
      query_length: 7,
      active_filter_count: 2,
      result_count: 12,
    });

    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "price_filter_changed",
      expect.objectContaining({
        event_category: "product_discovery",
        filter_name: "query",
        filter_value: "7_chars",
        query_length: 7,
        active_filter_count: 2,
        result_count: 12,
      }),
    );
    const payload = (window.gtag as ReturnType<typeof vi.fn>).mock.calls[0]?.[2];
    expect(JSON.stringify(payload)).not.toContain("domates");
  });

  it("drops PII-looking filter values", () => {
    trackDiscoveryEvent("price_filter_zero_results", {
      filter_name: "query",
      filter_value: "orhan@example.com",
      query_length: 17,
      result_count: 0,
      zero_results: true,
    });

    const payload = (window.gtag as ReturnType<typeof vi.fn>).mock.calls[0]?.[2];
    expect(payload).not.toHaveProperty("filter_value");
    expect(payload).toMatchObject({ query_length: 17, result_count: 0, zero_results: true });
  });
});
