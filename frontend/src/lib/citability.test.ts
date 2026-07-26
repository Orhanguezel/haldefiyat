import { describe, expect, it } from "vitest";
import { calculateProductMovers, calculateWindowTrend } from "./citability";

describe("calculateWindowTrend", () => {
  it("compares daily means across consecutive windows", () => {
    const rows = [
      { recordedDate: "2026-07-04", avgPrice: 20 },
      { recordedDate: "2026-07-04", avgPrice: 40 },
      { recordedDate: "2026-07-03", avgPrice: 30 },
      { recordedDate: "2026-07-02", avgPrice: 10 },
      { recordedDate: "2026-07-01", avgPrice: 10 },
    ];

    expect(calculateWindowTrend(rows, 2)).toEqual({
      periodDays: 2,
      changePct: 200,
      direction: "yükseliş",
    });
  });

  it("ignores invalid rows and requires two complete windows", () => {
    expect(calculateWindowTrend([
      { recordedDate: "invalid", avgPrice: 20 },
      { recordedDate: "2026-07-04", avgPrice: 0 },
      { recordedDate: "2026-07-03", avgPrice: "x" },
    ], 1)).toBeNull();
  });

  it("labels an unchanged series as flat", () => {
    expect(calculateWindowTrend([
      { recordedDate: "2026-07-04", avgPrice: 10 },
      { recordedDate: "2026-07-03", avgPrice: 10 },
    ], 1)?.direction).toBe("yatay");
  });
});

describe("calculateProductMovers", () => {
  it("returns the largest product changes between their latest two days", () => {
    const rows = [
      { productSlug: "limon", productName: "Limon", recordedDate: "2026-07-04", avgPrice: 30 },
      { productSlug: "limon", productName: "Limon", recordedDate: "2026-07-03", avgPrice: 20 },
      { productSlug: "elma", productName: "Elma", recordedDate: "2026-07-04", avgPrice: 9 },
      { productSlug: "elma", productName: "Elma", recordedDate: "2026-07-03", avgPrice: 10 },
    ];

    expect(calculateProductMovers(rows, 2)).toEqual([
      { productSlug: "limon", productName: "Limon", changePct: 50, direction: "yükseldi" },
      { productSlug: "elma", productName: "Elma", changePct: -10, direction: "düştü" },
    ]);
  });
});
