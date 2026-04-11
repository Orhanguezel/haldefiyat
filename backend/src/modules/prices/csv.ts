// CSV serileştirme yardımcıları — RFC 4180 uyumlu minimal implementasyon.
// Dış paket bağımlılığı yok; UTF-8 BOM + escape kuralları manuel.

const BOM = "\uFEFF";
const NEEDS_QUOTE = /[",\n\r]/;

export const CSV_HEADERS = [
  "Ürün",
  "Kategori",
  "Hal",
  "Şehir",
  "Min Fiyat",
  "Maks Fiyat",
  "Ort Fiyat",
  "Birim",
  "Para Birimi",
  "Tarih",
  "Kaynak",
];

export type PriceExportRow = {
  productName:  string;
  categorySlug: string;
  marketName:   string;
  cityName:     string;
  minPrice:     string | null;
  maxPrice:     string | null;
  avgPrice:     string;
  unit:         string;
  currency:     string;
  recordedDate: Date | string;
  sourceApi:    string;
};

export function toCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "number" ? String(value) : value;
  if (!NEEDS_QUOTE.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(toCsvField).join(",");
}

export function toCsvDocument(header: string[], rows: (string | number | null | undefined)[][]): string {
  const lines: string[] = [toCsvRow(header)];
  for (const r of rows) lines.push(toCsvRow(r));
  return BOM + lines.join("\r\n") + "\r\n";
}

export function toIsoDateOnly(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export function csvFilename(): string {
  return `hal-fiyatlari-${new Date().toISOString().slice(0, 10)}.csv`;
}

// Router'in dogrudan cagirdigi yuksek seviyeli helper
export function toCsvPayload(rows: PriceExportRow[]): string {
  const body = rows.map((r) => [
    r.productName,
    r.categorySlug,
    r.marketName,
    r.cityName,
    r.minPrice ?? "",
    r.maxPrice ?? "",
    r.avgPrice,
    r.unit,
    r.currency,
    toIsoDateOnly(r.recordedDate),
    r.sourceApi,
  ]);
  return toCsvDocument(CSV_HEADERS, body);
}
