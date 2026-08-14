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

  it("skips active redirects even when an old master is supplied", () => {
    expect(productHref({ productSlug: "biber-kil-aci", canonicalProduct: "biber" }))
      .toBe("/urun/biber-carliston");
  });

  it("accepts API product objects that expose slug", () => {
    expect(productHref({ slug: "limon-lamas", canonicalSlug: "limon" }))
      .toBe("/urun/limon");
  });

  it("falls back to the price list when the source has no identity", () => {
    expect(productHref({})).toBe("/fiyatlar");
  });
});
