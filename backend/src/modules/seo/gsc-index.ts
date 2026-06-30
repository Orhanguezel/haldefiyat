import { pool } from "@/db/client";
import { env } from "@/core/env";

// GSC (Google Search Console) indexlenme durumu icin ortak yardimcilar.
// Hem analiz raporlari (modules/analysis/quality) hem urun sayfalari
// (modules/products/product-gsc) ayni siniflandirma + cache okuma/yazma mantigini kullanir.

export type GscCategory = "indexed" | "not_indexed" | "issue" | "unknown";

export type GscRow = {
  url: string;
  verdict: string | null;
  coverage_state: string | null;
  last_crawl: Date | string | null;
  checked_at: Date | string | null;
};

export function publicOrigin(): string {
  const raw = env.PUBLIC_BASE_URL || env.PUBLIC_URL || "https://haldefiyat.com";
  return raw.replace(/\/+$/, "");
}

export function classifyGsc(verdict: string | null, coverage: string | null): { category: GscCategory; label: string } {
  const v = `${verdict ?? ""} ${coverage ?? ""}`.toLowerCase();
  if (!verdict && !coverage) return { category: "unknown", label: "Henüz Google tarafından kontrol edilmedi" };
  if (v.includes("submitted and indexed") || (verdict ?? "").toUpperCase() === "PASS") return { category: "indexed", label: "Google'da indexli" };
  if (v.includes("noindex") || v.includes("redirect") || v.includes("duplicate") || v.includes("soft 404") || v.includes("not found") || v.includes("error")) {
    return { category: "issue", label: coverage || "Index sorunu" };
  }
  if (v.includes("not indexed") || v.includes("discovered") || v.includes("crawled") || v.includes("unknown to google")) {
    return { category: "not_indexed", label: coverage || "Henüz indexlenmedi" };
  }
  return { category: "unknown", label: coverage || verdict || "Bilinmiyor" };
}

export async function readGscRow(url: string): Promise<GscRow | null> {
  const [rows] = await pool.query<any[]>(
    "SELECT url, verdict, coverage_state, last_crawl, checked_at FROM gsc_url_index WHERE url = ? LIMIT 1",
    [url],
  );
  return (rows?.[0] as GscRow) ?? null;
}

function toMysqlDt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export function gscBlock(url: string, row: GscRow | null) {
  const verdict = row?.verdict ?? null;
  const coverage = row?.coverage_state ?? null;
  const { category, label } = classifyGsc(verdict, coverage);
  return {
    url,
    checked: Boolean(row),
    verdict,
    coverageState: coverage,
    lastCrawl: row?.last_crawl ? new Date(row.last_crawl).toISOString() : null,
    checkedAt: row?.checked_at ? new Date(row.checked_at).toISOString() : null,
    category,
    label,
  };
}

// Cache'li GSC durumunu toplu okur (canli GSC cagrisi YOK) — liste ekranlari icin.
export async function readGscCategoriesForUrls(
  urls: string[],
): Promise<Map<string, { category: GscCategory; label: string }>> {
  const map = new Map<string, { category: GscCategory; label: string }>();
  if (!urls.length) return map;
  const placeholders = urls.map(() => "?").join(",");
  const [rows] = await pool.query<any[]>(
    `SELECT url, verdict, coverage_state FROM gsc_url_index WHERE url IN (${placeholders})`,
    urls,
  );
  for (const row of rows ?? []) {
    map.set(row.url, classifyGsc(row.verdict ?? null, row.coverage_state ?? null));
  }
  return map;
}

export async function upsertGscRow(url: string, r: { verdict: string | null; coverage: string | null; last_crawl: string | null }): Promise<void> {
  await pool.execute(
    `INSERT INTO gsc_url_index (url, verdict, coverage_state, last_crawl, checked_at)
     VALUES (?, ?, ?, ?, NOW(3))
     ON DUPLICATE KEY UPDATE verdict = VALUES(verdict), coverage_state = VALUES(coverage_state),
       last_crawl = VALUES(last_crawl), checked_at = VALUES(checked_at)`,
    [url, r.verdict || null, r.coverage || null, toMysqlDt(r.last_crawl)],
  );
}
