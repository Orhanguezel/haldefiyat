import { describe, expect, it } from "vitest";
import type { PriceHistoryRow } from "./api";
import { guidesForProduct, latestGuidePrice } from "./product-guides";
const now = new Date("2026-09-14T12:00:00Z");
const row = (avgPrice: number, marketSlug = "istanbul", recordedDate = "2026-09-14", unit = "kg"): PriceHistoryRow => ({ avgPrice, marketSlug, recordedDate, unit, minPrice: null, maxPrice: null, marketName: "Hal", cityName: "Şehir" });
describe("product guides", () => {
  it("connects broad tomato pages to both relevant guides without attaching unrelated products", () => {
    expect(guidesForProduct("domates").map((g) => g.slug)).toEqual(["salca-konserve", "tursu"]);
    expect(guidesForProduct("domates-salcalik").map((g) => g.slug)).toEqual(["salca-konserve"]);
    expect(guidesForProduct("pamuk")).toEqual([]);
  });
  it("compares only the newest day and equally weights markets with multiple varieties", () => {
    expect(latestGuidePrice([row(10), row(30), row(40, "ankara"), row(1000, "izmir", "2026-09-13")], now)).toEqual({ date: "2026-09-14", price: 30, unit: "kg", marketCount: 2 });
  });
  it("does not publish stale, invalid, future or mixed-unit prices", () => {
    expect(latestGuidePrice([row(10, "x", "2026-08-31"), row(20, "x", "2026-09-15"), row(NaN)], now)).toBeNull();
    expect(latestGuidePrice([row(10), row(20, "ankara", "2026-09-14", "adet")], now)).toBeNull();
    expect(latestGuidePrice([], now)).toBeNull();
  });
});
