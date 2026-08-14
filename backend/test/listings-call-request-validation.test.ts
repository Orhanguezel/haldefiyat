import { describe, expect, it } from "vitest";
import { callRequestSchema, callRequestStatusSchema, listingCallSettingsSchema } from "../src/modules/listings/validation";
import { hasVerifiedCallRequestIdentity } from "../src/modules/listings/call-request-auth";
import { createOtpIdentityToken, readOtpIdentityToken } from "../src/modules/listings/otp-token";
import {
  assessCallRequestRisk,
  createCallRequestChallenge,
  verifyCallRequestChallenge,
} from "../src/modules/listings/call-request-risk";

describe("listing call request validation", () => {
  it("requires explicit privacy consent", () => {
    expect(callRequestSchema.safeParse({ preferredSlot: "asap" }).success).toBe(false);
    expect(callRequestSchema.safeParse({ preferredSlot: "morning", privacyAccepted: true }).success).toBe(true);
  });

  it("accepts only supported owner and buyer transitions", () => {
    for (const status of ["accepted", "declined", "cancelled", "completed"]) {
      expect(callRequestStatusSchema.safeParse({ status }).success).toBe(true);
    }
    expect(callRequestStatusSchema.safeParse({ status: "notified" }).success).toBe(false);
    expect(callRequestStatusSchema.safeParse({ status: "pending" }).success).toBe(false);
  });

  it("requires a bounded listing contact schedule", () => {
    expect(listingCallSettingsSchema.safeParse({ callRequestsEnabled: true, callAvailability: ["morning", "evening"] }).success).toBe(true);
    expect(listingCallSettingsSchema.safeParse({ callRequestsEnabled: true, callAvailability: [] }).success).toBe(false);
    expect(listingCallSettingsSchema.safeParse({ callRequestsEnabled: true, callAvailability: ["night"] }).success).toBe(false);
  });

  it("requires a verified email account or a valid OTP identity", () => {
    expect(hasVerifiedCallRequestIdentity({ accountVerified: false, otpPhone: null })).toBe(false);
    expect(hasVerifiedCallRequestIdentity({ accountVerified: true, otpPhone: null })).toBe(true);
    expect(hasVerifiedCallRequestIdentity({ accountVerified: false, otpPhone: "+905321234567" })).toBe(true);
  });

  it("accepts a bounded OTP token but rejects oversized input", () => {
    expect(callRequestSchema.safeParse({ preferredSlot: "asap", privacyAccepted: true, otpToken: "a".repeat(32) }).success).toBe(true);
    expect(callRequestSchema.safeParse({ preferredSlot: "asap", privacyAccepted: true, otpToken: "a".repeat(2049) }).success).toBe(false);
  });

  it("binds a signed OTP identity to its user and rejects tampering", () => {
    const now = Date.parse("2026-08-14T00:00:00Z");
    const token = createOtpIdentityToken("+905321234567", "buyer-1", "test-secret", now);
    expect(readOtpIdentityToken(token, "test-secret", now)).toEqual({ phone: "+905321234567", userId: "buyer-1" });
    expect(readOtpIdentityToken(token, "other-secret", now)).toBeNull();
    expect(readOtpIdentityToken(`${token.slice(0, -1)}x`, "test-secret", now)).toBeNull();
    expect(readOtpIdentityToken("not-json.invalid-signature", "test-secret", now)).toBeNull();
    expect(readOtpIdentityToken(token, "test-secret", now + 16 * 60_000)).toBeNull();
  });

  it("only raises an adaptive challenge for suspicious interaction signals", () => {
    expect(assessCallRequestRisk({ formElapsedMs: 4_000, userAgent: "Mozilla/5.0" })).toBeNull();
    expect(assessCallRequestRisk({ formElapsedMs: 200, userAgent: "Mozilla/5.0" })).toBe("too_fast");
    expect(assessCallRequestRisk({ formElapsedMs: 4_000, userAgent: "" })).toBe("missing_user_agent");
    expect(assessCallRequestRisk({ honeypot: "spam.example", formElapsedMs: 4_000, userAgent: "Mozilla/5.0" })).toBe("honeypot");
  });

  it("binds a short-lived risk challenge to the buyer and listing", () => {
    const now = Date.parse("2026-08-14T10:00:00Z");
    const challenge = createCallRequestChallenge("buyer-1", 42, "test-secret", now, [4, 7]);
    const base = { token: challenge.token, answer: "11", userId: "buyer-1", listingId: 42, secret: "test-secret", now };
    expect(challenge.prompt).toBe("4 + 7 kaç eder?");
    expect(verifyCallRequestChallenge(base)).toBe(true);
    expect(verifyCallRequestChallenge({ ...base, answer: "12" })).toBe(false);
    expect(verifyCallRequestChallenge({ ...base, userId: "buyer-2" })).toBe(false);
    expect(verifyCallRequestChallenge({ ...base, listingId: 43 })).toBe(false);
    expect(verifyCallRequestChallenge({ ...base, now: now + 6 * 60_000 })).toBe(false);
    expect(verifyCallRequestChallenge({ ...base, token: `${challenge.token.slice(0, -1)}x` })).toBe(false);
  });
});
