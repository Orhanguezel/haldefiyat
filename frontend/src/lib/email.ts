/**
 * E-posta dogrulamasi — backend ile AYNI kural.
 *
 * Dort bulten formu (`CtaNewsletter`, `MobileHomeNewsletterCta`, `PriceListNewsletterStrip`,
 * `LivePriceNewsletter`) ayni zayif regex'i kopyalamisti:
 *
 *   /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 *
 * Iki ayri sorun uretiyordu:
 *
 * 1. GUVENLIK — 2026-07-13'te siteyi tarayan biri bulten formuna SQL injection sonda
 *    yukleri girdi ve hepsi gecti (`sample@email.tst'||'` gibi). Backend tarafi
 *    `@agro/shared-backend/core/email-validate` ile duzeltildi; frontend eski kuralda
 *    kalinca cop istekler hala aga cikiyordu.
 *
 * 2. TUTARSIZLIK — frontend kurali backend'den GEVSEK oldugu icin bazi adresler
 *    formda gecip sunucuda reddediliyordu. Kullanici "Kayit alinamadi" goruyor,
 *    sebebini anlamiyor. Iki taraf ayni seyi kabul etmeli.
 *
 * Alan adi kati (harf/rakam/tire etiketler + >=2 harfli TLD), yerel kisim yaygin
 * karakterlere musaade eder — kesme isareti dahil, cunku o'brien@... gercek bir adres.
 */

const MAX_LOCAL = 64;
const MAX_TOTAL = 254;

const LOCAL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_RE = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

export function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function isValidEmail(value: string): boolean {
  if (!value || value.length > MAX_TOTAL) return false;

  // Tek `@` sarti: "a@b@c" gibi dizeler elenmeli.
  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) return false;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);

  if (local.length > MAX_LOCAL || !LOCAL_RE.test(local)) return false;
  if (domain.length > 253 || !DOMAIN_RE.test(domain)) return false;

  return true;
}
