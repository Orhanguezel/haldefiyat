/**
 * Yıllık üretim/istatistik ETL fetcher.
 *
 * XLSX / CSV kaynakları indirip `hf_annual_production` tablosuna upsert eder.
 * Günlük fiyat fetcher'dan ayrı çünkü: farklı kadans (aylık), farklı tablo,
 * farklı veri modeli (tür × yıl × bölge → üretim tonu).
 *
 * Yeni format eklemek: yeni ProductionShape + parser fonksiyonu.
 */

import * as XLSX from "xlsx";
import { db } from "@/db/client";
import { hfAnnualProduction, hfAnnualEtlRuns } from "@/db/schema";
import { turkishToAscii } from "./normalizer";
import type { ProductionSourceConfig } from "@/config/production-sources";
import { activeProductionSources, getProductionSourceByKey } from "@/config/production-sources";

export interface ProductionRunResult {
  source:     string;
  inserted:   number;
  skipped:    number;
  errors:     string[];
  durationMs: number;
}

interface ProductionRow {
  year:          number;
  species:       string;
  speciesSlug:   string;
  categorySlug:  string;
  regionSlug:    string;
  productionTon: number;
  note?:         string | null;
}

// ── HTTP ────────────────────────────────────────────────────────────────────

async function downloadBuffer(url: string, timeoutMs: number): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: {
      // Bazı kamu portalleri (İBB Open Data vb.) bot UA'ları 403 ile reddediyor,
      // browser-benzeri UA kullanmak zorundayız.
      Accept:          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*",
      "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
      "User-Agent":    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.arrayBuffer();
}

// ── Slug util ───────────────────────────────────────────────────────────────

function slugifySpecies(raw: string): string {
  return turkishToAscii(raw)
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
}

// ── Parsers ─────────────────────────────────────────────────────────────────

/**
 * İBB İstanbul yetiştiricilik XLSX — 3 kolon: [Ürün Adı, Yıl, Üretim Miktarı (Ton)].
 * Başlık 1. satır, veri 2. satırdan itibaren.
 */
function parseIbbAquacultureXlsx(
  buf: ArrayBuffer,
  source: ProductionSourceConfig,
): ProductionRow[] {
  const wb = XLSX.read(buf, { type: "buffer" });
  const firstSheet = wb.Sheets[wb.SheetNames[0]!];
  if (!firstSheet) return [];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null });
  const out: ProductionRow[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const speciesRaw = r[0];
    const yearRaw    = r[1];
    const tonRaw     = r[2];
    if (speciesRaw == null || yearRaw == null || tonRaw == null) continue;
    const species = String(speciesRaw).trim();
    const year    = typeof yearRaw === "number" ? yearRaw : parseInt(String(yearRaw), 10);
    const ton     = typeof tonRaw === "number"  ? tonRaw  : parseFloat(String(tonRaw).replace(",", "."));
    if (!species || !Number.isFinite(year) || year < 1900 || year > 2100) continue;
    if (!Number.isFinite(ton) || ton < 0) continue;
    out.push({
      year,
      species,
      speciesSlug:   slugifySpecies(species),
      categorySlug:  source.categorySlug,
      regionSlug:    source.regionSlug,
      productionTon: ton,
    });
  }
  return out;
}

function parseProduction(
  shape: ProductionSourceConfig["shape"],
  buf: ArrayBuffer,
  source: ProductionSourceConfig,
): ProductionRow[] {
  switch (shape) {
    case "ibb_aquaculture_xlsx": return parseIbbAquacultureXlsx(buf, source);
    default:                     return [];
  }
}

// ── Upsert ──────────────────────────────────────────────────────────────────

async function upsertProductionRow(row: ProductionRow, sourceKey: string): Promise<void> {
  await db
    .insert(hfAnnualProduction)
    .values({
      year:          row.year,
      species:       row.species,
      speciesSlug:   row.speciesSlug,
      categorySlug:  row.categorySlug,
      regionSlug:    row.regionSlug,
      productionTon: row.productionTon.toFixed(2),
      sourceApi:     sourceKey,
      note:          row.note ?? null,
    })
    .onDuplicateKeyUpdate({
      set: {
        species:       row.species,
        categorySlug:  row.categorySlug,
        productionTon: row.productionTon.toFixed(2),
        sourceApi:     sourceKey,
        note:          row.note ?? null,
      },
    });
}

async function logRun(params: {
  sourceKey:    string;
  rowsFetched:  number;
  rowsInserted: number;
  rowsSkipped:  number;
  durationMs:   number;
  status:       "ok" | "partial" | "error";
  errorMsg:     string | null;
}) {
  try {
    await db.insert(hfAnnualEtlRuns).values({
      sourceApi:    params.sourceKey,
      rowsFetched:  params.rowsFetched,
      rowsInserted: params.rowsInserted,
      rowsSkipped:  params.rowsSkipped,
      durationMs:   params.durationMs,
      status:       params.status,
      errorMsg:     params.errorMsg,
    });
  } catch { /* log hatası ETL'i durdurmamalı */ }
}

// ── Orchestration ───────────────────────────────────────────────────────────

export async function runProductionSource(source: ProductionSourceConfig): Promise<ProductionRunResult> {
  const t0 = Date.now();
  let inserted = 0;
  let skipped  = 0;
  const errors: string[] = [];

  let rows: ProductionRow[];
  try {
    const buf = await downloadBuffer(source.url, source.timeoutMs);
    rows = parseProduction(source.shape, buf, source);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logRun({
      sourceKey: source.key, rowsFetched: 0, rowsInserted: 0, rowsSkipped: 0,
      durationMs: Date.now() - t0, status: "error", errorMsg: msg,
    });
    return { source: source.key, inserted: 0, skipped: 0, errors: [msg], durationMs: Date.now() - t0 };
  }

  for (const row of rows) {
    try {
      await upsertProductionRow(row, source.key);
      inserted++;
    } catch (err) {
      errors.push(`${row.species} ${row.year}: ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
    }
  }

  await logRun({
    sourceKey:    source.key,
    rowsFetched:  rows.length,
    rowsInserted: inserted,
    rowsSkipped:  skipped,
    durationMs:   Date.now() - t0,
    status:       errors.length > 0 ? "partial" : rows.length === 0 ? "error" : "ok",
    errorMsg:     errors.length > 0
      ? errors.slice(0, 5).join("; ")
      : rows.length === 0 ? "Kaynak satır üretmedi" : null,
  });

  return { source: source.key, inserted, skipped, errors, durationMs: Date.now() - t0 };
}

export async function runAllProductionSources(): Promise<ProductionRunResult[]> {
  const results: ProductionRunResult[] = [];
  for (const source of activeProductionSources()) {
    try {
      results.push(await runProductionSource(source));
    } catch (err) {
      results.push({
        source:     source.key,
        inserted:   0,
        skipped:    0,
        errors:     [err instanceof Error ? err.message : String(err)],
        durationMs: 0,
      });
    }
  }
  return results;
}

export async function runSingleProductionSource(key: string): Promise<ProductionRunResult> {
  const source = getProductionSourceByKey(key);
  if (!source) throw new Error(`Bilinmeyen production kaynağı: ${key}`);
  if (!source.enabled) throw new Error(`Production kaynağı devre dışı: ${key}`);
  return runProductionSource(source);
}
