/**
 * Sentetik (test) kayitlar icin bildirim susturucu.
 *
 * 2026-09-02: bir gelistirme oturumunda yapilan uctan uca testler — kullanici
 * kaydi, ilan acma, teklif verme — GERCEK operasyon kanalina dustu. Yaklasik
 * 12 bildirim gonderildi; veri sonradan silindi ama mesajlar geri alinamadi.
 * Kanal guveni boyle asinir: her uyari gercek sanilmayi birakir.
 *
 * Cozum: test kimlikleri ayirt edilir ve o kayitlar icin bildirim gonderilmez.
 * Isaret olarak GERCEKTE ULASILAMAYAN alan adlari kullanilir:
 *   - RFC 2606 ayrilmis TLD'ler: .test .example .invalid .localhost
 *   - .local (mDNS; internette cozulmez)
 * Bunlar tanim geregi kayit edilemez, yani gercek bir musteri boyle bir adrese
 * sahip OLAMAZ — yanlis susturma riski yok.
 *
 * Not: veriyi engellemez, yalnizca BILDIRIMI susturur. Test kaydi yine olusur
 * ve panelde gorunur; sadece gece yarisi telefon calmaz.
 */

const TEST_SUFFIXES = [".test", ".example", ".invalid", ".localhost", ".local"];

export function isSyntheticEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return TEST_SUFFIXES.some((suffix) => domain.endsWith(suffix));
}
