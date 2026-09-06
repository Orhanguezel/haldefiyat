/** Source evidence shared by ingestion and public retail comparisons. */
export const MARKETFIYATI_SOURCE = "https://marketfiyati.org.tr/";

export function retailUnit(value: string): "kg" | "litre" | null {
  const unit = value.trim().toLocaleLowerCase("tr-TR");
  if (["kg", "kilogram"].includes(unit)) return "kg";
  if (["l", "lt", "litre", "liter"].includes(unit)) return "litre";
  return null;
}

export function sourceDate(value: string | undefined, today: string): string | null {
  const match = value?.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+\d{2}:\d{2}$/);
  if (!match) return null;
  const date = `${match[3]}-${match[2]}-${match[1]}`;
  const ms = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== date) return null;
  const age = (Date.parse(`${today}T00:00:00Z`) - ms) / 86_400_000;
  return age >= 0 && age <= 3 ? date : null;
}

export function plainRetailTitle(raw: string): string {
  return raw.toLocaleLowerCase("tr-TR").replace(/ı/g, "i").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/ş/g, "s").replace(/ç/g, "c")
    .replace(/[()]/g, " ")
    .replace(/(?:\s+\d+(?:[.,]\d+)?\s*(?:kg|gr?|ml|lt?|adet)|\s+(?:kg|adet|paket|demet|file))+\s*$/u, "")
    .replace(/^markasiz\s+/, "").replace(/\s+/g, " ").trim();
}

export function retailTitleMatches(slug: string, raw: string): boolean {
  const name = plainRetailTitle(raw);
  if (!name || /\b(kurutulmus|kurusu|dondurulmus|donuk|konserve|salca|sos|parmak|cips|puresi)\b/.test(name)) return false;
  // Never erase a variety to make a broad vegetable match.
  const generic: Record<string, readonly string[]> = {
    domates: ["domates"], patates: ["patates"], salatalik: ["salatalik", "hiyar"],
    limon: ["limon", "limon taze"], "sogan-kuru": ["sogan", "kuru sogan"],
    havuc: ["havuc"], patlican: ["patlican"],
  };
  if (generic[slug]) return generic[slug]!.includes(name);
  if (slug === "dana-kiyma" || slug === "dana-kusbasi") return !/\b(kuzu|karisik|tavuk|hindi)\b/.test(name);
  if (slug === "yogurt") return !/incir|yulaf|probiyotik|meyve|cilek|cikolata|aroma|protein|kefir|suzme|manda|keci/.test(name);
  if (slug === "sut") return !/aroma|cilek|cikolata|muz|badem|yulaf|laktozsuz|protein|keci/.test(name);
  return true;
}

export interface DepotEvidence {
  unitPrice?: string; unitPriceValue: number; price: number; indexTime?: string;
  discount?: boolean; promotionText?: string | null;
}

export function verifiedDepot(depot: DepotEvidence, expectedUnit: string, today: string) {
  const unit = retailUnit(depot.unitPrice?.split("/").at(-1) ?? "");
  const date = sourceDate(depot.indexTime, today);
  if (!unit || unit !== retailUnit(expectedUnit) || !date || depot.discount || depot.promotionText?.trim()) return null;
  const price = Number(depot.unitPriceValue);
  if (!Number.isFinite(price) || price <= 0) return null;
  return { unit, date, price };
}

export function trustedRetailSource(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      ["marketfiyati.org.tr", "www.marketfiyati.org.tr", "www.migros.com.tr"].includes(parsed.hostname);
  } catch { return false; }
}

/** Descriptive evidence only: unknown attributes never imply equivalent quality. */
export function retailVariant(slug: string, raw: string) {
  const title = raw.toLocaleLowerCase("tr-TR");
  const name = plainRetailTitle(raw);
  const size = [...title.matchAll(/(\d+(?:[.,]\d+)?)\s*(kg|gr|g|ml|lt|l)\b/gu)].at(-1);
  const quantity = size ? Number(size[1]!.replace(",", ".")) : null;
  const unit = size?.[2];
  const count = Number(title.match(/(\d+)\s*[x×]\s*\d/u)?.[1] ?? 1);
  const packageAmount = quantity == null ? null : quantity * count / (unit === "g" || unit === "gr" || unit === "ml" ? 1000 : 1);
  const packageUnit = unit ? (unit === "ml" || unit === "lt" || unit === "l" ? "litre" : "kg") : null;
  const percent = title.match(/%\s*(\d+(?:[.,]\d+)?)/u)?.[1];
  const fat = percent ? `%${percent}` : /yarim yagli/.test(name) ? "Yarım yağlı"
    : /tam yagli/.test(name) ? "Tam yağlı" : /yagsiz|light|az yagli/.test(name) ? "Az yağlı/yağsız" : "Belirtilmemiş";
  const kind = slug === "sut" ? (/uht/.test(name) ? "UHT süt" : /pastorize|gunluk/.test(name) ? "Pastörize/günlük süt" : "Süt; işlem türü belirtilmemiş")
    : slug === "yogurt" ? (/suzme/.test(name) ? "Süzme yoğurt" : /kaymaksiz/.test(name) ? "Kaymaksız yoğurt" : /kaymakli/.test(name) ? "Kaymaklı yoğurt" : "Yoğurt; türü belirtilmemiş")
    : null;
  return { fat: slug === "sut" || slug === "yogurt" || slug === "beyaz-peynir" ? fat : null, kind, packageAmount, packageUnit };
}

/** Historical peers must describe the same branded offer, including pack size. */
export function sameRetailOffer(a: string | null | undefined, b: string | null | undefined): boolean {
  const normalize = (s: string) => s.toLocaleLowerCase("tr-TR").replace(/\s+/gu, " ").trim();
  return !!a?.trim() && !!b?.trim() && normalize(a) === normalize(b);
}

export function depotRejectionReason(depot: DepotEvidence, expectedUnit: string, today: string): string | null {
  if (depot.discount || depot.promotionText?.trim()) return "PROMOTION";
  if (!sourceDate(depot.indexTime, today)) return "SOURCE_DATE_INVALID_OR_STALE";
  const unit = retailUnit(depot.unitPrice?.split("/").at(-1) ?? "");
  if (!unit || unit !== retailUnit(expectedUnit)) return "UNIT_MISSING_OR_MISMATCH";
  if (!Number.isFinite(Number(depot.unitPriceValue)) || Number(depot.unitPriceValue) <= 0) return "PRICE_INVALID";
  return null;
}
