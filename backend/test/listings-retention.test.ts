import { describe, expect, it } from "vitest";
import {
  CALL_REQUEST_RETENTION_DAYS,
  OTP_AFTER_EXPIRY_RETENTION_DAYS,
  listingPrivacyRetentionCutoffs,
} from "../src/modules/listings/retention-policy";

describe("listing privacy retention", () => {
  it("keeps resolved call requests for 90 days and expired OTP rows for one day", () => {
    const now = new Date("2026-08-14T12:00:00.000Z");
    const cutoffs = listingPrivacyRetentionCutoffs(now);
    expect(CALL_REQUEST_RETENTION_DAYS).toBe(90);
    expect(OTP_AFTER_EXPIRY_RETENTION_DAYS).toBe(1);
    expect(cutoffs.callRequests.toISOString()).toBe("2026-05-16T12:00:00.000Z");
    expect(cutoffs.otp.toISOString()).toBe("2026-08-13T12:00:00.000Z");
  });
});
