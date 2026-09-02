import { describe, expect, it } from "bun:test";
import { offersAreOpen } from "@/modules/listings/repo";

/**
 * Kapali zarf kurali (A secenegi, Orhan karari 2026-09-02): teklifler TEKLIF SON
 * TARIHI gecene kadar ilan sahibine bile gosterilmez. Bu kural bir VAAT — ihale
 * sayfasinda "son tarihe kadar hicbir teklif gorulemez" yaziyor ve para karari
 * ona dayaniyor. Bu yuzden tek fonksiyonda tutuluyor ve burada kilitleniyor.
 */
describe("kapali zarf — teklif gorunurlugu", () => {
  const gun = (iso: string) => new Date(`${iso}T09:00:00Z`);

  it("son tarih GELMEDEN teklifler kapalidir", () => {
    expect(offersAreOpen("2026-09-10", gun("2026-09-01"))).toBe(false);
    expect(offersAreOpen("2026-09-10", gun("2026-09-09"))).toBe(false);
  });

  it("son tarih GUNU hala kapalidir — o gun teklif verilebilir", () => {
    // valid_until "son teklif gunu"dur; o gun icinde gelen teklif de gizli kalmali.
    expect(offersAreOpen("2026-09-10", gun("2026-09-10"))).toBe(false);
  });

  it("son tarih GECTIKTEN sonra acilir", () => {
    expect(offersAreOpen("2026-09-10", gun("2026-09-11"))).toBe(true);
    expect(offersAreOpen("2026-09-10", gun("2026-12-01"))).toBe(true);
  });

  it("tarih yoksa ACILMAZ — belirsizlikte kapali tarafta kalinir", () => {
    expect(offersAreOpen(null, gun("2026-09-11"))).toBe(false);
    expect(offersAreOpen(undefined, gun("2026-09-11"))).toBe(false);
    expect(offersAreOpen("", gun("2026-09-11"))).toBe(false);
  });
});
