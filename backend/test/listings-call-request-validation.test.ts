import { describe, expect, it } from "vitest";
import { callRequestSchema, callRequestStatusSchema } from "../src/modules/listings/validation";

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
});
