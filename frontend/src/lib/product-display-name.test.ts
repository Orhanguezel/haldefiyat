import { describe, expect, it } from "vitest";
import { getProductDisplayName } from "./product-display-name";

describe("getProductDisplayName", () => {
  it("prefers the clean configured name over an ellipsis placeholder", () => {
    expect(getProductDisplayName({ nameTr: "DOMATES (...)", displayName: "Domates" })).toBe("Domates");
  });

  it("removes an ellipsis placeholder when no configured name exists", () => {
    expect(getProductDisplayName({ nameTr: "DOMATES (...)" })).toBe("Domates");
  });

  it("keeps a meaningful variant qualifier", () => {
    expect(getProductDisplayName({ nameTr: "ROKA (BAĞ)", displayName: "Roka" })).toBe("Roka (Bağ)");
  });
});
