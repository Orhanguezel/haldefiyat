import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchPrices = vi.fn();
vi.mock("@/lib/api", () => ({ fetchPrices: (...args: unknown[]) => fetchPrices(...args) }));

const { fetchProductPriceSummary, formatAveragePrice } = await import("./product-price-summary");

const row = (over: Record<string, unknown> = {}) => ({
  recordedDate: "2026-09-16", avgPrice: 40, unit: "kg", cityName: "Adana", marketSlug: "adana-hal", ...over,
});

beforeEach(() => fetchPrices.mockReset());

describe("fetchProductPriceSummary", () => {
  it("yalniz EN SON gunun satirlarini ortalar", async () => {
    fetchPrices.mockResolvedValue([
      row({ avgPrice: 40 }),
      row({ avgPrice: 50, cityName: "Bursa", marketSlug: "bursa-hal" }),
      row({ recordedDate: "2026-09-10", avgPrice: 200, cityName: "İzmir", marketSlug: "izmir-hal" }),
    ]);
    const summary = await fetchProductPriceSummary("limon");

    expect(summary.avg).toBe(45);
    expect(summary.dateTr).toBe("16 Eylül 2026");
    expect(summary.marketCount).toBe(2);
  });

  it("ulusal ortalama satirini SEHIR saymaz ama hal sayisina katar", async () => {
    fetchPrices.mockResolvedValue([
      row({ cityName: "Türkiye", marketSlug: "turkiye-ulusal" }),
      row({ cityName: "Adana" }),
    ]);
    const summary = await fetchProductPriceSummary("limon");

    expect(summary.cities).toEqual(["Adana"]);
    expect(summary.marketCount).toBe(2);
  });

  it("veri yoksa sayi uydurmaz", async () => {
    fetchPrices.mockResolvedValue([]);
    expect((await fetchProductPriceSummary("limon")).avg).toBeNull();
  });

  it("sifir/negatif fiyatlari ortalamaya katmaz", async () => {
    fetchPrices.mockResolvedValue([row({ avgPrice: 0 }), row({ avgPrice: 60, marketSlug: "bursa-hal" })]);
    expect((await fetchProductPriceSummary("limon")).avg).toBe(60);
  });

  it("beklenmedik yanit sekli cokertmez", async () => {
    // Uc tarafta hata olustugunda (veya sema degistiginde) sayfa patlamamali;
    // fonksiyon sayi uydurmadan bos donmeli.
    fetchPrices.mockResolvedValue([{ recordedDate: "2026-09-16", avgPrice: "bozuk", unit: null, cityName: null, marketSlug: null }]);
    const summary = await fetchProductPriceSummary("limon");

    expect(summary.avg).toBeNull();
    expect(summary.cities).toEqual([]);
  });
});

describe("formatAveragePrice", () => {
  it("TL/birim olarak yazar", () => {
    expect(formatAveragePrice({ avg: 42.333, unit: "kg", dateTr: "", cities: [], marketCount: 0 })).toBe("42,33 TL/kg");
  });

  it("fiyat yoksa bos doner — cagiran taraf soz vermesin", () => {
    expect(formatAveragePrice({ avg: null, unit: "kg", dateTr: "", cities: [], marketCount: 0 })).toBe("");
  });
});
