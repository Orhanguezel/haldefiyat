import { describe, expect, it } from "vitest";
import { calculateProductMovers } from "./citability";

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

  it("uses the canonical product slug for generated mover links", () => {
    const result = calculateProductMovers([
      {
        productSlug: "biber-kapya",
        canonicalProduct: "kapya-biber",
        productName: "Biber Kapya",
        recordedDate: "2026-07-26",
        avgPrice: 60,
      },
      {
        productSlug: "biber-kapya",
        canonicalProduct: "kapya-biber",
        productName: "Biber Kapya",
        recordedDate: "2026-07-25",
        avgPrice: 50,
      },
    ]);

    expect(result[0]?.productSlug).toBe("kapya-biber");
  });
});
