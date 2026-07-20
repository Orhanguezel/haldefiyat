/**
 * E-posta adresi dogrulamasi.
 *
 * Onceki kontrol `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` idi: yalnizca "bosluk yok, bir @ var,
 * sonrasinda nokta var" diyordu. Tirnak, parantez, `|`, `;` gibi karakterler serbestti.
 * 2026-07-13'te siteyi tarayan biri bulten formuna SQL injection sonda yukleri girdi ve
 * hepsi KABUL EDILDI:
 *
 *   sample@email.tst0"xor(if(now()=sysdate(),sleep(15),0))xor"z
 *   sample@email.tst'||'
 *   sample@email.tst'"
 *
 * Injection tutmadi (sorgular parametreli, dizeler duz metin olarak yazildi) ama:
 *  - abone listesi coplendi,
 *  - her bulten gonderiminde mail sunucusuna gecersiz adres gitti ve reddedildi;
 *    bu tekrarlanirsa gonderen itibarina (deliverability) zarar verir.
 *
 * Yeni kural: yerel kisim yaygin karakterlere izin verir (kesme isareti dahil — o'brien@…
 * gercek bir adrestir), ANCAK alan adi katı: yalnizca harf/rakam/tire, nokta ile ayrilmis
 * etiketler ve en az iki harfli TLD. Ucunde de cop kisim alan adinda oldugu icin elenir.
 */

/** RFC 5321: yerel kisim <=64, toplam <=254 oktet. */
const MAX_LOCAL = 64;
const MAX_TOTAL = 254;

const LOCAL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_RE = /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

export function normalizeEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/**
 * Adres kabul edilebilir mi? Bicim disinda uzunluk ve alan adi yapisini da denetler.
 * Tek bir `@` sarti onemli: cok @'li dizeler ("a@b@c") elenmeli.
 */
export function isValidEmail(value: string): boolean {
  if (!value || value.length > MAX_TOTAL) return false;

  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) return false;

  const local = value.slice(0, at);
  const domain = value.slice(at + 1);

  if (local.length > MAX_LOCAL || !LOCAL_RE.test(local)) return false;
  if (domain.length > 253 || !DOMAIN_RE.test(domain)) return false;

  // Ust uste nokta ve tire ile baslayan/biten etiket zaten regex disi; burada
  // yalnizca tamamen sayisal TLD gibi acik hatalari elemek yeterli.
  return true;
}
