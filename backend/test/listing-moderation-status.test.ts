import { describe, expect, it } from "vitest";
import { moderateSchema } from "../src/modules/listings/validation";

describe("listing moderation status", () => {
  it("allows an approved listing to be returned to the pending queue", () => {
    expect(moderateSchema.parse({ status: "pending" })).toEqual({ status: "pending" });
  });

  it("still rejects non-moderation lifecycle states", () => {
    expect(() => moderateSchema.parse({ status: "closed" })).toThrow();
  });
});
