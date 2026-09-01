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
    ["mushroom", ["mantar", "mantar-istiridye", "mantar-kultur", "mantar-pk-300-gr"]],
    ["thyme", ["kekik", "kekik-yas-taze"]],
    ["garlic", ["sarimsak-taze", "sarimsak-kuru"]],
    ["melon", ["kavun", "kavun-kirkagac", "kavun-galya"]],
    ["cranberry bean", ["barbunya", "barbunya-taze"]],
    ["banana", ["muz-ithal", "muz-koli", "muz-yerli"]],
    ["squash", ["ampul-kabak", "kabak", "kabak-cicegi", "kabak-kara", "kabak-sakiz"]],
    ["fig", ["incir", "incir-siyah", "incir-beyaz"]],
    ["lettuce", ["marul", "marul-aysberg", "marul-kivircik", "marul-lolorosso", "marul-gobekli"]],
    ["orange", ["portakal", "portakal-valencia", "portakal-washington", "portakal-finike", "portakal-sikmalik"]],
    ["mulberry", ["dut", "dut-paket", "dut-kara"]],
    ["chickpea", ["nohut-taze", "nohut"]],
    ["nectarine", ["nektarin", "nektarin-beyaz"]],
    ["artichoke", ["enginar", "enginar-salamura", "enginar-taze"]],
    ["pear", ["armut", "armut-akca", "armut-deveci", "armut-margarit", "armut-santamaria"]],
    ["broad bean", ["bakla", "bakla-taze-sakiz"]],
    ["carrot", ["havuc", "havuc-beypazari", "havuc-kirmizi", "havuc-siyah"]],
    ["blueberry", ["yaban-mersini-kg", "yaban-mersini"]],
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
