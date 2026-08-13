import { describe, expect, it } from "vitest";
import { plausibleRetailPrices } from "./retail-price-guard";

const row = (price: string) => ({ chainSlug: "migros", price, unit: "kg", recordedDate: "2026-08-13" });

describe("plausibleRetailPrices", () => {
  it("keeps a retail value inside the documented markup range", () => {
    expect(plausibleRetailPrices([row("90")], 40)).toEqual([
      expect.objectContaining({ numericPrice: 90, markupPct: 125 }),
    ]);
  });

  it("blocks the 546 TL tomato class of derived anomalies", () => {
    expect(plausibleRetailPrices([row("546.21")], 36.3)).toEqual([]);
  });

  it("blocks invalid inputs or a missing wholesale baseline", () => {
    expect(plausibleRetailPrices([row("NaN"), row("0")], 40)).toEqual([]);
    expect(plausibleRetailPrices([row("90")], 0)).toEqual([]);
  });
});
