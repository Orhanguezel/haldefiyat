import { describe, expect, it } from "bun:test";
import { assessPriceQuality } from "../../src/modules/etl/price-quality-guard";

describe("price quality guard", () => {
  it("quarantines the 546 TL tomato median anomaly", () => {
    const result = assessPriceQuality({ avg: 546, min: 500, max: 592, unit: "kg", categorySlug: "sebze", peerPrices: [34, 35, 36, 37, 38, 39] });
    expect(result.publish).toBeFalse();
    expect(result.reason).toBe("PEER_MEDIAN_DEVIATION");
  });

  it("keeps legitimate high olive prices close to peers", () => {
    expect(assessPriceQuality({ avg: 350, min: 300, max: 400, unit: "kg", peerPrices: [250, 280, 300, 320, 340, 360] }).publish).toBeTrue();
  });

  it("uses a separate package ceiling and rejects broken ranges", () => {
    expect(assessPriceQuality({ avg: 2_400, min: 2_000, max: 2_800, unit: "koli" }).publish).toBeTrue();
    expect(assessPriceQuality({ avg: 80, min: 100, max: 60, unit: "kg" }).reason).toBe("MIN_GREATER_THAN_MAX");
  });

  it("does not infer an anomaly from an undersized peer sample", () => {
    expect(assessPriceQuality({ avg: 500, unit: "kg", peerPrices: [30, 35, 40] }).publish).toBeTrue();
  });
});
