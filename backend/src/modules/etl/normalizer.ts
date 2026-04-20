import { db } from "@/db/client";
import { hfProducts } from "@/db/schema";
import { eq } from "drizzle-orm";

// Türkçe karakter normalizasyonu: Havuç → havuc, ÜZÜM → uzum, DİĞER → diger.
// toLocaleLowerCase('tr-TR') şart: default toLowerCase() "İ"yi combining dot
// ile "i̇" yaparak slug'ı "di-ger" gibi kırık çıkarır.
export function turkishToAscii(str: string): string {
  return str
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

// Ürün eşleştirme haritası: normalize(alias) → product slug
let _aliasMap: Map<string, string> | null = null;
let _aliasMapAt = 0;
const ALIAS_TTL_MS = 5 * 60 * 1000; // 5 dakika cache

export async function getAliasMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (_aliasMap && now - _aliasMapAt < ALIAS_TTL_MS) return _aliasMap;

  const products = await db
    .select({ slug: hfProducts.slug, nameTr: hfProducts.nameTr, aliases: hfProducts.aliases })
    .from(hfProducts)
    .where(eq(hfProducts.isActive, 1));

  const map = new Map<string, string>();
  for (const p of products) {
    // Ana isim
    map.set(turkishToAscii(p.nameTr), p.slug);
    // Alias varyantları
    const aliases = (p.aliases as string[] | null) ?? [];
    for (const alias of aliases) {
      map.set(turkishToAscii(alias), p.slug);
    }
  }

  _aliasMap = map;
  _aliasMapAt = now;
  return map;
}

// Ham API ürün adından slug bul; bulunamazsa null döner
export async function resolveProductSlug(rawName: string): Promise<string | null> {
  const map = await getAliasMap();
  return map.get(turkishToAscii(rawName)) ?? null;
}

// Cache'i geçersiz kıl (yeni ürün eklendikten sonra çağrılır)
export function invalidateAliasCache(): void {
  _aliasMap = null;
  _aliasMapAt = 0;
}
