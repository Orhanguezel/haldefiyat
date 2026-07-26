import { describe, expect, it } from "vitest";
import { productHref } from "./product-links";

describe("productHref", () => {
  it("links price rows directly to their canonical product", () => {
    expect(productHref({ productSlug: "limon-lamas", canonicalProduct: "limon" }))
      .toBe("/urun/limon");
  });

  it("falls back to the source slug when no canonical product exists", () => {
    expect(productHref({ productSlug: "domates", canonicalProduct: null }))
      .toBe("/urun/domates");
  });
});
