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

  it("returns a dedicated image for every visible pepper family member", () => {
    const pepperSlugs = [
      "biber-carliston",
      "biber-maras",
      "biber-cin",
      "biber-dolma",
      "biber-kapya",
      "biber-kil-sivri",
      "biber-sivri",
      "ucburun-koy-biberi",
    ];

    const images = pepperSlugs.map((slug) => getExactProductImage(slug));
    expect(images.every(Boolean)).toBe(true);
    expect(new Set(images).size).toBe(pepperSlugs.length);
  });

  it.each([
    ["onion", ["sogan-kirmizi", "sogan-kuru", "sogan-yesil", "sogan-yesil-adet", "yesil-sogan"]],
    ["potato", ["patates", "patates-taze", "tatli-patates"]],
    ["cherry", ["kiraz", "kiraz-paket", "kiraz-napolyon"]],
    ["apricot", ["kayisi", "kayisi-sekerpare"]],
    ["grape", ["uzum", "uzum-pembe", "uzum-beyaz", "uzum-cekirdeksiz", "uzum-red-globe", "uzum-siyah"]],
    ["watermelon", ["karpuz", "karpuz-cekirdeksiz"]],
    ["plum", ["erik", "erik-anjelik", "erik-can", "erik-papaz"]],
  ])("returns unique dedicated images for the %s family", (_family, slugs) => {
    const images = slugs.map((slug) => getExactProductImage(slug));
    expect(images.every(Boolean)).toBe(true);
    expect(new Set(images).size).toBe(slugs.length);
  });

  it("keeps exact-image checks separate from the family fallback", () => {
    expect(getExactProductImage("domates-eksik-varyant")).toBeNull();
    expect(getProductImage("domates-eksik-varyant")).toBe("/images/urunler/domates.jpg");
  });
});
