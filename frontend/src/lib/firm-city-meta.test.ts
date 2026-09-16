import { describe, expect, it } from "vitest";
import { firmCityDescription, firmCityPriceLine, firmCityTitle } from "./firm-city-meta";
import { TITLE_MAX } from "./meta-title";

describe("firmCityTitle", () => {
  it("telefon kelimesini her zaman tasir", () => {
    for (const [city, total] of [["Sivas", 6], ["Mersin", 237], ["Kahramanmaraş", 240], ["Afyonkarahisar", 9]] as const) {
      expect(firmCityTitle(city, total, 2026)).toContain("Telefon");
    }
  });

  it("60 karakteri asmaz ve kirpma isareti birakmaz", () => {
    for (const [city, total] of [["Osmaniye", 11], ["Kahramanmaraş", 240], ["Afyonkarahisar", 9], ["İstanbul", 1234]] as const) {
      const title = firmCityTitle(city, total, 2026);
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
      expect(title).not.toContain("…");
    }
  });

  it("uzun sehir adinda yili feda eder, kimligi korur", () => {
    const title = firmCityTitle("Kahramanmaraş", 240, 2026);
    expect(title).toBe("Kahramanmaraş Hal Komisyoncuları — 240 Firma Telefon & Adres");
  });
});

describe("firmCityPriceLine", () => {
  it("gercek fiyat varsa tarih + ornek fiyat kurar", () => {
    const line = firmCityPriceLine("Adana", [
      { productName: "Limon", avgPrice: 32.5, unit: "kg", recordedDate: "2026-09-16" },
      { productName: "Domates", avgPrice: "18", unit: "kg", recordedDate: "2026-09-16" },
    ]);
    expect(line).toBe("Adana hali 16 Eylül 2026: Limon 32,50 TL/kg, Domates 18,00 TL/kg.");
  });

  it("fiyat yoksa bos doner — sayfa tutamayacagi soz vermez", () => {
    expect(firmCityPriceLine("Sivas", [])).toBe("");
  });

  it("fiyati sifir/eksik satirlari saymaz", () => {
    expect(firmCityPriceLine("Niğde", [{ productName: "Patates", avgPrice: 0, unit: "kg", recordedDate: "2026-09-16" }])).toBe("");
  });

  it("tarih okunamiyorsa fiyat cumlesi kurulmaz", () => {
    expect(firmCityPriceLine("Konya", [{ productName: "Soğan", avgPrice: 25, unit: "kg", recordedDate: null }])).toBe("");
  });
});

describe("firmCityDescription", () => {
  it("hal verisi olmayan sehirde fiyat vaat etmez", () => {
    const description = firmCityDescription("Sivas", 6, "");
    expect(description).not.toMatch(/fiyat/i);
    expect(description).toContain("telefon numarası");
  });

  it("hal verisi olan sehirde somut fiyati tasir", () => {
    const description = firmCityDescription("Adana", 89, "Adana hali 16 Eylül 2026: Limon 32,50 TL/kg.");
    expect(description).toContain("Limon 32,50 TL/kg");
  });
});
