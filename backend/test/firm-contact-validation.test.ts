import { describe, expect, it } from "vitest";
import { claimBodySchema, publicLeadBodySchema } from "../src/modules/firms/validation";

describe("firm contact validation", () => {
  const validLead = {
    name: "Ayşe Üretici",
    phone: "+905321234567",
    preferredChannel: "phone",
    message: "Ürün tedariği hakkında görüşmek istiyorum.",
    privacyConsent: true,
  };

  it("requires explicit privacy consent and a usable contact channel", () => {
    expect(publicLeadBodySchema.safeParse(validLead).success).toBe(true);
    expect(publicLeadBodySchema.safeParse({ ...validLead, privacyConsent: false }).success).toBe(false);
    expect(publicLeadBodySchema.safeParse({ ...validLead, phone: undefined }).success).toBe(false);
  });

  it("binds the preferred response channel to the supplied contact", () => {
    expect(publicLeadBodySchema.safeParse({
      ...validLead,
      phone: undefined,
      email: "alici@example.com",
      preferredChannel: "email",
    }).success).toBe(true);
    expect(publicLeadBodySchema.safeParse({ ...validLead, preferredChannel: "email" }).success).toBe(false);
  });

  it("requires authority and privacy declarations for profile claims", () => {
    expect(claimBodySchema.safeParse({ authorityConfirmed: true, privacyConsent: true }).success).toBe(true);
    expect(claimBodySchema.safeParse({ authorityConfirmed: true }).success).toBe(false);
    expect(claimBodySchema.safeParse({ privacyConsent: true }).success).toBe(false);
  });
});
