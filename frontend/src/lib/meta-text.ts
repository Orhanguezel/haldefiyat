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

  const clause = longestClause(text, 60);
  if (clause) return clause;

  return compactMetaText(text, 60);
}

/**
 * " — " kuyrugu olmayan, elle yazilmis uzun basliklar icin (editoryel analiz
 * yazilari) noktalama sinirinda kes: "HaldeFiyat Endeksi Nasil Hesaplanir?
 * Sepet, Baz Hafta ve…" yerine "HaldeFiyat Endeksi Nasil Hesaplanir?".
 * Butcenin yarisindan kisa kalan sinir kabul edilmez — baslik kimligini
 * kaybetmesin.
 */
function longestClause(text: string, max: number): string | null {
  const minLength = Math.floor(max / 2);
  let sentence: string | null = null;
  let clause: string | null = null;
  for (let i = 0; i < text.length && i < max; i += 1) {
    const mark = text[i]!;
    const endsSentence = "?!.".includes(mark);
    if (!endsSentence && !",;:".includes(mark)) continue;
    const candidate = text.slice(0, endsSentence ? i + 1 : i).replace(/[\s,;:—-]+$/u, "");
    if (candidate.length < minLength || candidate.length > max) continue;
    if (endsSentence) sentence = candidate;
    else clause = candidate;
  }
  // Cumle sonu her zaman zayif ayirici onunde gelir: "… Nasil Hesaplanir?"
  // tam bir soru, "… Nasil Hesaplanir? Sepet" listenin ortasinda kesilmis olur.
  return sentence ?? clause;
}

export function compactMetaDescription(value: string): string {
  return compactMetaText(value, 160);
}

/**
 * Zorunlu bas kismi korur, opsiyonel cumleleri butceye sigdigi kadar ekler.
 *
 * compactMetaDescription 160'ta kirptigi icin uzun hal adi olan sayfalarda
 * aciklama cumlenin ortasinda bitiyordu: /fiyat/istanbul/* sayfalarinin
 * tamami "…90 gunluk fiyat seyri, cesit ve kaynak…" ile kapaniyordu
 * (16 Eyl 2026 taramasi: 300 sayfada 26 ornek). Sigmayan cumle eklenmez.
 */
export function fitMetaDescription(head: string, optional: string[] = [], max = 160): string {
  let text = normalized(head);
  for (const part of optional) {
    const piece = normalized(part ?? "");
    if (!piece) continue;
    const candidate = `${text} ${piece}`;
    if (candidate.length <= max) text = candidate;
  }
  return text;
}
