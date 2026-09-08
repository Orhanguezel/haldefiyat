/**
 * Baslik kurma yardimcilari.
 *
 * NEDEN: compactMetaTitle 60 karakterde kirpip "…" ekliyor. Kirpma cumlenin
 * ortasina denk geldiginde arama karsiligi olan kisim kayboluyordu — canlida
 * "Istanbul Hal Fiyatlari Bugun 7 Eylul 2026 — Istanbul…" basligi
 * "Bayrampasa" kelimesini yutuyor, oysa "bayrampasa hal fiyatlari" sorgusu
 * ayda 1.936 gosterim getiriyor (8 Eyl 2026 rakip analizi).
 *
 * Cozum kirpma sinirini buyutmek degil: basligi sigacak sekilde kurmak ve
 * butce asilirsa opsiyonel kuyrugu dusurmek.
 */

export const TITLE_MAX = 60;

const SEPARATOR = " — ";

/**
 * Hal adinda ayirt edici olmayan kurumsal kelimeler.
 * "Ticaret Borsasi" BILEREK disarida: bir borsayi ayni sehrin halinden ayiran
 * tek sey o ifade ("Ankara Toptanci Hali" ile "Ankara Ticaret Borsasi").
 */
const INSTITUTIONAL = new Set([
  "büyükşehir", "belediyesi", "belediye", "toptancı", "toptanci",
  "hali", "hal", "sebze", "meyve", "ve",
  "merkezi", "müdürlüğü", "mudurlugu",
]);

const tr = (value: string) => value.toLocaleLowerCase("tr-TR");

/**
 * Hal adindan sehri ve kurumsal kelimeleri atip ayirt edici yer adini dondurur.
 * "Istanbul Bayrampasa Toptanci Hali (IBB)" + "Istanbul" → "Bayrampasa"
 * "Ankara Toptanci Hali"                   + "Ankara"   → ""  (ayirt edici yok)
 */
export function marketQualifier(marketName: string, cityName: string): string {
  const raw = marketName.replace(/\s+/g, " ").trim();
  if (!raw) return "";

  const parenthetical = /\(([^)]+)\)/.exec(raw)?.[1]?.trim() ?? "";
  const withoutParens = raw.replace(/\([^)]*\)/g, " ");

  const cityTokens = new Set(tr(cityName).split(/\s+/).filter(Boolean));
  const kept = withoutParens
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => {
      const t = tr(token.replace(/[.,]/g, ""));
      return t.length > 0 && !cityTokens.has(t) && !INSTITUTIONAL.has(t);
    });

  if (kept.length > 0) return kept.join(" ");

  // Parantez ici yalniz gercek bir yer/ayrim adiysa kullanilir; "(IBB)" gibi
  // kisaltmalar aramada karsiligi olmadigi icin atlanir.
  const isAcronym = parenthetical.length <= 4 && parenthetical === parenthetical.toLocaleUpperCase("tr-TR");
  const hasDomain = /\./.test(parenthetical);
  return parenthetical && !isAcronym && !hasDomain ? parenthetical : "";
}

/**
 * Zorunlu bas kismi korur, opsiyonel kuyruklari butceye sigdigi kadar ekler.
 * Sigmayan kuyruk eklenmez — boylece compactMetaTitle'in kirpmasina hic gerek kalmaz.
 */
export function fitTitle(head: string, optional: string[] = [], max = TITLE_MAX): string {
  let title = head.replace(/\s+/g, " ").trim();
  for (const part of optional) {
    const piece = part?.replace(/\s+/g, " ").trim();
    if (!piece) continue;
    const candidate = `${title}${SEPARATOR}${piece}`;
    if (candidate.length <= max) title = candidate;
  }
  return title;
}

/**
 * Tercih sirasina gore ilk sigan adayi secer; hicbiri sigmazsa en kisasini verir.
 *
 * NEDEN fitTitle yetmiyor: kuyrugu tek tek dusurmek ayni sehirdeki iki kaynagi
 * ayni baslikta birlestirebiliyordu ("Ankara Toptanci Hali" ile "Polatli Ticaret
 * Borsasi" ikisi de "Ankara Hal Fiyatlari Bugun <tarih>" oluyordu). Kimlik
 * tazelikten once gelir: aday siralamasinda once tarih, sonra kimlik feda edilir.
 */
export function pickTitle(candidates: string[], max = TITLE_MAX): string {
  const cleaned = candidates.map((c) => c.replace(/\s+/g, " ").trim()).filter(Boolean);
  const fitting = cleaned.find((c) => c.length <= max);
  if (fitting) return fitting;
  return cleaned.reduce((shortest, c) => (c.length < shortest.length ? c : shortest), cleaned[0] ?? "");
}
