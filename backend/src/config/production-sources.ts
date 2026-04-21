/**
 * Yıllık üretim / istatistik ETL kaynakları.
 *
 * Günlük hal fiyatından ayrı bir domain — farklı tablo (hf_annual_production),
 * farklı cron (aylık). XLSX/CSV kaynakları burada toplanır.
 *
 * Yeni kaynak eklemek: bir kayıt + `production-fetcher.ts`'de parser.
 * Env override: HF_PROD_SOURCE_<KEY>_ENABLED | URL
 */

type ProductionShape =
  | "ibb_aquaculture_xlsx";   // İBB İstanbul yetiştiricilik XLSX

export interface ProductionSourceConfig {
  key:              string;
  enabled:          boolean;
  shape:            ProductionShape;
  url:              string;
  regionSlug:       string;        // "istanbul", "tr", "ege"...
  categorySlug:     string;        // "balik-kultur", "balik-deniz"...
  /** HTTP fetch timeout (ms) */
  timeoutMs:        number;
}

interface RawSource {
  key: string;
  defaultEnabled: boolean;
  shape: ProductionShape;
  defaultUrl: string;
  regionSlug: string;
  categorySlug: string;
}

const RAW_SOURCES: RawSource[] = [
  {
    key:             "ibb_istanbul_aquaculture",
    defaultEnabled:  true,
    shape:           "ibb_aquaculture_xlsx",
    defaultUrl:      "https://data.ibb.gov.tr/dataset/8ac37add-fa7c-4abe-9fd7-e04199158ebd/resource/99143f37-9c22-434d-be66-d6c95cb7f2ff/download/su-urunleri-yetitiricilik-uretim-miktar.xlsx",
    regionSlug:      "istanbul",
    categorySlug:    "balik-kultur",
  },
];

function envKey(key: string, suffix: string): string {
  return `HF_PROD_SOURCE_${key.toUpperCase()}_${suffix}`;
}

function envBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw == null || raw === "") return fallback;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function envStr(raw: string | undefined, fallback: string): string {
  return (raw ?? "").trim() || fallback;
}

function parseEnvInt(v: string | undefined, fallback: number): number {
  const n = parseInt(v ?? "", 10);
  return Number.isNaN(n) ? fallback : n;
}

export function loadProductionSources(): ProductionSourceConfig[] {
  const timeout = parseEnvInt(process.env.HF_PROD_TIMEOUT_MS, 45_000);
  return RAW_SOURCES.map((s) => ({
    key:          s.key,
    enabled:      envBool(process.env[envKey(s.key, "ENABLED")], s.defaultEnabled),
    shape:        s.shape,
    url:          envStr(process.env[envKey(s.key, "URL")], s.defaultUrl),
    regionSlug:   envStr(process.env[envKey(s.key, "REGION_SLUG")], s.regionSlug),
    categorySlug: envStr(process.env[envKey(s.key, "CATEGORY_SLUG")], s.categorySlug),
    timeoutMs:    timeout,
  }));
}

export function activeProductionSources(): ProductionSourceConfig[] {
  return loadProductionSources().filter((s) => s.enabled);
}

export function getProductionSourceByKey(key: string): ProductionSourceConfig | undefined {
  return loadProductionSources().find((s) => s.key === key);
}
