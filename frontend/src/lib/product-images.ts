import PRODUCT_IMAGES from "../../public/images/urunler/manifest.json";

/**
 * Yalnizca urunun kendi slug'ina atanmis fotografi dondurur.
 * Cesit secici gibi tekrarli yuzeylerde aile/canonical fallback kullanmak,
 * farkli cesitlerde ayni fotografi gosterecegi icin uygun degildir.
 */
export function getExactProductImage(slug: string): string | null {
  const images: Record<string, string> = PRODUCT_IMAGES;
  return images[slug] ?? null;
}

/**
 * Ürün slug'ına göre fotoğraf yolunu döndürür.
 * Önce tam eşleşme, sonra varsa canonical ürün eşleşmesi denenir. Kalan eski
 * kayıtlar için prefix fallback geçici olarak korunur; manifest tamamlandığında
 * bu son adım kaldırılacaktır.
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
export function getProductImage(slug: string, canonicalSlug?: string | null): string | null {
  const images: Record<string, string> = PRODUCT_IMAGES;
  const exactImage = getExactProductImage(slug);
  if (exactImage) return exactImage;

  if (canonicalSlug && images[canonicalSlug]) return images[canonicalSlug]!;

  if (canonicalSlug) {
    const canonicalParts = canonicalSlug.split("-");
    for (let i = canonicalParts.length - 1; i >= 1; i--) {
      const prefix = canonicalParts.slice(0, i).join("-");
      if (images[prefix]) return images[prefix]!;
    }
  }

  const parts = slug.split("-");
  for (let i = parts.length - 1; i >= 1; i--) {
    const prefix = parts.slice(0, i).join("-");
    if (images[prefix]) return images[prefix]!;
  }

  return null;
}
