import { describe, expect, it } from "vitest";
import { computeWeeklyMovement, describeWeeklyMovement, type MovementRow } from "./weekly-movement";

const NOW = new Date("2026-09-17T10:00:00Z");
const day = (offset: number) => new Date(Date.parse("2026-09-16T00:00:00Z") - offset * 86400000).toISOString();

const row = (marketSlug: string, cityName: string, offset: number, avgPrice: number): MovementRow =>
  ({ recordedDate: day(offset), avgPrice, cityName, marketSlug, unit: "kg" });

describe("computeWeeklyMovement", () => {
  it("iki pencerede de kaydi olan halleri esler ve degisimi hesaplar", () => {
    const rows = [
      row("konya", "Konya", 1, 22), row("konya", "Konya", 9, 20),
      row("bursa", "Bursa", 2, 33), row("bursa", "Bursa", 10, 30),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;
    expect(m.marketCount).toBe(2);
    expect(m.previous).toBe(25);
    expect(m.current).toBeCloseTo(27.5, 5);
    expect(m.changePct).toBeCloseTo(10, 5);
  });

  it("YALNIZ bir pencerede yayin yapan hali kiyasa KATMAZ", () => {
    // Pahali hal sadece bu hafta yayin yapti; ortalamaya girerse sahte artis uretir.
    const rows = [
      row("konya", "Konya", 1, 22), row("konya", "Konya", 9, 20),
      row("pahali", "Pahalı", 1, 200),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;
    expect(m.marketCount).toBe(1);
    expect(m.current).toBe(22);
    expect(m.changePct).toBeCloseTo(10, 5);
  });

  it("sehir bazinda en cok artan ve gerileyeni ayirir", () => {
    const rows = [
      row("konya", "Konya", 1, 30), row("konya", "Konya", 9, 20),
      row("bursa", "Bursa", 1, 18), row("bursa", "Bursa", 9, 20),
    ];
    const m = computeWeeklyMovement(rows, NOW)!;
    expect(m.topRise?.cityName).toBe("Konya");
    expect(m.topFall?.cityName).toBe("Bursa");
  });

  it("kucuk oynamayi hareket saymaz", () => {
    const rows = [row("konya", "Konya", 1, 20.05), row("konya", "Konya", 9, 20)];
    const m = computeWeeklyMovement(rows, NOW)!;
    expect(m.topRise).toBeNull();
    expect(m.topFall).toBeNull();
    expect(describeWeeklyMovement("Patates", m)).toContain("yatay");
  });

  it("veri bayatsa hic cumle uretmez", () => {
    const eski = [{ recordedDate: "2026-08-01T00:00:00.000Z", avgPrice: 20, marketSlug: "konya", cityName: "Konya" }];
    expect(computeWeeklyMovement(eski, NOW)).toBeNull();
  });

  it("onceki hafta kaydi yoksa null — tek pencereyle degisim uydurulmaz", () => {
    expect(computeWeeklyMovement([row("konya", "Konya", 1, 22)], NOW)).toBeNull();
  });
});

describe("describeWeeklyMovement", () => {
  it("cumle olculen sayilardan turer ve dayanagini soyler", () => {
    const m = computeWeeklyMovement([
      row("konya", "Konya", 1, 22), row("konya", "Konya", 9, 20),
      row("bursa", "Bursa", 1, 28), row("bursa", "Bursa", 9, 30),
    ], NOW)!;
    const s = describeWeeklyMovement("Patates", m);
    expect(s).toContain("Patates son haftada");
    expect(s).toContain("2 halin her iki haftada da yayımladığı");
    expect(s).toContain("Konya");
  });
});
