/**
 * ETL Orkestratörü — config/etl-sources.ts içindeki enabled kaynakları sırayla
 * çalıştırır. Yeni kaynak eklemek için SADECE config dosyası + env güncellenir.
 *
 * Cron zamanlaması: `ETL_CRON_SCHEDULE` env (varsayılan: "15 3 * * *" UTC).
 * Kayıt: her kaynağın her çalışması hf_etl_runs tablosuna yazılır.
 */

import { activeSources, getSourceByKey } from "@/config/etl-sources";
import { runSourceFetch, type EtlRunResult } from "./fetcher";
import { invalidateAliasCache } from "./normalizer";

export interface EtlResult extends EtlRunResult {
  source:     string;
  durationMs: number;
}

export async function runDailyEtl(targetDate?: string): Promise<EtlResult[]> {
  invalidateAliasCache();
  const results: EtlResult[] = [];

  for (const source of activeSources()) {
    const t0 = Date.now();
    try {
      const r = await runSourceFetch(source, targetDate);
      results.push({ source: source.key, ...r, durationMs: Date.now() - t0 });
    } catch (err) {
      results.push({
        source:     source.key,
        inserted:   0,
        skipped:    0,
        errors:     [err instanceof Error ? err.message : String(err)],
        durationMs: Date.now() - t0,
      });
    }
  }

  return results;
}

export async function runSingleSource(
  sourceKey: string,
  targetDate?: string,
): Promise<EtlRunResult> {
  const source = getSourceByKey(sourceKey);
  if (!source) throw new Error(`Bilinmeyen ETL kaynagi: ${sourceKey}`);
  if (!source.enabled) throw new Error(`ETL kaynagi devre disi: ${sourceKey}`);
  invalidateAliasCache();
  return runSourceFetch(source, targetDate);
}
