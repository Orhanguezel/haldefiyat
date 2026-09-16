function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function compactMetaText(value: string, maxLength: number): string {
  const text = normalized(value);
  if (text.length <= maxLength) return text;

  const sentence = text.slice(0, maxLength + 1).match(/^(.{1,})([.!?])(?:\s|$)/u);
  if (sentence && sentence[0].length >= Math.floor(maxLength * 0.65)) {
    return sentence[0].trim();
  }

  const clipped = text.slice(0, maxLength - 1);
  const wordBoundary = clipped.lastIndexOf(" ");
  const body = wordBoundary >= Math.floor(maxLength * 0.65)
    ? clipped.slice(0, wordBoundary)
    : clipped;
  return `${body.replace(/[\s,;:—-]+$/u, "")}…`;
}

const TITLE_SEPARATOR = " — ";

/**
 * Baslikta "…" ile kirpmak, arama karsiligi olan son parcayi ortasindan kesiyor:
 * canlida "Domates Fiyatlari Bugun Kac TL? 16 Eylul 2026 — Hal ve…" gibi biten
 * onlarca urun basligi vardi (16 Eyl 2026 denetimi; adi 6 karakteri gecen her
 * urun bu duruma dusuyordu). Yarim kelime hicbir sorguyla eslesmez, ustelik
 * ozensiz gorunur.
 *
 * Once opsiyonel kuyruk parcasi butunuyle dusurulur; kimlik tasiyan bas kisim
 * korunur. Yalniz bas kisim tek basina sigmiyorsa eski kirpmaya donulur.
 * Kod tarafinda pickTitle/fitTitle zaten sigan basligi kurar, bu yuzden buradaki
 * dal pratikte DB'den (seo_pages) gelen sablonlari ve elle yazilmis basliklari
 * korur.
 */
export function compactMetaTitle(value: string): string {
  const text = normalized(value);
  if (text.length <= 60) return text;

  const parts = text.split(TITLE_SEPARATOR);
  for (let count = parts.length - 1; count >= 1; count -= 1) {
    const candidate = parts.slice(0, count).join(TITLE_SEPARATOR).replace(/[\s,;:—-]+$/u, "");
    if (candidate.length <= 60) return candidate;
  }
  return compactMetaText(text, 60);
}

export function compactMetaDescription(value: string): string {
  return compactMetaText(value, 160);
}
