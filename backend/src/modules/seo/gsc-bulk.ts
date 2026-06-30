import type { FastifyBaseLogger } from "fastify";
import { inspectSearchConsoleUrl } from "@agro/shared-backend/modules/searchConsole";
import { pool } from "@/db/client";
import { publicOrigin, upsertGscRow } from "./gsc-index";

// Tek indirici: haldefiyat URL'lerini GSC'de denetleyen TEK yer burasidir.
// Sosyal platform (ekosistem-sosyal) bu sonuclari /api/v1/gsc/export'tan okur,
// kendisi GSC'ye GITMEZ (kota cift harcanmaz).

let bulkRunning = false;

export function isGscBulkRunning(): boolean {
  return bulkRunning;
}

// Tum hal URL'lerini toplar: sitemap (indexlenebilir: urun+hal+analiz+statik,
// dogru formatlar) ∪ tum aktif urun sayfalari (noindex/varyant dahil — sitemap'te yok).
async function collectHalUrls(): Promise<string[]> {
  const origin = publicOrigin();
  const urls = new Set<string>();
  try {
    const res = await fetch(`${origin}/sitemap.xml`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const xml = await res.text();
      for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) urls.add(m[1].trim());
    }
  } catch {
    // sitemap erisilemezse DB'den devam
  }
  const [products] = await pool.query<any[]>("SELECT slug FROM hf_products WHERE is_active = 1");
  for (const p of products ?? []) urls.add(`${origin}/urun/${p.slug}`);
  return [...urls].filter((u) => u.startsWith(origin));
}

type BulkResult = { total: number; pending: number; checked: number; failed: number; skipped: number };

// staleHours'tan eski / hic denetlenmemis URL'leri, en eskiden basliyarak, limit kadar denetler.
// throttle: ~5 istek/sn (GSC dakika limiti ~600 altinda).
export async function runGscBulkRefresh(
  opts: { limit?: number; staleHours?: number; force?: boolean } = {},
): Promise<BulkResult> {
  const limit = Math.max(1, Math.min(opts.limit ?? 1000, 2000));
  const staleH = opts.staleHours ?? 24;
  const all = await collectHalUrls();

  const [rows] = await pool.query<any[]>("SELECT url, checked_at FROM gsc_url_index");
  const checkedAt = new Map<string, number>();
  for (const r of rows ?? []) checkedAt.set(r.url, r.checked_at ? new Date(r.checked_at).getTime() : 0);

  const cutoff = Date.now() - staleH * 3600_000;
  const pending = all
    .filter((u) => opts.force || (checkedAt.get(u) ?? 0) < cutoff)
    .sort((a, b) => (checkedAt.get(a) ?? 0) - (checkedAt.get(b) ?? 0))
    .slice(0, limit);

  // GSC URL Inspection cagri basina ~yavas (3-7sn); sinirli eszamanlilik ile
  // hizlandir (kota 600/dk'nin cok altinda kalir).
  const concurrency = Math.max(1, Math.min(Number(process.env.GSC_BULK_CONCURRENCY || "4"), 8));
  let idx = 0;
  let checked = 0;
  let failed = 0;
  async function worker() {
    while (idx < pending.length) {
      const url = pending[idx++];
      try {
        const r = await inspectSearchConsoleUrl(url);
        await upsertGscRow(url, { verdict: r.verdict, coverage: r.coverage, last_crawl: r.last_crawl });
        checked++;
      } catch {
        failed++;
      }
      await new Promise((res) => setTimeout(res, 100));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return { total: all.length, pending: pending.length, checked, failed, skipped: all.length - pending.length };
}

// HTTP istegini bloklamadan arka planda calistir; ayni anda tek run.
export function startGscBulkBackground(
  log: FastifyBaseLogger,
  opts: { limit?: number; force?: boolean },
): { started: boolean; reason?: string } {
  if (bulkRunning) return { started: false, reason: "already_running" };
  bulkRunning = true;
  void (async () => {
    const t0 = Date.now();
    try {
      const r = await runGscBulkRefresh(opts);
      log.info({ ...r, durationMs: Date.now() - t0 }, "[gsc:bulk] tamamlandi");
    } catch (err) {
      log.error({ err }, "[gsc:bulk] hata");
    } finally {
      bulkRunning = false;
    }
  })();
  return { started: true };
}
