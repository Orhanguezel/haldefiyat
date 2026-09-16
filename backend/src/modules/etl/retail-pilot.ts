/** Versioned 40-product pilot; groups share a search, never a product identity. */
export const RETAIL_PILOT = [
  ["domates", "domates"], ["domates-salkim", "domates"], ["domates-pembe", "domates"],
  ["patates", "patates"], ["patates-taze", "patates"], ["sogan-kuru", "soğan"],
  ["salatalik", "salatalık"], ["patlican", "patlıcan"], ["havuc", "havuç"],
  ["biber-sivri", "biber"], ["biber-carliston", "biber"], ["kabak-sakiz", "kabak"],
  ["limon", "limon"], ["karpuz", "karpuz"], ["karpuz-cekirdeksiz", "karpuz"],
  ["kavun", "kavun"], ["kavun-kirkagac", "kavun"], ["seftali", "şeftali"],
  ["nektarin", "nektarin"], ["uzum-cekirdeksiz", "üzüm"], ["uzum-siyah", "üzüm"],
  ["muz-yerli", "muz"], ["muz-ithal", "muz"], ["elma-granny-smith", "elma"],
  ["portakal", "portakal"], ["mandalina", "mandalina"], ["nar", "nar"],
  ["mantar", "mantar"], ["brokoli", "brokoli"],
  ["dana-kiyma", "dana kıyma"], ["dana-kusbasi", "dana kuşbaşı"], ["tavuk-gogsu", "tavuk göğüs"],
  ["sut", "süt"], ["beyaz-peynir", "beyaz peynir"], ["yogurt", "yoğurt"],
  ["pirinc", "pirinç"], ["mercimek", "kırmızı mercimek"], ["kuru-fasulye", "kuru fasulye"],
  ["nohut", "nohut"], ["bulgur", "bulgur"],
] as const;
export const RETAIL_PILOT_SLUGS = new Set<string>(RETAIL_PILOT.map(([slug]) => slug));
export const RETAIL_PILOT_QUERIES = [...new Set<string>(RETAIL_PILOT.map(([, keyword]) => keyword))];
export const PILOT_VERSION = 1;
export const retailDay = (now = new Date()) => now.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
