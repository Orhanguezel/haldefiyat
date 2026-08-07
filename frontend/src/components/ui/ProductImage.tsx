import Image from "next/image";
import { getProductImage } from "@/lib/product-images";
import { getEmoji } from "@/lib/emoji";
import { resolveImageUrl } from "@/lib/utils";

interface ProductImageProps {
  slug: string;
  name: string;
  categorySlug?: string;
  /** Admin panelden yüklenen gerçek foto (DB, hf_products.image_url). Varsa manifest.json'dan önce kullanılır. */
  imageUrl?: string | null;
  /** Görüntü boyutu (px). Default 80. */
  size?: number;
  className?: string;
  /** Sadece sayfa açılışında görünen TEK bir görsel için true yapın (LCP). Liste/ticker/kart gibi tekrarlı kullanımlarda false kalmalı. */
  priority?: boolean;
}

/**
 * Ürün fotoğraf bileşeni — detay sayfası, kart, liste, ticker, arama sonucu
 * fark etmeksizin her yerde kullanılabilir. Fotoğraf varsa gösterir, yoksa
 * emoji fallback döner.
 */
export default function ProductImage({
  slug,
  name,
  categorySlug,
  imageUrl,
  size = 80,
  className = "",
  priority = false,
}: ProductImageProps) {
  const src = (imageUrl ? resolveImageUrl(imageUrl, "") : "") || getProductImage(slug);

  if (src) {
    return (
      <div
        className={`shrink-0 overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={`${name} ürün görseli`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          priority={priority}
        />
      </div>
    );
  }

  const emoji = getEmoji(slug, categorySlug);
  return (
    <span
      className={`shrink-0 ${className}`}
      style={{ fontSize: size * 0.6 }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
