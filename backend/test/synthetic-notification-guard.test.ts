import { describe, expect, it } from "bun:test";
import { isSyntheticEmail } from "@/modules/notifications/synthetic";

/**
 * 2026-09-02: bir gelistirme oturumundaki uctan uca testler (kullanici kaydi,
 * ilan acma, teklif) GERCEK operasyon kanalina ~12 bildirim gonderdi. Veri
 * silindi ama mesajlar geri alinamadi. Kanal guveni boyle asinir.
 *
 * Isaret olarak GERCEKTE ULASILAMAYAN alan adlari secildi (RFC 2606 + .local):
 * bunlar kayit edilemez, yani gercek bir musteri boyle bir adrese sahip olamaz.
 * Yanlis susturma riski yok — bu testin asil isi onu kanitlamak.
 */
describe("sentetik kayit bildirim susturucu", () => {
  it("ayrilmis test alan adlarini taniyor", () => {
    for (const email of [
      "uitest-3bbee2@haldefiyat-test.local",
      "a@example.test",
      "b@foo.example",
      "c@bar.invalid",
      "d@dev.localhost",
    ]) {
      expect(isSyntheticEmail(email)).toBe(true);
    }
  });

  it("GERCEK adresleri susturmaz — yanlis pozitif kabul edilemez", () => {
    for (const email of [
      "furkangonca0@gmail.com",
      "orhanguzell@gmail.com",
      "info@ledsoft.io",
      "satinalma@filemarket.com.tr",
      "a@localhost.com",      // .localhost ile BITMIYOR
      "b@test.com.tr",        // .test ile BITMIYOR
      "c@example.com",        // .example ile BITMIYOR
    ]) {
      expect(isSyntheticEmail(email)).toBe(false);
    }
  });

  it("bos ve bozuk degerlerde susturmaz", () => {
    expect(isSyntheticEmail(null)).toBe(false);
    expect(isSyntheticEmail(undefined)).toBe(false);
    expect(isSyntheticEmail("")).toBe(false);
    expect(isSyntheticEmail("alan-adi-yok")).toBe(false);
  });
});
