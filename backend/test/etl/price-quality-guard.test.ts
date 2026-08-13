import { describe, expect, it } from "bun:test";
import { assessPriceQuality } from "../../src/modules/etl/price-quality-guard";

describe("price quality guard", () => {
  it("quarantines the 546 TL tomato median anomaly", () => {
    const result = assessPriceQuality({ avg: 546, min: 500, max: 592, unit: "kg", expectedUnit: "kg", categorySlug: "sebze", peerPrices: [34, 35, 36, 37, 38, 39] });
    expect(result.publish).toBeFalse();
    expect(result.reason).toBe("PEER_MEDIAN_DEVIATION");
  });

  it("keeps legitimate high olive prices close to peers", () => {
    expect(assessPriceQuality({ avg: 350, min: 300, max: 400, unit: "kg", expectedUnit: "kg", peerPrices: [250, 280, 300, 320, 340, 360] }).publish).toBeTrue();
  });

  it("uses a separate package ceiling and rejects broken ranges", () => {
    expect(assessPriceQuality({ avg: 2_400, min: 2_000, max: 2_800, unit: "koli", expectedUnit: "koli" }).publish).toBeTrue();
    expect(assessPriceQuality({ avg: 80, min: 100, max: 60, unit: "kg", expectedUnit: "kg" }).reason).toBe("MIN_GREATER_THAN_MAX");
  });

  it("does not infer an anomaly from an undersized peer sample", () => {
    expect(assessPriceQuality({ avg: 500, unit: "kg", expectedUnit: "kg", peerPrices: [30, 35, 40] }).publish).toBeTrue();
  });

  it("quarantines wrong adet/kg and unknown product units", () => {
    expect(assessPriceQuality({ avg: 30, unit: "kg", expectedUnit: "adet" }).reason).toBe("PRODUCT_UNIT_MISMATCH");
    expect(assessPriceQuality({ avg: 30, unit: "kg", expectedUnit: null }).reason).toBe("UNKNOWN_PRODUCT_UNIT");
  });

  it("labels previous-day, cross-source and stale anomalies separately", () => {
    expect(assessPriceQuality({ avg: 120, unit: "kg", expectedUnit: "kg", previousPrice: 20 }).reason).toBe("PREVIOUS_PRICE_JUMP");
    expect(assessPriceQuality({ avg: 120, unit: "kg", expectedUnit: "kg", sourcePeerPrices: [18, 20, 22, 24] }).reason).toBe("SOURCE_MEDIAN_DEVIATION");
    expect(assessPriceQuality({ avg: 20, unit: "kg", expectedUnit: "kg", sourceRecordAgeDays: 401 }).reason).toBe("STALE_SOURCE_RECORD");
  });
});
