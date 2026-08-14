import { describe, expect, it } from "bun:test";
import { CSV_HEADERS, toCsvPayload } from "../src/modules/prices/csv";

describe("price CSV export contract", () => {
  it("includes unit, date, public source and applied-filter metadata", () => {
    const csv = toCsvPayload([
      {
        productName: "Domates",
        categorySlug: "sebze",
        marketName: "İzmir Büyükşehir Belediyesi Hali",
        cityName: "İzmir",
        minPrice: 30,
        maxPrice: 40,
        avgPrice: 35,
        avgPriceMethod: "midpoint",
        unit: "kasa",
        currency: "TRY",
        recordedDate: "2026-08-14",
        sourceApi: "izmir_sebzemeyve",
        sourceName: "İzmir Büyükşehir Belediyesi Hal Fiyatları",
        sourceUrl: "https://www.izmir.bel.tr/hal-fiyatlari",
        sourceType: "hal",
        isOfficialSource: true,
      },
    ], {
      filters: { city: "izmir", category: "sebze", unit: "kasa", range: "30d" },
      exportedAt: "2026-08-14T03:00:00.000Z",
    });

    expect(CSV_HEADERS).toContain("Kaynak Adı");
    expect(CSV_HEADERS).toContain("Uygulanan Filtreler");
    expect(csv.startsWith("\uFEFF")).toBeTrue();
    expect(csv).toContain("Domates,sebze");
    expect(csv).toContain(",kasa,TRY,2026-08-14,");
    expect(csv).toContain("İzmir Büyükşehir Belediyesi Hal Fiyatları");
    expect(csv).toContain("https://www.izmir.bel.tr/hal-fiyatlari,hal,Evet,izmir_sebzemeyve");
    expect(csv).toContain("şehir=izmir; kategori=sebze; birim=kasa; tarih aralığı=30d");
    expect(csv).toContain("2026-08-14T03:00:00.000Z");
  });

  it("keeps metadata columns stable when no optional source fields exist", () => {
    const csv = toCsvPayload([
      {
        productName: "Patates",
        categorySlug: "sebze",
        marketName: "Kaynak Hal",
        cityName: "Ankara",
        minPrice: null,
        maxPrice: null,
        avgPrice: 12,
        avgPriceMethod: "reported",
        unit: "kg",
        currency: "TRY",
        recordedDate: "2026-08-13",
        sourceApi: "manual",
      },
    ], { exportedAt: "2026-08-14T03:00:00.000Z" });

    expect(csv).toContain("Resmî fiyat kaynağı,,,Hayır,manual,Filtre yok");
  });
});
