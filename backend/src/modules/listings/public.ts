const TR_MOBILE_PHONE_PATTERN = /(?<!\d)(?:\+?90[\s().-]*)?(?:0?5\d{2})[\s().-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}(?!\d)/g;

function redactPhoneText(value: string | null | undefined) {
  return value?.replace(TR_MOBILE_PHONE_PATTERN, "[telefon gizlendi]") ?? value;
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
    title: redactPhoneText(item.title),
    description: redactPhoneText(item.description),
    quality: redactPhoneText(item.quality),
    packaging: redactPhoneText(item.packaging),
  };
}
