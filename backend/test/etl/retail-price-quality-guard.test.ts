import { describe, expect, it } from "bun:test";
import { assessRetailPriceQuality } from "../../src/modules/etl/retail-price-quality-guard";

describe("retail price quality guard", () => {
  it("blocks the 546 TL tomato derivative at the write boundary", () => {
    const result = assessRetailPriceQuality({ price: 546.21, wholesalePeers: [34, 35, 36, 36.3, 37, 38] });
    expect(result.publish).toBeFalse();
    expect(result.reason).toBe("WHOLESALE_MARKUP_LIMIT");
  });
  it("keeps a retail value inside the documented markup range", () => {
    expect(assessRetailPriceQuality({ price: 90, wholesalePeers: [38, 39, 40, 40, 41, 42] }).publish).toBeTrue();
    expect(assessRetailPriceQuality({ price: 149.9, wholesalePeers: [28, 29, 30, 30, 31, 32] }).publish).toBeTrue();
  });
  it("uses retail history when wholesale coverage is unavailable", () => {
    expect(assessRetailPriceQuality({ price: 500, retailPeers: [75, 78, 80, 82, 84, 85] }).reason).toBe("RETAIL_PEER_DEVIATION");
  });
});
