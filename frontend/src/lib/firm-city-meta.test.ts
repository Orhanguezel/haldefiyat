import { describe, expect, it } from "vitest";
import { firmCityDescription, firmCityTitle } from "./firm-city-meta";
import { TITLE_MAX } from "./meta-title";

const TODAY = new Date("2026-09-16T12:00:00Z");

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
    expect(firmCityTitle("Kahramanmaraş", 240, 2026)).toBe("Kahramanmaraş Hal Komisyoncuları — 240 Firma Telefon & Adres");
  });
});

describe("firmCityDescription", () => {
  const fresh = [
    { productName: "Patates", avgPrice: 25, unit: "kg", recordedDate: "2026-09-16" },
    { productName: "Kiraz", avgPrice: 140, unit: "kg", recordedDate: "2026-09-16" },
    { productName: "Erik", avgPrice: 42.5, unit: "kg", recordedDate: "2026-09-16" },
  ];

  it("hal verisi olmayan sehirde fiyat vaat etmez", () => {
    const description = firmCityDescription("Sivas", 6, [], TODAY);
    expect(description).not.toMatch(/fiyat/i);
    expect(description).toContain("telefon numarası");
  });

  it("taze veri varsa somut fiyati tasir", () => {
    const description = firmCityDescription("Adana", 89, fresh, TODAY);
    expect(description).toContain("Adana hali 16 Eylül 2026:");
    expect(description).toContain("Patates 25,00 TL/kg");
  });

  it("bayat veriyi bugunun listesi gibi gostermez", () => {
    // Mersin kaynagi Altosec WAF nedeniyle kapali; canlida 22 Haziran verisi vardi.
    const stale = fresh.map((price) => ({ ...price, recordedDate: "2026-06-22" }));
    const description = firmCityDescription("Mersin", 240, stale, TODAY);
    expect(description).not.toContain("22 Haziran");
    expect(description).toContain("telefon numarası");
  });

  it("160 karakteri asmaz ve yarim fiyatla bitmez", () => {
    for (const city of ["Adana", "Kahramanmaraş", "Afyonkarahisar"]) {
      const description = firmCityDescription(city, 89, fresh, TODAY);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(description.endsWith(".")).toBe(true);
      expect(description).not.toContain("…");
    }
  });

  it("butceye sigmayan ornegi hic yazmaz", () => {
    const description = firmCityDescription("Kahramanmaraş", 11, fresh, TODAY);
    // Ilk ornek siger, sonrakiler icin yer kalmaz — yarim yazilmaz.
    expect(description).toContain("Patates 25,00 TL/kg");
    expect(description).not.toMatch(/Erik 42,5[^0]/);
  });

  it("fiyati sifir/eksik satirlari saymaz", () => {
    const description = firmCityDescription("Niğde", 7, [{ productName: "Patates", avgPrice: 0, unit: "kg", recordedDate: "2026-09-16" }], TODAY);
    expect(description).toContain("telefon numarası");
  });
});
