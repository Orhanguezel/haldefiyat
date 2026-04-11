/**
 * ETL Orkestratörü
 *
 * Cron zamanlaması: Her gün 06:15 (veriler sabah güncelleniyor)
 * Kayıt: hf_etl_runs tablosuna her çalışma sonucu yazılır
 *
 * Aktif kaynaklar:
 *   - ibb    → İstanbul hal fiyatları (en kapsamlı)
 *   - izmir  → İzmir hal fiyatları (Ege)
 *
 * Faz 2'de eklenecek: balikesir, bursa, konya (CSV/PDF scraper)
 */

import { runIbbFetch } from "./ibb-fetcher";
import { runIzmirFetch } from "./izmir-fetcher";
import { invalidateAliasCache } from "./normalizer";

export interface EtlResult {
  source:   string;
  inserted: number;
  skipped:  number;
  errors:   string[];
  durationMs: number;
}

export async function runDailyEtl(targetDate?: string): Promise<EtlResult[]> {
  const date = targetDate ?? new Date().toISOString().slice(0, 10);
  const results: EtlResult[] = [];

  // Her çalışma öncesi alias cache'ini temizle (DB güncel olabilir)
  invalidateAliasCache();

  const runners: Array<{ name: string; fn: (d: string) => Promise<{ inserted: number; skipped: number; errors: string[] }> }> = [
    { name: "ibb",   fn: runIbbFetch },
    { name: "izmir", fn: runIzmirFetch },
  ];

  for (const runner of runners) {
    const t0 = Date.now();
    try {
      const r = await runner.fn(date);
      results.push({ source: runner.name, ...r, durationMs: Date.now() - t0 });
    } catch (err) {
      results.push({
        source:     runner.name,
        inserted:   0,
        skipped:    0,
        errors:     [err instanceof Error ? err.message : String(err)],
        durationMs: Date.now() - t0,
      });
    }
  }

  return results;
}

// Manuel tetikleme: tek kaynak için
export async function runSingleSource(source: "ibb" | "izmir", targetDate?: string) {
  invalidateAliasCache();
  if (source === "ibb")   return runIbbFetch(targetDate);
  if (source === "izmir") return runIzmirFetch(targetDate);
}
