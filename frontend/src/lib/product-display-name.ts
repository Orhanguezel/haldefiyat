function titleCaseTr(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .split(/(\s|\(|\)|-|,)/)
    .map((part) => {
      if (!part || /^\s+$/u.test(part) || /^[()\-,]+$/u.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1);
    })
    .join("")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Birim, niteleyici DEGILDIR. "(1.sınıf)" urunu ayirt eder ve elle yazilmis
 * display_name'i ezmeyi hak eder; "(KG)" ise yalnizca olcu birimini tekrarlar.
 *
 * Ayrim yapilmadigi icin "LİMON (KG) YENİ" ETL adi, elle girilen "Limon Yeni"
 * adini eziyordu ve sayfada "Limon (Kg) Yeni" gorunuyordu (15 urun, 17 Eyl 2026).
 */
const UNIT_WORDS = new Set([
  "kg", "kilogram", "kilo", "adet", "tane", "bağ", "bag", "demet", "kasa",
  "koli", "sandık", "sandik", "paket", "çuval", "cuval", "litre", "lt",
]);

function isUnitWord(word: string) {
  return UNIT_WORDS.has(word.toLocaleLowerCase("tr-TR"));
}

function hasMeaningfulQualifier(value: string) {
  const words = qualifierWords(value);
  return words.length > 0 && !words.every(isUnitWord);
}

/** Parantez icindeki niteleyici kelimeler ("DOMATES (SALÇALIK)" → ["salçalık"]). */
function qualifierWords(value: string): string[] {
  return [...value.matchAll(/\(([^)]*)\)/gu)]
    .flatMap((m) => m[1].split(/[\s,/-]+/u))
    .map((w) => w.toLocaleLowerCase("tr-TR"))
    .filter((w) => w.length > 1);
}

/** Niteleyici sayilan kelimeler: birim adlari harictir. */
function meaningfulQualifierWords(value: string): string[] {
  return qualifierWords(value).filter((w) => !isUnitWord(w));
}

/** Elle verilen ad, ETL adinin niteleyicisini parantezsiz de tasiyorsa ("Salçalık Domates") anlamlidir. */
function keepsQualifier(configured: string, nameTr: string) {
  const words = meaningfulQualifierWords(nameTr);
  const lower = configured.toLocaleLowerCase("tr-TR");
  return words.length > 0 && words.every((w) => lower.includes(w));
}

export function getProductDisplayName(product: { displayName?: string | null; nameTr: string }) {
  const configured = product.displayName?.trim();
  // Anlamlı varyantı koru; ETL placeholder'ını temiz display_name'in üzerine yazma.
  const value = (hasMeaningfulQualifier(product.nameTr) && !(configured && (hasMeaningfulQualifier(configured) || keepsQualifier(configured, product.nameTr)))
    ? product.nameTr
    : configured || product.nameTr)
    .replace(/\s*\(\s*\.{3}\s*\)\s*/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const letters = value.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/gu, "");
  const isAllCaps = letters.length > 1 && letters === letters.toLocaleUpperCase("tr-TR");
  return isAllCaps ? titleCaseTr(value) : value;
}
