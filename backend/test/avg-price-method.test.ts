import { describe, expect, it } from "vitest";
import { inferAvgPriceMethod } from "../src/modules/prices/avg-price-method";

describe("inferAvgPriceMethod", () => {
  it("classifies an exact min-max midpoint as derived", () => {
    expect(inferAvgPriceMethod({ minPrice: "10", maxPrice: "20", avgPrice: "15" })).toBe("midpoint");
  });

  it("accepts a midpoint rounded to the stored two-decimal precision", () => {
    expect(inferAvgPriceMethod({ minPrice: "10.00", maxPrice: "20.01", avgPrice: "15.01" })).toBe("midpoint");
  });

  it("classifies a non-midpoint source average as reported", () => {
    expect(inferAvgPriceMethod({ minPrice: 10, maxPrice: 20, avgPrice: 17 })).toBe("reported");
  });

  it("treats an average without a range as reported", () => {
    expect(inferAvgPriceMethod({ avgPrice: "24.50", minPrice: null, maxPrice: null })).toBe("reported");
  });

  it("preserves an explicit producer classification", () => {
    expect(inferAvgPriceMethod({ minPrice: 10, maxPrice: 20, avgPrice: 15, method: "reported" })).toBe("reported");
  });
});
