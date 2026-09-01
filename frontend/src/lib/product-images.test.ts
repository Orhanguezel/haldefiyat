import { describe, expect, it } from "vitest";
import { getExactProductImage, getProductImage } from "./product-images";

describe("product image resolution", () => {
  it("returns a dedicated image for every visible tomato family member", () => {
    const tomatoSlugs = [
      "domates",
      "domates-ayas",
      "domates-beef",
      "domates-cherry",
      "domates-kokteyl",
      "domates-pembe",
      "domates-salcalik",
      "domates-salkim",
      "domates-sera",
      "domates-yesil-tursu",
    ];

    const images = tomatoSlugs.map((slug) => getExactProductImage(slug));
    expect(images.every(Boolean)).toBe(true);
    expect(new Set(images).size).toBe(tomatoSlugs.length);
  });

  it("keeps exact-image checks separate from the family fallback", () => {
    expect(getExactProductImage("domates-eksik-varyant")).toBeNull();
    expect(getProductImage("domates-eksik-varyant")).toBe("/images/urunler/domates.jpg");
  });
});
