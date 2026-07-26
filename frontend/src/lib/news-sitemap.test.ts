import { describe, expect, it } from "vitest";
import { isRecentNewsDate } from "./news-sitemap";

const NOW = new Date("2026-07-26T10:00:00Z");

describe("isRecentNewsDate", () => {
  it("accepts today and the preceding 48-hour publication window", () => {
    expect(isRecentNewsDate("2026-07-26", NOW)).toBe(true);
    expect(isRecentNewsDate("2026-07-24", NOW)).toBe(true);
  });

  it("rejects future calendar dates", () => {
    expect(isRecentNewsDate("2026-07-27", NOW)).toBe(false);
  });

  it("rejects expired and invalid dates", () => {
    expect(isRecentNewsDate("2026-07-23", NOW)).toBe(false);
    expect(isRecentNewsDate("2026-02-31", NOW)).toBe(false);
    expect(isRecentNewsDate("26-07-2026", NOW)).toBe(false);
  });
});
