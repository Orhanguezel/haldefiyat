import type { BorsaPriceRow } from "./types";

const PRODUCT_CATEGORY: Array<{ pattern: RegExp; name: string; category: string }> = [
  { pattern: /\b(ekmeklik\s+)?bu[ğg]day\b/i, name: "Buğday", category: "hububat" },
  { pattern: /\barpa\b/i, name: "Arpa", category: "hububat" },
  { pattern: /\bm[ıi]s[ıi]r\b/i, name: "Mısır", category: "hububat" },
  { pattern: /\b[çc]elt[ıi]k\b/i, name: "Çeltik", category: "hububat" },
  { pattern: /\bp[ıi]r[ıi]n[çc]\b/i, name: "Pirinç", category: "hububat" },
  { pattern: /\byulaf\b/i, name: "Yulaf", category: "hububat" },
  { pattern: /\b[çc]avdar\b/i, name: "Çavdar", category: "hububat" },
  { pattern: /\bay[çc]i[çc]e[ğg]i\b|\bay[çc]icegi\b/i, name: "Ayçiçeği", category: "yagli-tohum" },
  { pattern: /\bpamuk\b/i, name: "Pamuk", category: "sanayi-bitkisi" },
  { pattern: /\bmerc[ıi]mek\b/i, name: "Mercimek", category: "bakliyat-kuru" },
  { pattern: /\bnohut\b/i, name: "Nohut", category: "bakliyat-kuru" },
  { pattern: /\b(kuru\s+)?fasulye\b/i, name: "Kuru Fasulye", category: "bakliyat-kuru" },
];

function parseTrNumber(raw: string): number | null {
  const cleaned = raw
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function decodeHtmlText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
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
  return parseBorsaText(text.replace(/ (?=(Buğday|Bugday|Arpa|Mısır|Misir|Ayçiçeği|Aycicegi|Pamuk|Mercimek|Nohut|Kuru Fasulye|Fasulye)\b)/gi, "\n"));
}

function parseTrDate(raw: string): string | undefined {
  const match = raw.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+\d{1,2}:\d{2})?/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`;
}

function toTobbProduct(rawName: string): { name: string; category: string } | null {
  const name = rawName.toLocaleUpperCase("tr-TR");
  if (/BU[ĞG]DAY\b/.test(name)) {
    if (/EKMEKL[İI]K/.test(name)) return { name: "Ekmeklik Buğday", category: "hububat" };
    if (/DURUM/.test(name) || /MAKARNALIK/.test(name)) return { name: "Makarnalık Buğday", category: "hububat" };
    return { name: "Buğday", category: "hububat" };
  }
  if (/^ARPA\b/.test(name)) {
    return { name: "Arpa", category: "hububat" };
  }
  if (/MISIR\b|M[İI]S[İI]R\b/.test(name)) {
    return { name: "Mısır", category: "hububat" };
  }
  if (/ÇELT[İI]K\b|CELT[İI]K\b/.test(name)) {
    return { name: "Çeltik", category: "hububat" };
  }
  if (/P[İI]R[İI]N[ÇC]\b|PIRIN[ÇC]\b/.test(name)) {
    return { name: "Pirinç", category: "hububat" };
  }
  if (/YULAF\b/.test(name)) {
    return { name: "Yulaf", category: "hububat" };
  }
  if (/ÇAVDAR\b|CAVDAR\b/.test(name)) {
    return { name: "Çavdar", category: "hububat" };
  }
  if (/AY[ÇC][İI]ÇE[ĞG][İI]\s+YA[ĞG]LIK/.test(name)) {
    return { name: "Ayçiçeği", category: "yagli-tohum" };
  }
  if (/MERC[İI]MEK\b/.test(name)) {
    return { name: "Mercimek", category: "bakliyat-kuru" };
  }
  if (/NOHUT\b/.test(name)) {
    return { name: "Nohut", category: "bakliyat-kuru" };
  }
  if (/FASULYE\b/.test(name)) {
    return { name: "Kuru Fasulye", category: "bakliyat-kuru" };
  }
  if (/ZEYT[İI]NYA[ĞG]I\s+SIZMA/.test(name) || /ZEYT[İI]N\s*YA[ĞG]I\s+SIZMA/.test(name)) {
    return { name: "Zeytinyağı", category: "yagli-tohum" };
  }
  if (
    /ZEYT[İI]N\s+S[İI]YAH\s+SALAMUR/.test(name)
    || /ZEYT[İI]N\s+YE[ŞS][İI]L\s+HUSUS[İI]/.test(name)
    || (/^ZEYT[İI]N\b/.test(name) && !/ZEYT[İI]N\s*YA[ĞG](?:I|LIK)?\b/.test(name))
  ) {
    return { name: "Sofralık Zeytin", category: "sebze-meyve" };
  }
  return null;
}

function mergeSameDayRows(rows: BorsaPriceRow[]): BorsaPriceRow[] {
  const buckets = new Map<string, BorsaPriceRow[]>();
  for (const row of rows) {
    const key = `${row.name}|${row.recordedDate ?? ""}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(row);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).map((bucket) => {
    if (bucket.length === 1) return bucket[0]!;
    const first = bucket[0]!;
    const mins = bucket.map((row) => row.min).filter((value): value is number => value != null);
    const maxs = bucket.map((row) => row.max).filter((value): value is number => value != null);
    const avgs = bucket.map((row) => row.avg).filter((value): value is number => value != null);
    const avg = avgs.reduce((sum, value) => sum + value, 0) / avgs.length;
    return {
      name: first.name,
      category: first.category,
      unit: first.unit,
      recordedDate: first.recordedDate,
      min: mins.length > 0 ? Math.min(...mins) : avg,
      max: maxs.length > 0 ? Math.max(...maxs) : avg,
      avg,
    };
  });
}

