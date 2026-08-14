import { describe, expect, it } from "vitest";
import { retailFreshnessLabel } from "./retail-freshness";

describe("retail freshness label", () => {
  const now = new Date("2026-08-14T12:00:00.000Z");

  it("labels today and recent supporting observations", () => {
    expect(retailFreshnessLabel("2026-08-14", now)).toBe("Bugün güncellendi");
    expect(retailFreshnessLabel("2026-08-13", now)).toBe("1 gün önce güncellendi");
    expect(retailFreshnessLabel("2026-08-11", now)).toBe("3 gün önce güncellendi");
  });

  it("does not manufacture a freshness claim from an invalid date", () => {
    expect(retailFreshnessLabel("invalid", now)).toBe("Tarih doğrulanamadı");
  });
});
