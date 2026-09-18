import { describe, expect, it } from "vitest";
import { summarizeMarketMovement } from "./citability";

const row = (productSlug: string, recordedDate: string, avgPrice: number) => ({
  productSlug,
  productName: productSlug,
  recordedDate,
  avgPrice,
});

describe("summarizeMarketMovement", () => {
  it("bes urunden az karsilastirilabiliyorsa sayi uretmez", () => {
    const rows = ["a", "b", "c"].flatMap((p) => [row(p, "2026-09-17", 10), row(p, "2026-09-18", 9)]);
    expect(summarizeMarketMovement(rows)).toBeNull();
  });

  it("yukselen, geriyen ve yatay urunleri ayri sayar", () => {
    const rows = [
      ...["d1", "d2", "d3"].flatMap((p) => [row(p, "2026-09-17", 100), row(p, "2026-09-18", 90)]),
      ...["u1", "u2"].flatMap((p) => [row(p, "2026-09-17", 100), row(p, "2026-09-18", 110)]),
      // %0,5 esiginin altinda: yatay.
      ...["y1"].flatMap((p) => [row(p, "2026-09-17", 100), row(p, "2026-09-18", 100.2)]),
    ];
    const result = summarizeMarketMovement(rows)!;
    expect(result.compared).toBe(6);
    expect(result.falling).toBe(3);
    expect(result.rising).toBe(2);
    expect(result.flat).toBe(1);
    expect(result.fallingPct).toBe(50);
  });

  // calculateProductMovers %0,1 altini tamamen atiyor; oran o paydayla
  // hesaplansaydi yatay bir liste "%100 ucuzladi" gorunurdu.
  it("neredeyse hic degismeyen urunler paydada kalir", () => {
    const rows = [
      ...["d1"].flatMap((p) => [row(p, "2026-09-17", 100), row(p, "2026-09-18", 90)]),
      ...["y1", "y2", "y3", "y4", "y5"].flatMap((p) => [row(p, "2026-09-17", 100), row(p, "2026-09-18", 100.01)]),
    ];
    const result = summarizeMarketMovement(rows)!;
    expect(result.compared).toBe(6);
    expect(result.flat).toBe(5);
    expect(result.fallingPct).toBeCloseTo(16.7, 1);
  });

  it("tek gunluk kayitlari karsilastirmaya almaz", () => {
    const rows = [
      ...["d1", "d2", "d3", "d4", "d5"].flatMap((p) => [row(p, "2026-09-17", 100), row(p, "2026-09-18", 90)]),
      row("tek", "2026-09-18", 50),
    ];
    expect(summarizeMarketMovement(rows)!.compared).toBe(5);
  });
});
