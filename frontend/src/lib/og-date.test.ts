import { describe, expect, it } from "vitest";
import { formatOgDate } from "./og-date";

describe("formatOgDate", () => {
  it("formats a real ISO data date in Turkish", () => {
    expect(formatOgDate("2026-07-26")).toBe("26 Temmuz 2026");
    expect(formatOgDate("2026-07-26T08:15:00Z")).toBe("26 Temmuz 2026");
  });

  it("returns null instead of inventing or normalizing a date", () => {
    expect(formatOgDate()).toBeNull();
    expect(formatOgDate("2026-02-31")).toBeNull();
    expect(formatOgDate("not-a-date")).toBeNull();
  });
});
