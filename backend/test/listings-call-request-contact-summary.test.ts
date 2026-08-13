import { describe, expect, it } from "vitest";
import { maskOwnPhone } from "../src/modules/listings/repo";

describe("call request contact summary", () => {
  it("returns only a masked Turkish phone", () => {
    expect(maskOwnPhone("+90 532 123 45 67")).toBe("05** *** ** 67");
    expect(maskOwnPhone("05321234567")).toBe("05** *** ** 67");
  });

  it("does not invent a mask for missing or invalid values", () => {
    expect(maskOwnPhone(null)).toBeNull();
    expect(maskOwnPhone("1234")).toBeNull();
  });
});
