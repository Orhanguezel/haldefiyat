// Ürün adı anahtar kelimeleri → emoji (uzundan kısaya, önce daha spesifik olanlar)
const PRODUCT_EMOJI: [string, string][] = [
  // Sebzeler
  ["domates", "🍅"],
  ["biber", "🌶"],
  ["patlican", "🍆"],
  ["patl", "🍆"],
  ["salatalik", "🥒"],
  ["salatal", "🥒"],
  ["kabak", "🫑"],
  ["ispanak", "🥬"],
  ["marul", "🥬"],
  ["lahana", "🥬"],
  ["brokoli", "🥦"],
  ["karnabahar", "🥦"],
  ["havuc", "🥕"],
  ["sogan", "🧅"],
  ["sari sogan", "🧅"],
  ["kirmizi sogan", "🧅"],
  ["patates", "🥔"],
  ["sarimsak", "🧄"],
  ["pazi", "🥬"],
  ["pirasa", "🥬"],
  ["enginar", "🌿"],
  ["kusbasi", "🥬"],
  ["nohut", "🫘"],
  ["fasulye", "🫘"],
  ["barbunya", "🫘"],
  ["mercimek", "🫘"],
  ["misir", "🌽"],
  ["bostan", "🍉"],
  ["kavun", "🍈"],
  ["karpuz", "🍉"],
  // Meyveler
  ["cilek", "🍓"],
  ["kiraz", "🍒"],
  ["visne", "🍒"],
  ["erik", "🍑"],
  ["seftali", "🍑"],
  ["kayisi", "🍑"],
  ["kayseri", "🍑"],
  ["armut", "🍐"],
  ["elma", "🍎"],
  ["nar", "🍎"],
  ["ayva", "🍐"],
  ["uuzum", "🍇"],
  ["uzum", "🍇"],
  ["incir", "🍈"],
  ["dut", "🍇"],
  ["mandalina", "🍊"],
  ["portakal", "🍊"],
  ["limon", "🍋"],
  ["greyfurt", "🍋"],
  ["avokado", "🥑"],
  ["muz", "🍌"],
  ["kivi", "🥝"],
  ["ananas", "🍍"],
  ["papaya", "🍍"],
  ["passion", "🌺"],
  ["lychee", "🌺"],
  ["litchi", "🌺"],
  ["karambola", "⭐"],
  // Otlar / baharatlar
  ["adacayi", "🌿"],
  ["kekik", "🌿"],
  ["nane", "🌿"],
  ["maydanoz", "🌿"],
  ["dereotu", "🌿"],
  ["roka", "🌿"],
  ["fesleg", "🌿"],
  // Balık / deniz ürünleri
  ["zargana", "🐟"],
  ["baliklar", "🐟"],
  ["balik", "🐟"],
  ["uskumru", "🐟"],
  ["hamsi", "🐟"],
  ["istavrit", "🐟"],
  ["kolyoz", "🐟"],
  ["palamut", "🐟"],
  ["barbun", "🐟"],
  ["levrek", "🐟"],
  ["cipura", "🐟"],
  ["lagos", "🐟"],
  ["kefal", "🐟"],
  ["lufer", "🐟"],
  ["midye", "🦪"],
  ["karides", "🦐"],
  ["istakoz", "🦞"],
  ["ahtapot", "🐙"],
  ["kalamar", "🦑"],
  ["bakalyaro", "🐟"],
  ["ton", "🐟"],
  // Tahıl / kurubaklagil
  ["bugday", "🌾"],
  ["arpa", "🌾"],
  ["misir unu", "🌽"],
  ["un", "🌾"],
  ["pirinc", "🌾"],
  // Fındık / kuru yemiş
  ["findik", "🌰"],
  ["ceviz", "🌰"],
  ["badem", "🌰"],
  ["fistik", "🌰"],
  ["susam", "🌾"],
];

const CATEGORY_EMOJI: Record<string, string> = {
  "sebze-meyve": "🥬",
  sebze: "🥬",
  meyve: "🍎",
  balik: "🐟",
  deniz_urunleri: "🐟",
  tahil: "🌾",
  bakliyat: "🫘",
  kuru_gida: "🌾",
  diger: "🌿",
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[İI]/g, "i")
    .replace(/[Ğğ]/g, "g")
    .replace(/[Şş]/g, "s")
    .replace(/[Çç]/g, "c")
    .replace(/[Üü]/g, "u")
    .replace(/[Öö]/g, "o")
    .replace(/[Ää]/g, "a")
    .replace(/[^a-z0-9 ]/g, "");
}

export function getEmojiByProductName(nameTr: string): string {
  const n = normalize(nameTr);
  for (const [key, emoji] of PRODUCT_EMOJI) {
    if (n.includes(key)) return emoji;
  }
  return "";
}

export function getEmojiByCategorySlug(slug: string): string {
  if (!slug) return "🌿";
  const s = slug.toLowerCase();
  for (const key of Object.keys(CATEGORY_EMOJI)) {
    if (s === key || s.startsWith(key)) return CATEGORY_EMOJI[key]!;
  }
  return "🌿";
}

export function getProductEmoji(nameTr: string, categorySlug: string): string {
  return getEmojiByProductName(nameTr) || getEmojiByCategorySlug(categorySlug) || "🌿";
}
