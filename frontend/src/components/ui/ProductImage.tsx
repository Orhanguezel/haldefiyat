import Image from "next/image";
import { getProductImage } from "@/lib/product-images";
import { getEmoji } from "@/lib/emoji";

interface ProductImageProps {
  slug: string;
  name: string;
  categorySlug?: string;
  /** Görüntü boyutu (px). Default 80. */
  size?: number;
  className?: string;
}

/**
 * Ürün detay ve analiz kartları için fotoğraf bileşeni.
 * Fotoğraf varsa gösterir, yoksa emoji fallback döner.
 * Liste görünümlerinde (PriceCard) kullanılmaz.
 */
export default function ProductImage({
  slug,
  name,
  categorySlug,
  size = 80,
  className = "",
}: ProductImageProps) {
  const src = getProductImage(slug);

  if (src) {
    return (
      <div
        className={`shrink-0 overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface) shadow-sm ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          priority
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
