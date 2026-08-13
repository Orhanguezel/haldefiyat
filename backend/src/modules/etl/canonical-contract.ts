import { normalizeRawProductName, productMatchKey, turkishToAscii } from "./normalizer";

export const CANONICAL_UNITS = ["kg", "adet", "kasa", "bag", "demet", "koli", "paket", "litre", "ton"] as const;
export type CanonicalUnit = typeof CANONICAL_UNITS[number];

const UNIT_RULES: ReadonlyArray<[RegExp, CanonicalUnit]> = [
  [/^(kg|kilo|kilogram)(?:\b|\.)/i, "kg"],
  [/^(adet|tane|ad)(?:\b|\.)/i, "adet"],
  [/^(kasa|sandik)(?:\b|\.)/i, "kasa"],
  [/^(bag)(?:\b|\.)/i, "bag"],
  [/^(demet)(?:\b|\.)/i, "demet"],
  [/^(koli|kutu)(?:\b|\.)/i, "koli"],
  [/^(paket|pk)(?:\b|\.)/i, "paket"],
  [/^(litre|lt|l)(?:\b|\.)/i, "litre"],
  [/^(ton|tonne)(?:\b|\.)/i, "ton"],
];

export function canonicalUnit(raw: string | null | undefined): CanonicalUnit | null {
  const normalized = turkishToAscii(raw ?? "")
    .replace(/[()]/g, " ")
    .replace(/^\s*\d+(?:[.,]\d+)?\s*/, "")
    .trim();
  if (!normalized) return null;
  const candidates = [normalized, normalized.split(/\s+/).at(-1) ?? ""];
  for (const candidate of candidates) {
    for (const [rule, unit] of UNIT_RULES) if (rule.test(candidate)) return unit;
  }
  return null;
}
export type ProductMatchConfidence = "exact" | "normalized" | "alias" | "unmatched";

export interface CanonicalProductContract {
  id: number;
  slug: string;
  displayName: string;
  categorySlug: string;
  defaultUnit: CanonicalUnit;
  aliases: string[];
  canonicalSlug: string | null;
  familySlug: string | null;
  isVariant: boolean;
}

export interface ProductMatchDecision {
  confidence: ProductMatchConfidence;
  score: number;
  reviewRequired: boolean;
  reason: "EXACT_NAME" | "NORMALIZED_NAME" | "ALIAS" | "UNKNOWN_PRODUCT" | "UNKNOWN_UNIT";
  matchKey: string | null;
}

export function scoreProductMatch(input: {
  rawName: string;
  rawUnit?: string | null;
  canonicalName?: string | null;
  aliases?: readonly string[];
}): ProductMatchDecision {
  const unit = canonicalUnit(input.rawUnit);
  if (!unit) return { confidence: "unmatched", score: 0, reviewRequired: true, reason: "UNKNOWN_UNIT", matchKey: null };

  const raw = input.rawName.trim();
  const canonical = input.canonicalName?.trim() ?? "";
  const normalizedRaw = normalizeRawProductName(raw);
  const normalizedCanonical = normalizeRawProductName(canonical);
  const matchKey = productMatchKey(normalizedRaw, unit);

  if (canonical && raw === canonical) {
    return { confidence: "exact", score: 100, reviewRequired: false, reason: "EXACT_NAME", matchKey };
  }
  if (canonical && turkishToAscii(normalizedRaw) === turkishToAscii(normalizedCanonical)) {
    return { confidence: "normalized", score: 95, reviewRequired: false, reason: "NORMALIZED_NAME", matchKey };
  }
  const aliasHit = (input.aliases ?? []).some((alias) =>
    turkishToAscii(normalizeRawProductName(alias)) === turkishToAscii(normalizedRaw));
  if (aliasHit) return { confidence: "alias", score: 90, reviewRequired: false, reason: "ALIAS", matchKey };
  return { confidence: "unmatched", score: 0, reviewRequired: true, reason: "UNKNOWN_PRODUCT", matchKey };
}
