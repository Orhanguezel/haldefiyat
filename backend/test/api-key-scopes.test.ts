import { describe, expect, it } from "bun:test";
import { API_SCOPES, isApiScope } from "@/modules/api-keys/scopes";

/**
 * Yazma yetkisi, anahtarin sizmasi halinde MUSTERI ADINA ISLEM yapilabilmesi
 * demektir. Bu yuzden yetki adi serbest metin degil, kapali bir listedir:
 * yanlis yazilmis ya da uydurulmus bir yetki sessizce kabul edilmez.
 */
describe("api anahtari yetkileri", () => {
  it("yalnizca tanimli yetkiler kabul edilir", () => {
    expect(isApiScope("listings:write")).toBe(true);
    expect(isApiScope("listings:read")).toBe(true);
  });

  it("tanimsiz yetki reddedilir", () => {
    for (const kotu of ["", "admin", "*", "listings:*", "prices:write", "LISTINGS:WRITE", "listings"]) {
      expect(isApiScope(kotu)).toBe(false);
    }
  });

  it("yetki listesi dar tutulur — her yeni yetki bilincli karardir", () => {
    // Liste buyudukce sizan anahtarin yapabilecegi is artar. Bu test, yetki
    // eklerken birinin durup dusunmesini saglamak icin var.
    expect(API_SCOPES).toEqual(["listings:write", "listings:read"]);
  });
});
