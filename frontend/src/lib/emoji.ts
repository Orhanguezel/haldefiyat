/**
 * Urun slug → emoji mapping.
 *
 * NEDEN: Backend'de emoji kolonu tutmak yerine frontend tarafinda statik
 * eslestirme yapiyoruz. Yeni urun eklendiginde sadece bu dosya guncellenir.
 */
/**
 * Urun slug → emoji mapping.
 *
 * NEDEN: Backend'de emoji kolonu tutmak yerine frontend tarafinda statik
 * eslestirme yapiyoruz. Yeni urun eklendiginde sadece bu dosya guncellenir.
 */
const EMOJI: Record<string, string> = {
  // Sebzeler
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
  lahana: "🥬",
  karnabahar: "🥦",
  brokoli: "🥦",
  pirasa: "🥬",
  kereviz: "🥬",
  enginar: "🥬",
  bezelye: "🫛",
  fasulye: "🫛",
  bamya: "🥬",
  sarimsak: "🧄",
  turp: "🥕",
  pancar: "🥬",
  misir: "🌽",

  // Meyveler
  elma: "🍎",
  armut: "🍐",
  uzum: "🍇",
  nar: "🍎",
  portakal: "🍊",
  mandalina: "🍊",
  limon: "🍋",
  greyfurt: "🍊",
  cilek: "🍓",
  kayisi: "🍑",
  seftali: "🍑",
  erik: "🍑",
  kiraz: "🍒",
  visne: "🍒",
  muz: "🍌",
  kivi: "🥝",
  kavun: "🍈",
  karpuz: "🍉",
  incir: "🫐",
  ayva: "🍐",
  ananas: "🍍",
  avokado: "🥑",
  hindistan_cevizi: "🥥",

  // Bakliyat & Tahıl
  "kuru-fasulye": "🫘",
  nohut: "🫘",
  mercimek: "🫘",
  bugday: "🌾",
  arpa: "🌾",
  yulaf: "🌾",
  pirinc: "🍚",
  bulgur: "🌾",

  // Balık ve Deniz Ürünleri
  balik: "🐟",
  hamsi: "🐟",
  sardalya: "🐟",
  istavrit: "🐟",
  lufer: "🐟",
  cinekop: "🐟",
  levrek: "🐟",
  cupra: "🐟",
  palamut: "🐟",
  mezgit: "🐟",
  kalamar: "🦑",
  karides: "🦐",
  ahtapot: "🐙",
  midye: "🐚",
};

const CATEGORY_EMOJI: Record<string, string> = {
  sebze: "🥬",
  meyve: "🍎",
  balik: "🐟",
  deniz_urunleri: "🐟",
  tahil: "🌾",
  bakliyat: "🫘",
  kuru_gida: "🌾",
  diger: "🌿",
};

const FALLBACK = "🌿";

/**
 * Slug veya kategoriye gore emoji doner.
 * 
 * @param slug Urunun slugu (örn: 'domates-salkim')
 * @param categorySlug Urunun kategori slugu (örn: 'sebze')
 */
export function getEmoji(slug: string, categorySlug?: string): string {
  if (!slug) return FALLBACK;

  const s = slug.toLowerCase();

  // 1. Tam eslesme
  if (EMOJI[s]) return EMOJI[s];

  // 2. Kismi eslesme (örn: 'patates-diger' -> 'patates' emojisini alir)
  for (const key in EMOJI) {
    if (s.startsWith(key + "-") || s.startsWith(key + "_")) {
      return EMOJI[key];
    }
  }

  // 3. Kategori bazli fallback
  if (categorySlug && CATEGORY_EMOJI[categorySlug]) {
    return CATEGORY_EMOJI[categorySlug];
  }

  // 4. Kelime bazli basit arama (slug icinde anahtar kelime geciyorsa)
  for (const key in EMOJI) {
    if (s.includes(key)) return EMOJI[key];
  }

  return FALLBACK;
}
