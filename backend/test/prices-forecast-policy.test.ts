import { describe, expect, it } from "bun:test";
import { validateForecastSeries } from "../src/modules/prices/forecast";

function series(values: number[]) {
  return values.map((avgPrice, index) => ({
    date: `2026-07-${String(index + 1).padStart(2, "0")}`,
    avgPrice,
  }));
}

describe("public price forecast policy", () => {
  it("fails closed when history and backtest coverage are thin", () => {
    const result = validateForecastSeries(series([10, 11, 12, 13, 14]));
    expect(result.publishable).toBeFalse();
    expect(result.reasons).toContain("insufficient_history");
    expect(result.reasons).toContain("insufficient_backtest");
  });

  it("rejects a volatile series that cannot beat the naive baseline", () => {
    const values = Array.from({ length: 24 }, (_, index) => index % 2 === 0 ? 10 : 40);
    const result = validateForecastSeries(series(values));
    expect(result.publishable).toBeFalse();
    expect(result.reasons.some((reason) => reason === "mape_threshold" || reason === "baseline_not_beaten")).toBeTrue();
  });

  it("publishes only a stable trend that passes all measured gates", () => {
    const values = Array.from({ length: 24 }, (_, index) => 10 + index * 0.5);
    const result = validateForecastSeries(series(values));
    expect(result.publishable).toBeTrue();
    expect(result.validationPoints).toBe(7);
    expect(result.modelMape).toBeLessThanOrEqual(25);
    expect(result.modelMae!).toBeLessThanOrEqual(result.baselineMae!);
    expect(result.driftRatio).toBeLessThanOrEqual(1.5);
  });
});
