import { describe, expect, it } from "vitest";
import { categoryDescription, categoryTitle, type CategoryHeadline } from "./category-price-meta";
import { TITLE_MAX } from "./meta-title";

const headline: CategoryHeadline = {
  productName: "Dana Karkas", priceTr: "684,05", unit: "kg", dateTr: "15 Eylül 2026", rowCount: 10,
};

describe("categoryTitle", () => {
  it("veri varsa tarih ve rakami basliga koyar", () => {
    const t = categoryTitle("Et Fiyatları", headline);
    expect(t).toContain("15 Eylül 2026");
    expect(t).toContain("684,05 TL/kg");
    expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("veri yoksa sabit basligi aynen birakir — sayi uydurmaz", () => {
    expect(categoryTitle("Et Fiyatları", null)).toBe("Et Fiyatları");
  });

  it("uzun temel baslikta once tarih feda edilir, rakam kalir", () => {
    const t = categoryTitle("Canlı Hayvan Fiyatları — Dana, Kuzu, Koyun", headline);
    expect(t.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(t).not.toContain("…");
    expect(t).toContain("Canlı Hayvan Fiyatları");
  });
});

describe("categoryDescription", () => {
  it("rakamla baslar, sabit metni arkasina sigdigi kadar ekler", () => {
    const d = categoryDescription("Ticaret borsalarından karkas et fiyatları.", headline);
    expect(d.startsWith("15 Eylül 2026: Dana Karkas 684,05 TL/kg")).toBe(true);
    expect(d).toContain("10 güncel kayıt");
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d).not.toContain("…");
  });

  it("veri yoksa sabit aciklamaya doner", () => {
    expect(categoryDescription("Sabit.", null)).toBe("Sabit.");
  });
});
