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

interface PolatliRawRow {
  UrunAdi?: unknown;
  MinFiyat?: unknown;
  MaxFiyat?: unknown;
  OrtFiyat?: unknown;
  Miktar?: unknown;
  Birimi?: unknown;
}

interface PolatliBucket {
  name: string;
  category: string;
  unit: string;
  mins: number[];
  maxs: number[];
  avgs: number[];
  weightedTotal: number;
  quantityTotal: number;
}

function rawTrNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  return parseTrNumber(value);
}

export function parsePolatliBorsaJson(raw: unknown): BorsaPriceRow[] {
  const obj = raw as { Bulten?: unknown };
  const list = Array.isArray(obj?.Bulten) ? obj.Bulten : Array.isArray(raw) ? raw : [];
  const buckets = new Map<string, PolatliBucket>();

  for (const item of list) {
    const row = item as PolatliRawRow;
    const rawName = typeof row.UrunAdi === "string" ? row.UrunAdi.trim() : "";
    if (!rawName) continue;

    const product = PRODUCT_CATEGORY.find((p) => p.pattern.test(rawName));
    if (!product) continue;

    const min = rawTrNumber(row.MinFiyat);
    const max = rawTrNumber(row.MaxFiyat);
    const avg = rawTrNumber(row.OrtFiyat) ?? (min != null && max != null ? (min + max) / 2 : null);
    if (avg == null || avg <= 0) continue;

    const unit = typeof row.Birimi === "string" && row.Birimi.trim()
      ? row.Birimi.trim().toLocaleLowerCase("tr-TR")
      : "kg";
    const quantity = rawTrNumber(row.Miktar);
    const bucket = buckets.get(product.name) ?? {
      name: product.name,
      category: product.category,
      unit,
      mins: [],
      maxs: [],
      avgs: [],
      weightedTotal: 0,
      quantityTotal: 0,
    };

    if (min != null && min > 0) bucket.mins.push(asKg(min, unit));
    if (max != null && max > 0) bucket.maxs.push(asKg(max, unit));
    bucket.avgs.push(asKg(avg, unit));

    if (quantity != null && quantity > 0) {
      bucket.weightedTotal += asKg(avg, unit) * quantity;
      bucket.quantityTotal += quantity;
    }

    buckets.set(product.name, bucket);
  }

  return Array.from(buckets.values()).map((bucket) => {
    const avg = bucket.quantityTotal > 0
      ? bucket.weightedTotal / bucket.quantityTotal
      : bucket.avgs.reduce((sum, value) => sum + value, 0) / bucket.avgs.length;
    return {
      name: bucket.name,
      category: bucket.category,
      unit: bucket.unit,
      min: bucket.mins.length > 0 ? Math.min(...bucket.mins) : avg,
      max: bucket.maxs.length > 0 ? Math.max(...bucket.maxs) : avg,
      avg,
    };
  });
}
