const TR_MOBILE_PHONE_PATTERN = /(?<!\d)(?:\+?90[\s().-]*)?(?:0?5\d{2})[\s().-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}(?!\d)/g;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export function redactContactText(value: string | null | undefined) {
  return value
    ?.replace(TR_MOBILE_PHONE_PATTERN, "[telefon gizlendi]")
    .replace(EMAIL_PATTERN, "[e-posta gizlendi]") ?? value;
}

export function maskOwnPhone(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  const local = digits.startsWith("90") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (local.length < 10) return null;
  return `0${local.slice(0, 1)}** *** ** ${local.slice(-2)}`;
}

/**
 * Public ilan cevaplarında telefon hiçbir kanaldan sızmamalı. Yalnız contactPhone
 * alanını boşaltmak yeterli değildir; kullanıcı açıklama/başlık gibi serbest metinlere
 * de numara yazabilir. Owner/admin cevapları bu dönüştürücüden geçirilmez.
 */
export function toPublicListing<
  T extends {
    contactPhone?: string | null;
    raw?: unknown;
    title?: string | null;
    description?: string | null;
    quality?: string | null;
    packaging?: string | null;
  },
>(item: T) {
  return {
    ...item,
    contactPhone: null,
    raw: null,
    title: redactContactText(item.title),
    description: redactContactText(item.description),
    quality: redactContactText(item.quality),
    packaging: redactContactText(item.packaging),
  };
}
