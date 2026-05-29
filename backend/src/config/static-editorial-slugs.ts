// Frontend'deki elle yazılmış editoryel içeriğe sahip ürünler (mirror of
// frontend/src/lib/product-content.ts PRODUCT_CONTENT anahtarları).
// Bu ürünler DB editoryeli olmasa da özgün statik içeriğe sahiptir → audit/seoIndex
// kararlarında "editoryeli var" sayılır. Frontend listesi değişirse burayı güncel tut.
export const STATIC_EDITORIAL_SLUGS = new Set<string>([
  "armut",
  "biber",
  "biber-dolma",
  "biber-sivri",
  "brokoli",
  "cilek",
  "domates",
  "elma",
  "havuc",
  "ispanak",
  "kabak-dolmalik",
  "karnabahar",
  "karpuz",
  "kavun",
  "kiraz",
  "kivi",
  "limon",
  "mandalina",
  "muz",
  "patates",
  "patlican",
  "portakal",
  "salatalik",
  "sarimsak",
  "seftali",
  "sogan-kuru",
  "uzum",
]);
