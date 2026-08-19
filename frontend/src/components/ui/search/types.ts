import type { Product, Market } from "@/lib/api";

export interface SearchResults {
  products: Product[];
  markets: Market[];
}

export type SearchFlatRow =
  | { kind: "product"; item: Product }
  | { kind: "market"; item: Market };

export function normalizeSearch(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/**
 * Sesli aramada soylenen cumleyi urun eslesmesine cevirir:
 * "domates fiyatlari bugun kac lira" -> "domates".
 * Dolgu kelimeler atilir; geriye bir sey kalmazsa orijinal dondurulur.
 */
const VOICE_FILLER_WORDS = new Set([
  "fiyat", "fiyati", "fiyatı", "fiyatlari", "fiyatları",
  "kac", "kaç", "lira", "tl", "para", "ne", "kadar",
  "bugun", "bugün", "guncel", "güncel", "hal", "hali", "toptan",
  "goster", "göster", "bak", "ara", "acaba", "kilosu", "kilo",
]);

export function cleanVoiceQuery(transcript: string): string {
  const words = transcript
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const kept = words.filter((w) => !VOICE_FILLER_WORDS.has(w));
  const cleaned = kept.join(" ").trim();
  return cleaned.length >= 2 ? cleaned : transcript.trim();
}

const RECENT_KEY = "hf_recent_searches";
const RECENT_MAX = 5;

export function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): void {
  const q = query.trim();
  if (q.length < 2) return;
  try {
    const list = [q, ...getRecentSearches().filter((x) => x.toLocaleLowerCase("tr-TR") !== q.toLocaleLowerCase("tr-TR"))];
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
  } catch {
    /* private mod vb. — sessiz gec */
  }
}

export function removeRecentSearch(query: string): string[] {
  try {
    const list = getRecentSearches().filter((x) => x !== query);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function unwrapArray<T>(json: unknown): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}
