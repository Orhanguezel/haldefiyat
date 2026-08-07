import PRODUCT_IMAGES from "../../public/images/urunler/manifest.json";

/**
 * Ürün slug'ına göre fotoğraf yolunu döndürür.
 * Önce tam eşleşme, sonra kısa prefix'e doğru geriler.
 * Fotoğraf yoksa null döner → emoji fallback.
 *
 * Veri kaynağı: public/images/urunler/manifest.json (tek kaynak — admin panel
 * de aynı dosyayı https://haldefiyat.com/images/urunler/manifest.json'dan
 * çeker, burada elle kopyalanmaz).
 *
 * Örnekler:
 *   "domates"          → /images/urunler/domates.jpg       (tam eşleşme)
 *   "domates-beef"     → /images/urunler/domates.jpg       (prefix: "domates")
 *   "biber-sivri-diger"→ /images/urunler/biber-sivri.jpg  (prefix: "biber-sivri")
 *   "portakal-kani"    → /images/urunler/portakal.jpg      (prefix: "portakal")
 */
export function getProductImage(slug: string): string | null {
  const images: Record<string, string> = PRODUCT_IMAGES;
  if (images[slug]) return images[slug]!;

  const parts = slug.split("-");
  for (let i = parts.length - 1; i >= 1; i--) {
    const prefix = parts.slice(0, i).join("-");
    if (images[prefix]) return images[prefix]!;
  }

  return null;
}
