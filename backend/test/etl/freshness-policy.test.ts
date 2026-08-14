import { describe, expect, it } from "bun:test";
import { isStaleAgainstOwnBaseline } from "../../src/modules/etl/freshness-policy";

describe("source freeze policy", () => {
  it("does not flag a sticky source inside its own historical baseline", () => {
    expect(isStaleAgainstOwnBaseline(14, 14)).toBe(false);
    expect(isStaleAgainstOwnBaseline(15, 14)).toBe(false);
  });

  it("flags only after the source-specific margin is exceeded", () => {
    expect(isStaleAgainstOwnBaseline(16, 14)).toBe(true);
  });

  it("keeps a four-day minimum for sources without a sticky baseline", () => {
    expect(isStaleAgainstOwnBaseline(3, 1)).toBe(false);
    expect(isStaleAgainstOwnBaseline(4, 1)).toBe(true);
  });
});
