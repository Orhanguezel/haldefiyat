import { describe, expect, it } from "vitest";
import { latestSitemapDate, validSitemapDate } from "./sitemap-date";

const NOW = new Date("2026-07-26T10:00:00Z");

describe("sitemap dates", () => {
  it("accepts valid dates up to the current UTC day", () => {
    expect(validSitemapDate("2026-07-26", NOW)?.toISOString().slice(0, 10)).toBe("2026-07-26");
    expect(validSitemapDate("2026-07-25T18:30:00Z", NOW)?.toISOString()).toBe("2026-07-25T18:30:00.000Z");
  });

  it("rejects future, normalized-invalid and malformed dates", () => {
    expect(validSitemapDate("2026-07-27", NOW)).toBeUndefined();
    expect(validSitemapDate("2026-02-31", NOW)).toBeUndefined();
    expect(validSitemapDate("not-a-date", NOW)).toBeUndefined();
  });

  it("returns the latest valid non-future value", () => {
    expect(latestSitemapDate(
      ["2026-07-20", "2026-07-25", "2026-08-01", "invalid"],
      NOW,
    )?.toISOString().slice(0, 10)).toBe("2026-07-25");
  });
});
