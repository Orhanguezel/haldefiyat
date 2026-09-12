import { apiUpload, ApiError } from "@/lib/api-client";

export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;

/** Sunucunun kabul ettigi turler (sharp declared-MIME kapisi ile ayni kume). */
const UPLOADABLE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
/** iPhone varsayilan bicimi. Tarayici cozebiliyorsa JPEG'e cevirip gonderiyoruz. */
const CONVERTIBLE_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"]);

/** Sunucu zaten 2.400 px'e indiriyor; daha buyugunu yollamak bosa mobil veri harcar. */
const MAX_EDGE = 2_400;
/** Bu boyutun altindaki uygun dosya oldugu gibi gider — gereksiz yeniden kodlama kalite kaybidir. */
const PASSTHROUGH_BYTES = 1_200 * 1024;
const JPEG_QUALITY_STEPS = [0.85, 0.72, 0.6];

type UploadErrorPayload = {
  error?: {
    code?: string;
    message?: string;
  };
};

export function validateListingImage(file: Pick<File, "name" | "size" | "type">): string | null {
  const type = file.type.toLowerCase();
  if (!UPLOADABLE_TYPES.has(type)) {
    if (CONVERTIBLE_TYPES.has(type)) {
      return `${file.name}: Bu fotoğraf telefonun HEIC biçiminde ve tarayıcınız onu dönüştüremedi. Telefonun kamera ayarlarından "En Uyumlu" (JPEG) seçeneğini açıp tekrar çekin.`;
    }
    return `${file.name}: Yalnızca JPG, PNG veya WebP görseller yüklenebilir.`;
  }
  if (file.size > MAX_LISTING_IMAGE_BYTES) {
    return `${file.name}: Görsel 5 MB sınırını aşıyor.`;
  }
  return null;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  if (typeof canvas.toBlob !== "function") return Promise.resolve(null);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Telefondan gelen fotografi tarayicida kucultup JPEG'e cevirir.
 *
 * Neden: kullanicilar ilan fotografini cogunlukla telefondan yukluyor ve ham kamera
 * dosyasi 5 MB sinirini rahatca asiyordu — "yukleyemedim" sikayetinin baslica sebebi.
 * Ayrica iPhone varsayilan olarak HEIC uretiyor, sunucu HEIC kabul etmiyor. Tarayici
 * dosyayi cozebiliyorsa ikisi de burada, yuklemeden once cozulur.
 *
 * Cozemezse (ornegin HEIC destegi olmayan eski Android) dosya oldugu gibi birakilir;
 * karari `validateListingImage` verir ve kullaniciya ne yapacagini soyler.
 */
export async function prepareListingImage(file: File): Promise<File> {
  const type = file.type.toLowerCase();
  if (UPLOADABLE_TYPES.has(type) && file.size <= PASSTHROUGH_BYTES) return file;
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;

  let bitmap: ImageBitmap;
  try {
    // EXIF yonelimi sart: telefon dikey cektiginde piksel verisi yatay, yon EXIF'te durur.
    // Onurlandirilmazsa kullanicinin fotografi ilanda yan yatar.
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    for (const quality of JPEG_QUALITY_STEPS) {
      const blob = await toBlob(canvas, quality);
      if (!blob) return file;
      if (blob.size <= MAX_LISTING_IMAGE_BYTES) {
        const name = file.name.replace(/\.[^.]+$/, "") || "fotograf";
        return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
      }
    }
    return file;
  } finally {
    bitmap.close?.();
  }
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

export async function uploadListingImage(file: File): Promise<string> {
  const prepared = await prepareListingImage(file);
  const invalid = validateListingImage(prepared);
  // Hata mesaji kullanicinin sectigi dosyanin adiyla cikmali, donusturulmus adla degil.
  if (invalid) throw new Error(invalid.replace(prepared.name, file.name));
  const body = new FormData();
  body.append("file", prepared);
  try {
    const result = await apiUpload<{ url?: string }>("/storage/listings/upload", body);
    if (!result.url) throw new Error("Missing upload URL");
    return result.url;
  } catch (error) {
    throw new Error(listingImageUploadError(file.name, error instanceof ApiError ? error.status : null,
      error instanceof ApiError ? (error.details ?? {}) as UploadErrorPayload : {}));
  }
}
