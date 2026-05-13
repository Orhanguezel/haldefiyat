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

export function getEmojiByCategorySlug(slug: string): string {
  if (!slug) return "🌿";
  const s = slug.toLowerCase();
  for (const key of Object.keys(CATEGORY_EMOJI)) {
    if (s === key || s.startsWith(key)) return CATEGORY_EMOJI[key];
  }
  return "🌿";
}
