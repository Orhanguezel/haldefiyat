import { describe, expect, it } from "vitest";
import { hasContactPrivacyConsent } from "../src/modules/contact-consent";

describe("contact privacy consent", () => {
  it("accepts only an explicit boolean true", () => {
    expect(hasContactPrivacyConsent({ privacyAccepted: true })).toBe(true);
    expect(hasContactPrivacyConsent({ privacyAccepted: "true" })).toBe(false);
    expect(hasContactPrivacyConsent({ privacyAccepted: false })).toBe(false);
    expect(hasContactPrivacyConsent({})).toBe(false);
    expect(hasContactPrivacyConsent(null)).toBe(false);
  });
});
