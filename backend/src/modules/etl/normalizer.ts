import { db } from "@/db/client";
import { hfProducts } from "@/db/schema";
import { eq } from "drizzle-orm";

const PRODUCT_NAME_SPELLING_FIXES: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bavakado\b/giu, replacement: "Avokado" },
];

export function normalizeRawProductName(rawName: string): string {
  return PRODUCT_NAME_SPELLING_FIXES.reduce(
    (value, rule) => value.replace(rule.pattern, rule.replacement),
    rawName.replace(/\s+/g, " ").trim(),
  );
}

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

// Birim sınıfı: farklı yazımları tek sınıfa indirger. Birim, ürün kimliğinin
// parçasıdır — kg ile adet aynı ürün sayılmaz (fiyatları karışmaz).
const UNIT_CLASS: ReadonlyArray<[RegExp, string]> = [
  [/^(kg|kilo|kilogram)\b/i, "kg"],
  [/^(adet|tane|ad)\b/i, "adet"],
  [/^(demet)\b/i, "demet"],
  [/^(kasa)\b/i, "kasa"],
  [/^(paket|pk)\b/i, "paket"],
  [/^(bag|bag)\b/i, "bag"],
  [/^(litre|lt|l)\b/i, "litre"],
];

export function unitClass(unit: string | null | undefined): string {
  const u = turkishToAscii(unit ?? "").trim();
  for (const [re, cls] of UNIT_CLASS) if (re.test(u)) return cls;
  return u || "kg";
}

// Kanonik eşleştirme anahtarı: tr-ascii + noktalama sil + kelimeleri SIRALA + birim sınıfı.
// "Aysberg Marul", "Marul Aysberg", "Marul, Aysberg" (aynı birim) → AYNI anahtar.
// (Eşanlamlı aysberg/iceberg gibi farklar için ürünün alias'ları yeterlidir.)
export function productMatchKey(rawName: string, unit?: string | null): string {
  const base = turkishToAscii(normalizeRawProductName(rawName))
    .replace(/[.,()/\\_'"’-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = base.split(" ").filter(Boolean).sort();
  return `${tokens.join(" ")}|${unitClass(unit)}`;
}

// İki harita: exact (birebir isim, legacy) + byKey (birim-kapsamlı eşleştirme anahtarı).
let _exactMap: Map<string, string> | null = null;
let _keyMap: Map<string, string> | null = null;
let _mapsAt = 0;
const ALIAS_TTL_MS = 5 * 60 * 1000; // 5 dakika cache

async function getMaps(): Promise<{ exact: Map<string, string>; byKey: Map<string, string> }> {
  const now = Date.now();
  if (_exactMap && _keyMap && now - _mapsAt < ALIAS_TTL_MS) return { exact: _exactMap, byKey: _keyMap };

  const products = await db
    .select({ slug: hfProducts.slug, nameTr: hfProducts.nameTr, aliases: hfProducts.aliases, unit: hfProducts.unit })
    .from(hfProducts)
    .where(eq(hfProducts.isActive, 1));

  const exact = new Map<string, string>();
  const byKey = new Map<string, string>();
  for (const p of products) {
    const names = [p.nameTr, ...((p.aliases as string[] | null) ?? [])].filter(Boolean);
    for (const name of names) {
      exact.set(turkishToAscii(name), p.slug);
      // Birim-kapsamlı anahtar (ilk gelen kazanır — çakışma nadir)
      const k = productMatchKey(name, p.unit);
      if (!byKey.has(k)) byKey.set(k, p.slug);
    }
  }

  _exactMap = exact;
  _keyMap = byKey;
  _mapsAt = now;
  return { exact, byKey };
}

export async function getAliasMap(): Promise<Map<string, string>> {
  return (await getMaps()).exact;
}

// Ham API ürün adı (+birim) → slug. Önce birim-kapsamlı anahtar (varyantları toplar),
// sonra legacy birebir isim (emniyet ağı). Bulunamazsa null.
export async function resolveProductSlug(rawName: string, unit?: string | null): Promise<string | null> {
  const { exact, byKey } = await getMaps();
  if (unit != null) {
    const hit = byKey.get(productMatchKey(rawName, unit));
    if (hit) return hit;
  }
  return exact.get(turkishToAscii(normalizeRawProductName(rawName))) ?? null;
}

// Cache'i geçersiz kıl (yeni ürün eklendikten / merge sonrası çağrılır)
export function invalidateAliasCache(): void {
  _exactMap = null;
  _keyMap = null;
  _mapsAt = 0;
}
