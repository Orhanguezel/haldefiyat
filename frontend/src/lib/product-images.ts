/**
 * Trabzon Belediyesi'nden indirilen ürün fotoğrafları.
 * Yeni fotoğraf eklendikçe bu mape kayıt eklenir.
 * Değer: /public altındaki statik yol.
 */
const PRODUCT_IMAGES: Record<string, string> = {
  "ananas-ithal-adet":     "/images/urunler/ananas-ithal-adet.jpg",
  "armut-deveci":          "/images/urunler/armut-deveci.png",
  "armut":                 "/images/urunler/armut.jpg",
  "avokado":               "/images/urunler/avokado.jpg",
  "ayva":                  "/images/urunler/ayva.jpg",
  "biber-aci":             "/images/urunler/biber-aci.jpg",
  "biber-carli":           "/images/urunler/biber-carli.jpg",
  "biber-dolma":           "/images/urunler/biber-dolma.jpg",
  "biber-kirmizi":         "/images/urunler/biber-kirmizi.jpg",
  "biber-sivri":           "/images/urunler/biber-sivri.jpg",
  "brokoli":               "/images/urunler/brokoli.jpg",
  "cilek":                 "/images/urunler/cilek.jpg",
  "dereotu-bag":           "/images/urunler/dereotu-bag.jpg",
  "dereotu":               "/images/urunler/dereotu-bag.jpg",
  "domates":               "/images/urunler/domates.jpg",
  "domates-pembe":         "/images/urunler/domates-pembe.jpg",
  "domates-salcalik":      "/images/urunler/domates-salcalik.jpg",
  "domates-salkim":        "/images/urunler/domates-salkim.jpg",
  "elma-golden":           "/images/urunler/elma-golden.jpeg",
  "elma-granny-smith":     "/images/urunler/elma-granny-smith.jpg",
  "elma-starking":         "/images/urunler/elma-starking.jpg",
  "erik-yesil":            "/images/urunler/erik-yesil.jpg",
  "fasulye-ayse-kadin":    "/images/urunler/fasulye-ayse-kadin.jpg",
  "fasulye-sarikiz":       "/images/urunler/fasulye-sarikiz.jpeg",
  "greyfurt":              "/images/urunler/greyfurt.jpg",
  "havuc":                 "/images/urunler/havuc.jpg",
  "hindistan-cevizi-adet": "/images/urunler/hindistan-cevizi-adet.jpg",
  "hindistan-cevizi":      "/images/urunler/hindistan-cevizi-adet.jpg",
  "ispanak":               "/images/urunler/ispanak.jpg",
  "kabak-dolmalik":        "/images/urunler/kabak-dolmalik.jpg",
  "kabak":                 "/images/urunler/kabak-dolmalik.jpg",
  "karnabahar":            "/images/urunler/karnabahar.jpg",
  "karpuz":                "/images/urunler/karpuz.jpg",
  "kavun":                 "/images/urunler/kavun.jpg",
  "kayisi":                "/images/urunler/kayisi.jpg",
  "kereviz":               "/images/urunler/kereviz.jpg",
  "kiraz":                 "/images/urunler/kiraz.jpg",
  "kivi":                  "/images/urunler/kivi.jpg",
  "lahana-kara-bag":       "/images/urunler/lahana-kara-bag.png",
  "lahana-kara":           "/images/urunler/lahana-kara-bag.png",
  "lahana-kirmizi":        "/images/urunler/lahana-kirmizi.jpg",
  "lahana-top":            "/images/urunler/lahana-top.jpg",
  "lahana":                "/images/urunler/lahana-top.jpg",
  "limon-dokme":           "/images/urunler/limon-dokme.jpg",
  "limon":                 "/images/urunler/limon-dokme.jpg",
  "mandalina":             "/images/urunler/mandalina.jpg",
  "mango-ithal-adet":      "/images/urunler/mango-ithal-adet.jpg",
  "mango":                 "/images/urunler/mango-ithal-adet.jpg",
  "mantar":                "/images/urunler/mantar.jpeg",
  "marul-aysberg-adet":    "/images/urunler/marul-aysberg-adet.jpg",
  "marul-aysberg":         "/images/urunler/marul-aysberg-adet.jpg",
  "marul-duz-adet":        "/images/urunler/marul-duz-adet.jpg",
  "marul-duz":             "/images/urunler/marul-duz-adet.jpg",
  "marul-kivircik-adet":   "/images/urunler/marul-kivircik-adet.jpg",
  "marul-kivircik":        "/images/urunler/marul-kivircik-adet.jpg",
  "marul":                 "/images/urunler/marul-duz-adet.jpg",
  "maydanoz-bag":          "/images/urunler/maydanoz-bag.jpg",
  "maydanoz":              "/images/urunler/maydanoz-bag.jpg",
  "muz-ithal-koli":        "/images/urunler/muz-ithal-koli.jpg",
  "muz-ithal":             "/images/urunler/muz-ithal-koli.jpg",
  "muz-yerli":             "/images/urunler/muz-yerli.jpg",
  "muz":                   "/images/urunler/muz-yerli.jpg",
  "nane-bag":              "/images/urunler/nane-bag.jpg",
  "nane":                  "/images/urunler/nane-bag.jpg",
  "nar":                   "/images/urunler/nar.jpg",
  "patates":               "/images/urunler/patates.jpg",
  "patlican":              "/images/urunler/patlican.jpg",
  "pirasa":                "/images/urunler/pirasa.jpg",
  "portakal-finike":       "/images/urunler/portakal-finike.jpg",
  "portakal-sikma":        "/images/urunler/portakal-sikma.jpg",
  "portakal-vashington":   "/images/urunler/portakal-vashington.jpg",
  "portakal":              "/images/urunler/portakal.jpg",
  "roka-bag":              "/images/urunler/roka-bag.jpg",
  "roka":                  "/images/urunler/roka-bag.jpg",
  "salatalik":             "/images/urunler/salatalik.jpg",
  "sarimsak-yerli":        "/images/urunler/sarimsak-yerli.jpg",
  "sarimsak":              "/images/urunler/sarimsak-yerli.jpg",
  "seftali":               "/images/urunler/seftali.jpg",
  "semizotu-bag":          "/images/urunler/semizotu-bag.jpg",
  "semizotu":              "/images/urunler/semizotu-bag.jpg",
  "sogan-kuru":            "/images/urunler/sogan-kuru.jpg",
  "sogan-yesil-bag":       "/images/urunler/sogan-yesil-bag.jpg",
  "sogan-yesil":           "/images/urunler/sogan-yesil-bag.jpg",
  "sogan":                 "/images/urunler/sogan-kuru.jpg",
  "turp-kirmizi":          "/images/urunler/turp-kirmizi.jpg",
  "turp-siyah":            "/images/urunler/turp-siyah.jpg",
  "turp":                  "/images/urunler/turp-kirmizi.jpg",
  "uzum-muhtelif":         "/images/urunler/uzum-muhtelif.jpeg",
  "uzum":                  "/images/urunler/uzum-muhtelif.jpeg",
  "yeni-dunya":            "/images/urunler/yeni-dunya.jpg",
};

/**
 * Ürün slug'ına göre fotoğraf yolunu döndürür.
 * Önce tam eşleşme, sonra kısa prefix'e doğru geriler.
 * Fotoğraf yoksa null döner → emoji fallback.
 *
 * Örnekler:
 *   "domates"          → /images/urunler/domates.jpg       (tam eşleşme)
 *   "domates-beef"     → /images/urunler/domates.jpg       (prefix: "domates")
 *   "biber-sivri-diger"→ /images/urunler/biber-sivri.jpg  (prefix: "biber-sivri")
 *   "portakal-kani"    → /images/urunler/portakal.jpg      (prefix: "portakal")
 */
export function getProductImage(slug: string): string | null {
  if (PRODUCT_IMAGES[slug]) return PRODUCT_IMAGES[slug]!;

  const parts = slug.split("-");
  for (let i = parts.length - 1; i >= 1; i--) {
    const prefix = parts.slice(0, i).join("-");
    if (PRODUCT_IMAGES[prefix]) return PRODUCT_IMAGES[prefix]!;
  }

  return null;
}
