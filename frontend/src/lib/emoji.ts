/**
 * Urun slug → emoji mapping.
 *
 * NEDEN: Backend'de emoji kolonu tutmak yerine frontend tarafinda statik
 * eslestirme yapiyoruz. Yeni urun eklendiginde sadece bu dosya guncellenir.
 */
const EMOJI: Record<string, string> = {
  domates: "🍅",
  biber: "🫑",
  patates: "🥔",
  sogan: "🧅",
  havuc: "🥕",
  kabak: "🥒",
  patlican: "🍆",
  ispanak: "🥬",
  marul: "🥬",
  salatalik: "🥒",
  elma: "🍎",
  armut: "🍐",
  uzum: "🍇",
  nar: "🍎",
  portakal: "🍊",
  mandalina: "🍊",
  limon: "🍋",
  cilek: "🍓",
  kayisi: "🍑",
  seftali: "🍑",
  "kuru-fasulye": "🫘",
  nohut: "🫘",
  mercimek: "🫘",
};

const FALLBACK = "🌿";

export function getEmoji(slug: string): string {
  return EMOJI[slug] ?? FALLBACK;
}
