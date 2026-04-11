/**
 * İstanbul İBB Hal Fiyatları API entegrasyonu
 *
 * Swagger: https://halfiyatlaripublicdata.ibb.gov.tr/swagger/ui/index
 * Kayıt gerektirmez, açık REST API.
 *
 * Temel endpoint'ler:
 *   GET /api/HalFiyat/GetUrunFiyatListesi
 *     ?startDate=2025-01-01&endDate=2025-01-01
 *     → [{UrunAdi, MinFiyat, MaxFiyat, OrtalamaFiyat, Tarih, Birim}, ...]
 */

import { db } from "@/db/client";
import { hfMarkets, hfEtlRuns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveProductSlug } from "./normalizer";
import { upsertPriceRow } from "@/modules/prices/repository";

const IBB_BASE = "https://halfiyatlaripublicdata.ibb.gov.tr";
const SOURCE_API = "ibb";
const IBB_MARKET_SLUG = "istanbul-hal";

// IBB API yanıt tipi (alan adları Türkçe/PascalCase)
interface IbbPriceRow {
  UrunAdi:       string;
  MinFiyat:      number | null;
  MaxFiyat:      number | null;
  OrtalamaFiyat: number | null;
  Tarih:         string;
  Birim?:        string;
}

async function fetchIbbPrices(date: string): Promise<IbbPriceRow[]> {
  const url = `${IBB_BASE}/api/HalFiyat/GetUrunFiyatListesi?startDate=${date}&endDate=${date}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`IBB API HTTP ${res.status}`);
  const data: unknown = await res.json();
  if (Array.isArray(data)) return data as IbbPriceRow[];
  const obj = data as Record<string, unknown>;
  return ((obj?.value ?? obj?.data ?? []) as IbbPriceRow[]);
}

export async function runIbbFetch(targetDate?: string): Promise<{
  inserted: number; skipped: number; errors: string[];
}> {
  const date = targetDate ?? new Date().toISOString().slice(0, 10);
  const t0 = Date.now();
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // İstanbul hal'inin DB id'sini al
  const marketRows = await db
    .select({ id: hfMarkets.id })
    .from(hfMarkets)
    .where(eq(hfMarkets.slug, IBB_MARKET_SLUG))
    .limit(1);

  if (!marketRows[0]) {
    throw new Error(`Market not found: ${IBB_MARKET_SLUG}`);
  }
  const marketId = marketRows[0].id;

  let rows: IbbPriceRow[] = [];
  try {
    rows = await fetchIbbPrices(date);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEtlRun({ sourceApi: SOURCE_API, runDate: date, rowsFetched: 0, rowsInserted: 0, rowsSkipped: 0, durationMs: Date.now() - t0, status: "error", errorMsg: msg });
    throw err;
  }

  for (const row of rows) {
    const productSlug = await resolveProductSlug(row.UrunAdi);
    if (!productSlug) {
      skipped++;
      continue;
    }

    // Ürün id'sini slug üzerinden bul
    const { db: dbRef } = await import("@/db/client");
    const { hfProducts } = await import("@/db/schema");
    const { eq: eqFn } = await import("drizzle-orm");
    const pRows = await dbRef.select({ id: hfProducts.id }).from(hfProducts).where(eqFn(hfProducts.slug, productSlug)).limit(1);
    if (!pRows[0]) { skipped++; continue; }

    const avg = row.OrtalamaFiyat ?? ((row.MinFiyat ?? 0 + (row.MaxFiyat ?? 0)) / 2);
    if (!avg) { skipped++; continue; }

    try {
      await upsertPriceRow({
        productId:   pRows[0].id,
        marketId,
        minPrice:    row.MinFiyat != null ? String(row.MinFiyat) : null,
        maxPrice:    row.MaxFiyat != null ? String(row.MaxFiyat) : null,
        avgPrice:    String(avg),
        recordedDate: date,
        sourceApi:   SOURCE_API,
      });
      inserted++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${row.UrunAdi}: ${msg}`);
    }
  }

  await logEtlRun({
    sourceApi:    SOURCE_API,
    runDate:      date,
    rowsFetched:  rows.length,
    rowsInserted: inserted,
    rowsSkipped:  skipped,
    durationMs:   Date.now() - t0,
    status:       errors.length > 0 ? "partial" : "ok",
    errorMsg:     errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
  });

  return { inserted, skipped, errors };
}

async function logEtlRun(params: {
  sourceApi:    string;
  runDate:      string;
  rowsFetched:  number;
  rowsInserted: number;
  rowsSkipped:  number;
  durationMs:   number;
  status:       "ok" | "partial" | "error";
  errorMsg:     string | null;
}) {
  try {
    await db.insert(hfEtlRuns).values({
      sourceApi:    params.sourceApi,
      runDate:      new Date(`${params.runDate}T00:00:00`),
      rowsFetched:  params.rowsFetched,
      rowsInserted: params.rowsInserted,
      rowsSkipped:  params.rowsSkipped,
      durationMs:   params.durationMs,
      status:       params.status,
      errorMsg:     params.errorMsg,
    });
  } catch {
    // log hatası ETL'i durdurmamalı
  }
}