export function parseTobbBorsaHtml(raw: string): BorsaPriceRow[] {
  const tableBlocks = raw.match(/<table\b[^>]*class=["'][^"']*\btable\b[^"']*["'][^>]*>[\s\S]*?<\/table>/gi) ?? [];
  const scopes = tableBlocks.length > 0 ? tableBlocks : [raw];
  const rows: BorsaPriceRow[] = [];

  for (const scope of scopes) {
    const trBlocks = scope.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
    for (const tr of trBlocks) {
      const cells = Array.from(tr.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi), (match) => decodeHtmlText(match[1] ?? ""));
      if (cells.length < 6 || /ürün/i.test(cells[0] ?? "")) continue;

      const product = toTobbProduct(cells[0] ?? "");
      if (!product) continue;

      const min = parseTrNumber(cells[3] ?? "");
      const max = parseTrNumber(cells[4] ?? "");
      const avg = parseTrNumber(cells[5] ?? "") ?? (min != null && max != null ? (min + max) / 2 : min ?? max);
      if (avg == null || avg <= 0) continue;

      const unit = (cells[1] ?? "kg").trim().toLocaleLowerCase("tr-TR") || "kg";
      rows.push({
        name: product.name,
        category: product.category,
        unit,
        recordedDate: parseTrDate(cells[2] ?? ""),
        min: min ?? avg,
        max: max ?? avg,
        avg,
      });
    }
  }

  return mergeSameDayRows(rows);
}

export function parseItbPamukPdfText(raw: string): BorsaPriceRow[] {
  const text = raw
    .replace(/\u00a0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ");

  const dateMatch = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(text);
  const recordedDate = dateMatch
    ? `${dateMatch[3]}-${dateMatch[2]!.padStart(2, "0")}-${dateMatch[1]!.padStart(2, "0")}`
    : undefined;

  const rows: BorsaPriceRow[] = [];

  const bulletinMatch = /52\s+Renk\/CGrd([\s\S]{0,1400}?)(?:Özel\s+Şartlı|Special\s+Conditions|Bir\s+Önce|Previous)/i.exec(text);
  if (bulletinMatch) {
    const values = Array.from((bulletinMatch[1] ?? "").matchAll(/[0-9]{1,3},[0-9]{2}/g))
      .map((match) => parseTrNumber(match[0]))
      .filter((value): value is number => value != null && value > 0);
    const tlValues = values.filter((_, index) => index % 3 === 0).filter((value) => value > 20);
    if (tlValues.length > 0) {
      const min = Math.min(...tlValues);
      const max = Math.max(...tlValues);
      rows.push({
        name: "Pamuk",
        category: "sanayi-bitkisi",
        unit: "kg",
        recordedDate,
        min,
        max,
        avg: (min + max) / 2,
      });
      return rows;
    }
  }

  const referenceMatch = /52\s+Renk\s+Pamuk[\s\S]{0,240}?([0-9]{1,3},[0-9]{2,3})/i.exec(text);
  const referencePrice = referenceMatch ? parseTrNumber(referenceMatch[1]!) : null;
  if (referencePrice != null && referencePrice > 0) {
    rows.push({
      name: "Pamuk",
      category: "sanayi-bitkisi",
      unit: "kg",
      recordedDate,
      min: referencePrice,
      max: referencePrice,
      avg: referencePrice,
    });
  }

  return rows;
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
