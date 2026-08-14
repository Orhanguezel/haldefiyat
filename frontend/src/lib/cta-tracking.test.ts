import { afterEach, describe, expect, it, vi } from "vitest";
import { trackProductJourney } from "./cta-tracking";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("product journey tracking", () => {
  it("does not write a first-party event before analytics consent", () => {
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: beacon });
    trackProductJourney("opened");
    expect(beacon).not.toHaveBeenCalled();
  });

  it("sends only the controlled event, path and device after consent", () => {
    window.localStorage.setItem("hf_cookie_consent", "accepted");
    const beacon = vi.fn().mockReturnValue(true);
    Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: beacon });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });

    trackProductJourney("selected");

    expect(beacon).toHaveBeenCalledTimes(1);
    const [url, body] = beacon.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/v1\/track\/cta$/);
    expect(body).toBeInstanceOf(Blob);
  });
});
