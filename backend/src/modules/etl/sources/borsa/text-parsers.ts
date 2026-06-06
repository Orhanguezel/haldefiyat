import type { BorsaPriceRow } from "./types";

const PRODUCT_CATEGORY: Array<{ pattern: RegExp; name: string; category: string }> = [
  { pattern: /\b(ekmeklik\s+)?bu[ğg]day\b/i, name: "Buğday", category: "hububat" },
  { pattern: /\barpa\b/i, name: "Arpa", category: "hububat" },
  { pattern: /\bm[ıi]s[ıi]r\b/i, name: "Mısır", category: "hububat" },
  { pattern: /\bay[çc]i[çc]e[ğg]i\b|\bay[çc]icegi\b/i, name: "Ayçiçeği", category: "yagli-tohum" },
  { pattern: /\bpamuk\b/i, name: "Pamuk", category: "sanayi-bitkisi" },
];

function parseTrNumber(raw: string): number | null {
  const cleaned = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function asKg(price: number, line: string): number {
  return /ton|tona|tl\/t|tl\s*t/i.test(line) || price > 500 ? price / 1000 : price;
}

export function parseBorsaText(raw: string): BorsaPriceRow[] {
  const rows: BorsaPriceRow[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const product = PRODUCT_CATEGORY.find((p) => p.pattern.test(line));
    if (!product) continue;

    const nums = Array.from(line.matchAll(/\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:[,.]\d+)?/g))
      .map((m) => parseTrNumber(m[0]))
      .filter((n): n is number => n != null && n > 0);
    const priceNums = nums.filter((n) => n >= 1);
    if (priceNums.length === 0) continue;

    const minRaw = priceNums.length >= 3 ? priceNums[priceNums.length - 3]! : Math.min(...priceNums);
    const maxRaw = priceNums.length >= 2 ? priceNums[priceNums.length - 2]! : Math.max(...priceNums);
    const avgRaw = priceNums[priceNums.length - 1]!;

    rows.push({
      name: product.name,
      category: product.category,
      unit: "kg",
      min: asKg(Math.min(minRaw, maxRaw), line),
      max: asKg(Math.max(minRaw, maxRaw), line),
      avg: asKg(avgRaw, line),
    });
  }
  return rows;
}

export function parseBorsaHtml(raw: string): BorsaPriceRow[] {
  const text = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(tr|p|div|li|td|th)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
  return parseBorsaText(text.replace(/ (?=(Buğday|Bugday|Arpa|Mısır|Misir|Ayçiçeği|Aycicegi|Pamuk)\b)/gi, "\n"));
}

