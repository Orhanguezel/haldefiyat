export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type UploadErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export function validateListingImage(file: Pick<File, "name" | "size" | "type">): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type.toLowerCase())) {
    return `${file.name}: Yalnızca JPG, PNG veya WebP görseller yüklenebilir.`;
  }
  if (file.size > MAX_LISTING_IMAGE_BYTES) {
    return `${file.name}: Görsel 5 MB sınırını aşıyor.`;
  }
  return null;
}

export function listingImageUploadError(
  fileName: string,
  status: number | null,
  payload: UploadErrorPayload,
): string {
  if (status === 413 || payload.error?.code === "image_too_large") {
    return `${fileName}: Görsel 5 MB sınırını aşıyor.`;
  }
  if (status === 401) {
    return `${fileName}: Oturumunuz sona ermiş. Yeniden giriş yapıp tekrar deneyin.`;
  }
  if (payload.error?.code === "unsupported_image_mime" || payload.error?.code === "image_mime_mismatch") {
    return `${fileName}: Yalnızca JPG, PNG veya WebP görseller yüklenebilir.`;
  }
  if (payload.error?.code === "invalid_image" || payload.error?.code === "invalid_image_dimensions") {
    return `${fileName}: Görsel dosyası okunamadı. Başka bir görsel deneyin.`;
  }
  return `${fileName}: Görsel yüklenemedi. Lütfen tekrar deneyin.`;
}
