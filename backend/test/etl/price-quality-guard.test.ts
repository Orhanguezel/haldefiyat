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

/**
 * 2026-09-02: uretim bolgesi halleri her gun karantinaya dusuyordu. Demre salkim
 * domatesi 33 gunluk gecmiste akran ortalamasinin %15,6'si; karantinaya dusen
 * degerlerin orani da %13-15 idi — yani hicbir sey degismemisti. Sinyal "farkli
 * olmak" degil, "orani kaydirmak".
 */
describe("alisilmis akran konumu", () => {
  const demre = {
    avg: 6, min: 6, max: 6, unit: "kg", expectedUnit: "kg", categorySlug: "sebze",
    sourcePeerPrices: [38, 40, 42, 44, 45],
  };

  it("kalici ucuz hal, alisilmis oraninda kalirsa yayinlanir", () => {
    const d = assessPriceQuality({ ...demre, habitualPeerRatio: 0.156 });
    expect(d.publish).toBe(true);
    expect(d.reason).toBeNull();
  });

  it("gecmis oran bilinmiyorsa eski davranis korunur (karantina)", () => {
    const d = assessPriceQuality(demre);
    expect(d.publish).toBe(false);
    expect(d.reason).toBe("SOURCE_MEDIAN_DEVIATION");
  });

  it("esigin ICINDE yasayan hal disari cikarsa yakalanir", () => {
    // Bursa bezelyesi alisilmis olarak akranlarin %46,6'si (esik %25'in USTUNDE,
    // yani kronik olarak isaretlenen bir hal degil). %25'e dusmesi gercek kaymadir.
    const d = assessPriceQuality({
      avg: 10, min: 10, max: 10, unit: "kg", expectedUnit: "kg", categorySlug: "sebze",
      sourcePeerPrices: [38, 40, 41, 42, 43],
      habitualPeerRatio: 0.466,
    });
    expect(d.publish).toBe(false);
    expect(d.reason).toBe("SOURCE_MEDIAN_DEVIATION");
  });

  it("alisilmis orandan kopan deger yine yakalanir", () => {
    // Hep akranlarin %15'i olan hal birden %90'ina cikarsa bu GERCEK bir kayma.
    const d = assessPriceQuality({
      ...demre, avg: 300, min: 300, max: 300, habitualPeerRatio: 0.156,
    });
    expect(d.publish).toBe(false);
    expect(d.reason).toBe("SOURCE_MEDIAN_DEVIATION");
  });

  it("alisilmis oran birim uyusmazligini ortmez", () => {
    const d = assessPriceQuality({ ...demre, unit: "koli", habitualPeerRatio: 0.156 });
    expect(d.publish).toBe(false);
    expect(d.reason).toBe("PRODUCT_UNIT_MISMATCH");
  });
});
