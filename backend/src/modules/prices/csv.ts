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
  "Ortalama Yöntemi",
  "Birim",
  "Para Birimi",
  "Tarih",
  "Kaynak Adı",
  "Kaynak URL",
  "Kaynak Türü",
  "Resmi Kaynak",
  "Kaynak Kodu",
  "Uygulanan Filtreler",
  "Dışa Aktarım Zamanı",
];

export type PriceExportRow = {
  productName:  string;
  categorySlug: string;
  marketName:   string;
  cityName:     string;
  minPrice:     string | number | null;
  maxPrice:     string | number | null;
  avgPrice:     string | number;
  avgPriceMethod: string;
  unit:         string;
  currency:     string;
  recordedDate: Date | string;
  sourceApi:    string;
  sourceName?:  string | null;
  sourceUrl?:   string | null;
  sourceType?:  string | null;
  isOfficialSource?: boolean;
};

export type PriceExportMetadata = {
  filters?: Record<string, string | boolean | null | undefined>;
  exportedAt?: string;
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
function filterSummary(filters: PriceExportMetadata["filters"]): string {
  if (!filters) return "Filtre yok";
  const labels: Record<string, string> = {
    product: "ürün",
    q: "arama",
    city: "şehir",
    market: "hal",
    marketType: "kaynak türü",
    category: "kategori",
    unit: "birim",
    range: "tarih aralığı",
    latestOnly: "yalnız son kayıt",
  };
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${labels[key] ?? key}=${String(value)}`);
  return entries.length ? entries.join("; ") : "Filtre yok";
}

export function toCsvPayload(rows: PriceExportRow[], metadata: PriceExportMetadata = {}): string {
  const filters = filterSummary(metadata.filters);
  const exportedAt = metadata.exportedAt ?? new Date().toISOString();
  const body = rows.map((r) => [
    r.productName,
    r.categorySlug,
    r.marketName,
    r.cityName,
    r.minPrice ?? "",
    r.maxPrice ?? "",
    r.avgPrice,
    r.avgPriceMethod,
    r.unit,
    r.currency,
    toIsoDateOnly(r.recordedDate),
    r.sourceName ?? "Resmî fiyat kaynağı",
    r.sourceUrl ?? "",
    r.sourceType ?? "",
    r.isOfficialSource ? "Evet" : "Hayır",
    r.sourceApi,
    filters,
    exportedAt,
  ]);
  return toCsvDocument(CSV_HEADERS, body);
}
