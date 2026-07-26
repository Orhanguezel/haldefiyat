import { describe, expect, it } from "vitest";
import { schemaDateRange } from "./schema-dates";

describe("schemaDateRange", () => {
  it("returns the real bounded date range in chronological order", () => {
    expect(schemaDateRange(["2026-07-26", "2025-01-04", "2026-02-10"])).toEqual({
      earliest: "2025-01-04",
      latest: "2026-07-26",
      temporalCoverage: "2025-01-04/2026-07-26",
    });
  });

  it("uses a single date when the dataset contains one day", () => {
    expect(schemaDateRange(["2026-07-26"])).toEqual({
      earliest: "2026-07-26",
      latest: "2026-07-26",
      temporalCoverage: "2026-07-26",
    });
  });

  it("omits invalid and unknown dates instead of inventing coverage", () => {
    expect(schemaDateRange([null, undefined, "", "2026-02-31", "2026/07/26"])).toBeNull();
  });
});
