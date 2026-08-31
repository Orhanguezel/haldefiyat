import { describe, expect, it } from "bun:test";
import { listingCreateSchema } from "./validation";

/**
 * Regresyon kalkani: web formu FormData'yi `Object.fromEntries` ile gonderiyor,
 * yani doldurulmayan her alan BOS STRING olarak geliyor. `z.coerce.number()`
 * bos string'i 0'a cevirip `.positive()` kuralini patlatiyordu; sonucta istege
 * bagli bir alani bos birakan herkes 400 aliyordu (27 Agu 2026: 16 basarisiz
 * deneme, 0 ilan). Asagidaki ilk iki vaka o hatayi bir daha gecirmez.
 */

const future = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
};

const base = () => ({
  listingType: "satis",
  partyRole: "uretici",
  title: "50 ton kirmizi mercimek",
  productName: "Mercimek",
  quantityUnit: "ton",
  priceType: "sabit",
  priceUnit: "kg",
  currency: "TRY",
  contactName: "Test",
  contactPhone: "05551112233",
  validUntil: future(),
  citySlug: "konya",
  images: [],
  hidePhone: true,
  callRequestsEnabled: true,
  callAvailability: ["asap"],
});

describe("listingCreateSchema — bos string toleransi", () => {
  it("doldurulmayan opsiyonel sayisal alanlar bos string olarak gelebilir", () => {
    const r = listingCreateSchema.safeParse({
      ...base(),
      description: "", quality: "", packaging: "",
      quantity: "50", priceMin: "42", priceMax: "", halIndexPct: "", firmId: "",
    });
    expect(r.success).toBe(true);
  });

  it("yalnizca zorunlu alanlar doldurulmus form gecer", () => {
    const r = listingCreateSchema.safeParse({
      ...base(), quantity: "", priceMin: "42", priceMax: "", halIndexPct: "", firmId: "",
    });
    expect(r.success).toBe(true);
  });

  it("pazarlik ilaninda hic fiyat olmayabilir", () => {
    const r = listingCreateSchema.safeParse({
      ...base(), priceType: "pazarlik", priceMin: "", priceMax: "",
    });
    expect(r.success).toBe(true);
  });
});

describe("listingCreateSchema — gercek kurallar hala calisiyor", () => {
  it("sabit fiyatli ilanda priceMin zorunlu", () => {
    const r = listingCreateSchema.safeParse({ ...base(), priceType: "sabit", priceMin: "", priceMax: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "required_for_fixed_price")).toBe(true);
  });

  it("priceMax priceMin'den kucuk olamaz", () => {
    const r = listingCreateSchema.safeParse({ ...base(), priceMin: "42", priceMax: "10" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "max_lt_min")).toBe(true);
  });

  it("telefon zorunlu", () => {
    const r = listingCreateSchema.safeParse({ ...base(), priceMin: "42", contactPhone: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "phone_required")).toBe(true);
  });

  it("gecerlilik tarihi gelecekte olmali", () => {
    const r = listingCreateSchema.safeParse({
      ...base(), priceMin: "42", validUntil: new Date().toISOString().slice(0, 10),
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "must_be_future")).toBe(true);
  });

  it("gecersiz il reddedilir", () => {
    const r = listingCreateSchema.safeParse({ ...base(), priceMin: "42", citySlug: "olmayan-sehir" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.message === "invalid_city")).toBe(true);
  });
});
