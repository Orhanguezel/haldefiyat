import { describe, expect, it } from "bun:test";
import { normalizeBlackoutDate } from "../src/modules/prices/blackout-date";

describe("blackout date normalization", () => {
  it("keeps ISO date strings", () => {
    expect(normalizeBlackoutDate("2023-04-21")).toBe("2023-04-21");
  });

  it("normalizes MySQL Date objects without losing the year", () => {
    expect(normalizeBlackoutDate(new Date("2026-04-24T00:00:00.000Z"))).toBe("2026-04-24");
  });

  it("fails closed on an invalid database value", () => {
    expect(() => normalizeBlackoutDate("not-a-date")).toThrow("Gecersiz blackout tarihi");
  });
});
