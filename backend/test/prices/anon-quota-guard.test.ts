import { describe, expect, test } from "bun:test";

import { checkAndCountAnonPricesHit } from "../../src/modules/prices/anon-quota-guard";

describe("anonim fiyat API kota sayaci", () => {
  test("limite kadar izin verir, limitte keser", () => {
    const ip = "203.0.113.10";
    for (let i = 1; i <= 5; i++) {
      const r = checkAndCountAnonPricesHit(ip, "2026-08-19", 5);
      expect(r.allowed).toBe(true);
      expect(r.used).toBe(i);
    }
    const blocked = checkAndCountAnonPricesHit(ip, "2026-08-19", 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.used).toBe(5);
  });

  test("gun degisince sayac sifirlanir", () => {
    const ip = "203.0.113.20";
    for (let i = 0; i < 3; i++) checkAndCountAnonPricesHit(ip, "2026-08-19", 3);
    expect(checkAndCountAnonPricesHit(ip, "2026-08-19", 3).allowed).toBe(false);
    const nextDay = checkAndCountAnonPricesHit(ip, "2026-08-20", 3);
    expect(nextDay.allowed).toBe(true);
    expect(nextDay.used).toBe(1);
  });

  test("IP'ler birbirinden bagimsiz sayilir", () => {
    checkAndCountAnonPricesHit("203.0.113.30", "2026-08-19", 2);
    checkAndCountAnonPricesHit("203.0.113.30", "2026-08-19", 2);
    expect(checkAndCountAnonPricesHit("203.0.113.30", "2026-08-19", 2).allowed).toBe(false);
    expect(checkAndCountAnonPricesHit("203.0.113.31", "2026-08-19", 2).allowed).toBe(true);
  });
});
