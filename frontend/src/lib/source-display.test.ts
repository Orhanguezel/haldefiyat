import { describe, expect, it } from "vitest";
import { sourceCompactLabel, sourceDisplayName, sourceTypeLabel } from "./source-display";

describe("sourceDisplayName", () => {
  it("prefers a public source name", () => {
    expect(sourceDisplayName("İzmir Büyükşehir Belediyesi", "izmir_sebzemeyve"))
      .toBe("İzmir Büyükşehir Belediyesi");
  });

  it("never exposes a raw source key as its label", () => {
    expect(sourceDisplayName("ibb_istanbul_aquaculture", "ibb_istanbul_aquaculture"))
      .toBe("İBB Açık Veri");
    expect(sourceDisplayName(null, "unknown_private_adapter"))
      .toBe("Resmî fiyat kaynağı");
  });
});

describe("sourceCompactLabel", () => {
  it("uses a compact public table label without exposing adapters", () => {
    expect(sourceCompactLabel("Bursa Büyükşehir Belediyesi Hali", "bursa_resmi"))
      .toBe("Bursa");
    expect(sourceCompactLabel("Ankara Ticaret Borsası Günlük Fiyatları", "tobb_borsa_ankara"))
      .toBe("Ankara Ticaret Borsası");
  });
});

describe("sourceTypeLabel", () => {
  it("uses a Turkish public label instead of a technical enum", () => {
    expect(sourceTypeLabel("exchange")).toBe("Ticaret borsası");
    expect(sourceTypeLabel("unknown")).toBe("Doğrulanabilir veri kaynağı");
  });
});
