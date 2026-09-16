import { describe, expect, it } from "vitest";
import { piyasaDescription, piyasaTitle, type PiyasaLocalPrice } from "./piyasa-meta";
import { TITLE_MAX } from "./meta-title";
import type { ProductPriceSummary } from "./product-price-summary";

const ADANA = { h1: "Adana Limon Piyasası", productName: "Limon", region: "Adana / Çukurova", fallbackDescription: "Sabit açıklama." };
const ERDEMLI = { h1: "Erdemli Limon Piyasası", productName: "Limon", region: "Mersin / Erdemli", fallbackDescription: "Sabit açıklama." };

const local: PiyasaLocalPrice = {
  dateTr: "16 Eylül 2026", avg: 32.5, min: 15, max: 50, unit: "kg",
  marketName: "Adana Büyükşehir Belediyesi Toptancı Hali",
};
const national: ProductPriceSummary = { avg: 42.33, unit: "kg", dateTr: "17 Eylül 2026", cities: ["Bursa", "İstanbul"], marketCount: 13 };
const noData: ProductPriceSummary = { avg: null, unit: "kg", dateTr: "", cities: [], marketCount: 0 };

describe("piyasaTitle", () => {
  it("yerel kayit varsa tarihi ve fiyat araligini basliga koyar", () => {
    const title = piyasaTitle(ADANA, local, national);
    expect(title).toBe("Adana Limon Piyasası 16 Eylül 2026 — 15,00–50,00 TL/kg");
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("yerel kayit YOKSA yerel fiyat soylemez, Turkiye ortalamasi oldugunu yazar", () => {
    const title = piyasaTitle(ERDEMLI, null, national);
    expect(title).toBe("Erdemli Limon Piyasası — Türkiye Ortalaması 17 Eylül 2026");
    expect(title).toContain("Türkiye Ortalaması");
  });

  it("hicbir veri yoksa sayi uydurmaz", () => {
    const title = piyasaTitle(ERDEMLI, null, noData);
    expect(title).not.toMatch(/\d+,\d{2}/);
    expect(title).toContain("Erdemli Limon Piyasası");
  });

  it("min-maks bozuksa ortalamaya duser, uydurma aralik yazmaz", () => {
    const title = piyasaTitle(ADANA, { ...local, min: 0, max: 0 }, national);
    expect(title).toBe("Adana Limon Piyasası 16 Eylül 2026 — 32,50 TL/kg");
  });

  it("uzun baslikta once aralik, sonra tarih feda edilir; kimlik kalir", () => {
    const uzun = { ...ADANA, h1: "Adana Mayer Limon Piyasası Çukurova" };
    const title = piyasaTitle(uzun, local, national);
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(title).toContain("Adana Mayer Limon Piyasası");
    expect(title).not.toContain("…");
  });
});

describe("piyasaDescription", () => {
  it("yerel kayitta hangi halin kaydi oldugunu soyler", () => {
    const d = piyasaDescription(ADANA, local, national);
    expect(d).toContain("16 Eylül 2026");
    expect(d).toContain("32,50 TL/kg");
    expect(d).toContain("Toptancı Hali");
    expect(d.length).toBeLessThanOrEqual(160);
  });

  it("yerel yoksa 'yerel kayit yok' der ve ulusal sayiyi yerel gibi sunmaz", () => {
    const d = piyasaDescription(ERDEMLI, null, national);
    expect(d).toContain("yerel");
    expect(d).toContain("Türkiye genelinde");
    expect(d).toContain("42,33 TL/kg");
    expect(d.length).toBeLessThanOrEqual(160);
  });

  it("hic veri yoksa config aciklamasina doner", () => {
    expect(piyasaDescription(ERDEMLI, null, noData)).toBe("Sabit açıklama.");
  });
});
