/**
 * Birlestirme turunda silinen kopya kayitlarin slug'lari icin kanonik yol bulucu.
 *
 * Benzersiz-slug cakisma cozumu kopya kayitlara sayisal sonek verir (`elma-2`).
 * Kayit birlestirmede silinince o URL 404 dondurur, ama Google onu indeksinde
 * tuttugu icin yoklamaya devam eder — 19-30 Agustos 2026'da 1.765 istek, %99,5'i
 * Googlebot. Link degeri her taramada 404'te yaniyordu.
 *
 * Cozum: sonegi dusurup taban slug'i dene. Taban VARSA 301, yoksa 404 kalir.
 * Hala yasayan `-2` kayitlari (ornegin `domates-2`) bu yola hic girmez; buraya
 * ancak aranan slug bulunamadiginda gelinir.
 */

const NUMERIC_SUFFIX = /^(.+?)-(\d{1,3})$/;

/**
 * `elma-2` -> `elma`. Sonek yoksa veya taban bos kalirsa null.
 * Tek basina anlamli olan sayisal slug'lari (`2`, `-2`) disarida birakir.
 */
export function stripNumericSuffix(slug: string): string | null {
  const match = NUMERIC_SUFFIX.exec(slug.trim());
  if (!match) return null;
  const base = match[1]?.trim();
  if (!base) return null;
  // Taban tamamen rakamsa slug bir tanimlayicidir, kopya sonegi degil.
  if (/^\d+$/.test(base)) return null;
  return base;
}

/**
 * Bulunamayan slug icin kanonik aday dondurur.
 * `exists` cagiranin veri kaynagina baglanir (urun listesi, firma ucu...).
 */
export async function resolveCanonicalFallback(
  slug: string,
  exists: (candidate: string) => boolean | Promise<boolean>,
): Promise<string | null> {
  const base = stripNumericSuffix(slug);
  if (!base) return null;
  return (await exists(base)) ? base : null;
}
