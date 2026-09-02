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
    ["raspberry", ["ahududu", "ahududu-frambuaz"]],
    ["pineapple", ["ananas", "ananas-normal"]],
    ["cabbage", ["bruksel-lahana", "kirmizi-lahana", "lahana-beyaz", "lahana-beyaz-adet", "lahana-bruksel", "lahana-kara"]],
    ["bean", ["fasulye", "fasulye-ayse-kadin", "fasulye-cali", "fasulye-sirik", "kuru-fasulye"]],
    ["basil", ["feslegen", "feslegen-25-gr", "feslegen-reyhan"]],
    ["celery", ["kereviz", "kereviz-sap"]],
    ["radish", ["turp", "turp-beyaz", "turp-findik", "turp-kirmizi", "turp-otu", "turp-siyah"]],
    ["trout", ["alabalik", "alabalik-donuk"]],
    ["grape leaf", ["asma-yapragi", "yaprak", "yaprak-salamura"]],
    ["whiting", ["ciplak-mezgit", "mezgit", "mezgit-donuk"]],
    ["meagre", ["granyoz", "granyoz-kultur"]],
    ["horse mackerel", ["istavrit", "istavrit-donuk"]],
    ["mackerel", ["ithal-uskumru", "ithal-uskumru-donuk", "uskumru", "uskumru-donuk"]],
    ["shrimp", ["karides", "karides-donuk"]],
    ["mullet", ["kefal", "kefal-donuk"]],
    ["swordfish", ["kilic", "kilic-donuk"]],
    ["chub mackerel", ["kolyoz", "kolyoz-donuk"]],
    ["bogue", ["kupez", "kupez-donuk"]],
    ["chard", ["pazi", "pazi-kg"]],
    ["red mullet", ["tekir", "tekir-donuk"]],
    ["shad", ["tirsi", "tirsi-donuk"]],
    ["leerfish", ["akya", "akya-donuk"]],
    ["cod", ["bakalyaro-berlam", "donuk-bakalyaro"]],
    ["red mullet varieties", ["barbun", "barbun-kaya", "barbun-donuk", "barbun-kaya-donuk"]],
    ["green stone fruit", ["cagla", "cagla-badem", "cagla-kayisi", "cagla-nektarin"]],
    ["sea bream", ["cipura-deniz", "cipura-kultur"]],
    ["sole", ["dil", "donuk-dil"]],
    ["anchovy", ["donuk-hamsi", "hamsi", "hamsi-yem", "japon-hamsi"]],
    ["bonito", ["donuk-palamut", "palamut"]],
    ["sardine", ["donuk-sardalya", "sardalya", "sardalya-yem"]],
    ["carp", ["donuk-sazan", "sazan"]],
    ["salmon", ["donuk-somon", "somon"]],
    ["little tunny", ["donuk-tombik", "tombik"]],
    ["squid", ["donuk-kalamar", "ithal-kalamar", "kalamar"]],
    ["mussel", ["midye", "midye-donuk"]],
    ["cuttlefish", ["subye-deniz", "subye-donuk"]],
    ["avocado", ["avakado", "avokado"]],
    ["rosemary", ["biberiye-rozmarin", "rozmari"]],
    ["sea beans", ["borulce", "deniz-borulcesi", "deniz-borulcesi-ege-otu", "deniz-borulcesi-kg"]],
    ["passion fruit", ["carkifelek-passion-fruit", "passionfruit"]],
    ["live livestock", ["dana-canli", "duve-canli", "inek-canli", "koyun-canli", "manda-canli", "ot-kuzusu-canli", "sut-kuzusu-canli"]],
    ["dragon and exotic fruit", ["ejder-meyvesi", "ejder-meyvesi-kg", "pomelo-meyvesi", "yildiz-meyvesi"]],
    ["apple", ["elma", "elma-arjantin", "elma-golden", "elma-granny-smith", "elma-starking", "trabzon-hurmasi-cennet-elmasi", "yer-elmasi"]],
    ["mustard greens", ["hardal-otu", "hardal-otu-yas-taze"]],
    ["coconut", ["hindistan-cevizi", "hindistan-cevizi-adet"]],
    ["bundled greens", ["ispanak-bag", "semiz-otu-bag"]],
    ["bluefish", ["kofana", "kofana-deniz"]],
    ["kumquat", ["kumkat", "kumkat-paket"]],
    ["lemon", ["limon", "limon-lamas", "limon-sandik", "limon-mayer", "limon-otu", "limon-yatak"]],
    ["mango", ["mango", "mango-ithal-adet"]],
    ["parsley", ["maydanoz", "maydanoz-bag"]],
    ["corn and prickly pear", ["misir", "misir-inciri", "misir-taze"]],
    ["mint", ["nane", "nane-taze", "yesillik-maydanoz-nane-tere-roka-dere"]],
    ["lamb meat", ["ot-kuzusu-eti", "sut-kuzusu-eti"]],
    ["round market vegetables", ["patlican-bostan-topak", "pirasa-yerli-topak"]],
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
