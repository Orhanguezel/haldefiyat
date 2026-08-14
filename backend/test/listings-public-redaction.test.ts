import { describe, expect, it } from "vitest";
import { parseCallAvailability, toPublicListing } from "../src/modules/listings/public";

describe("toPublicListing", () => {
  it("removes owner name together with direct contact fields", () => {
    const result = toPublicListing({
      contactName: "Kişisel İsim",
      contactPhone: "0555 111 22 33",
      raw: { source: "form" },
      title: "Temiz başlık",
    });

    expect(result.contactName).toBeNull();
    expect(result.contactPhone).toBeNull();
    expect(result.raw).toBeNull();
  });

  it("removes structured and raw phone data from public listings", () => {
    const result = toPublicListing({
      id: 7,
      contactPhone: "5413318858",
      raw: { importedPhone: "+90 541 331 88 58" },
      title: "50 Ton Mercimek",
      description: "Detay için 0536 482 81 75 numarasını arayın.",
      quality: null,
      packaging: null,
    });

    expect(result.contactPhone).toBeNull();
    expect(result.raw).toBeNull();
    expect(result.description).toBe("Detay için [telefon gizlendi] numarasını arayın.");
  });

  it("redacts compact and international Turkish mobile numbers in free text", () => {
    const result = toPublicListing({
      contactPhone: null,
      raw: null,
      title: "Ara: 5364828175",
      description: "Diğer hat +90 (541) 331-88-58",
      quality: "Telefon 0541.222.33.44",
      packaging: "25 kg çuval",
    });

    expect(result.title).toBe("Ara: [telefon gizlendi]");
    expect(result.description).toBe("Diğer hat [telefon gizlendi]");
    expect(result.quality).toBe("Telefon [telefon gizlendi]");
    expect(result.packaging).toBe("25 kg çuval");
  });

  it("redacts email addresses from public and call-request free text", () => {
    const result = toPublicListing({
      contactPhone: null,
      raw: null,
      title: "Bilgi: satici@example.com",
      description: "orhan+ilan@example.com adresine yazın",
      quality: null,
      packaging: null,
    });
    expect(result.title).toBe("Bilgi: [e-posta gizlendi]");
    expect(result.description).toBe("[e-posta gizlendi] adresine yazın");
  });

  it("does not redact prices, quantities, dates or non-mobile digit sequences", () => {
    const result = toPublicListing({
      contactPhone: null,
      raw: null,
      title: "50.000 kg ürün",
      description: "Fiyat 7.000 TL, tarih 2026-08-14, kayıt 1234567890",
      quality: null,
      packaging: null,
    });

    expect(result.title).toBe("50.000 kg ürün");
    expect(result.description).toBe("Fiyat 7.000 TL, tarih 2026-08-14, kayıt 1234567890");
  });

  it("normalizes seller call availability without accepting unknown slots", () => {
    expect(parseCallAvailability("morning,evening,unknown,morning")).toEqual(["morning", "evening"]);
    expect(parseCallAvailability(null)).toEqual(["asap", "morning", "afternoon", "evening"]);

    const result = toPublicListing({
      contactPhone: null,
      raw: null,
      title: "Domates",
      description: null,
      quality: null,
      packaging: null,
      callAvailability: "morning,evening",
    });
    expect(result.callAvailability).toEqual(["morning", "evening"]);
  });
});
