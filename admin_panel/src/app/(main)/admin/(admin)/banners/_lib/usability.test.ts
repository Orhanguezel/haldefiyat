import { describe, expect, test } from "bun:test";
import { monthKey, monthPeriod, packageSlug } from "./usability";
describe("reklam yönetimi tarih ve paket adı", () => {
  test("pozitif saat diliminde ayın ilk ve son günü bir gün geriye kaymaz", () => {
    expect(monthPeriod(monthKey(0, new Date(2026, 8, 16)))).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });
  test("önceki ay yıl sınırını ve artık yıl şubatını korur", () => {
    expect(monthKey(-1, new Date(2026, 0, 5))).toBe("2025-12");
    expect(monthPeriod("2024-02").to).toBe("2024-02-29");
    expect(monthPeriod("2026-02").to).toBe("2026-02-28");
    expect(() => monthPeriod("2026-13")).toThrow();
  });
  test("Türkçe tam paket adı geçerli kayıt adına dönüşür", () => {
    expect(packageSlug("Aylık Ürün Tanıtımı — Çiftçi")).toBe("aylik-urun-tanitimi-ciftci");
    expect(packageSlug(" İHRACAT Görünürlüğü ")).toBe("ihracat-gorunurlugu");
    expect(packageSlug("Uzun paket adı ".repeat(20)).length).toBeLessThanOrEqual(96);
  });
});
