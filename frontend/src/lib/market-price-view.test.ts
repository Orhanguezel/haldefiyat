import { describe, expect, it } from "vitest";
import type { PriceRow } from "@/lib/api";
import { latestMarketRows, rankCurrentMarketRows } from "./market-price-view";

function row(id: number, recordedDate: string): PriceRow {
  return {
    id,
    productSlug: `urun-${id}`,
    productName: `Ürün ${id}`,
    categorySlug: "sebze",
    marketSlug: "test-hal",
    marketName: "Test Hali",
    cityName: "Test",
    minPrice: "1",
    maxPrice: "2",
    avgPrice: "1.5",
    currency: "TRY",
    unit: "kg",
    recordedDate,
    sourceApi: "test",
  };
}

describe("latestMarketRows", () => {
  it("keeps every row from the latest real publication date", () => {
    expect(latestMarketRows([
      row(1, "2026-09-20"),
      row(2, "2026-09-21T00:00:00.000Z"),
      row(3, "2026-09-21"),
    ]).map((item) => item.id)).toEqual([2, 3]);
  });

  it("does not promote an older product into the current table", () => {
    expect(latestMarketRows([row(1, "2026-06-22"), row(2, "2026-06-21")]))
      .toEqual([row(1, "2026-06-22")]);
  });

  it("returns an empty list for an empty source", () => {
    expect(latestMarketRows([])).toEqual([]);
  });

  it("ranks only available current rows by catalog search demand", () => {
    expect(rankCurrentMarketRows(
      [row(1, "2026-09-21"), row(2, "2026-09-21"), row(3, "2026-09-21")],
      [
        { id: 1, slug: "urun-1", nameTr: "Ürün 1", categorySlug: "sebze", unit: "kg", searchVolume: 10 },
        { id: 2, slug: "urun-2", nameTr: "Ürün 2", categorySlug: "sebze", unit: "kg", searchVolume: 100 },
        { id: 3, slug: "urun-3", nameTr: "Ürün 3", categorySlug: "sebze", unit: "kg", searchVolume: 50 },
      ],
    ).map((item) => item.id)).toEqual([2, 3, 1]);
  });
});
