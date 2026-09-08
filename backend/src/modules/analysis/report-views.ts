/**
 * Analiz yazilarinin goruntulenme sayisi.
 *
 * KAYNAK: kendi pageview beacon'imiz (`POST /api/v1/track/pageview`), audit
 * request loglarina sayfa yoluyla yazilir. NEDEN ham istek sayisi degil:
 * Next.js `<Link>` on-yuklemesi sayfa yolunu gercek istek gibi loglar ve
 * hacmin ~%91'i bu prefetch'tir — onu saymak "goruntulenme" olmaz
 * (2026-08-31 kalibrasyonu). Beacon yalnizca sayfa gercekten acildiginda atar.
 *
 * SAYILMAYANLAR: bot trafigi (`is_bot`) ve ic trafik (`is_internal`).
 *
 * SINIR: beacon 2026-08-09'da devreye girdi; ondan onceki goruntulenmeler
 * hicbir yerde yok. Bu yuzden olcum penceresinin baslangici da dondurulur —
 * arayuz "9 Agustos'tan beri" diyebilsin, eski yazilar haksiz yere sifir
 * gorunmesin.
 */
import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export interface ReportViewStat {
  views: number;
  lastViewedAt: string | null;
}

export interface ReportViewSummary {
  /** slug → goruntulenme */
  byslug: Map<string, ReportViewStat>;
  /** Beacon'in ilk kaydi; null ise hic olcum yok. */
  since: string | null;
}

interface ViewRow { slug: string; views: number; last_viewed: Date | string | null }
interface SinceRow { since: Date | string | null }

const iso = (value: Date | string | null): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * Tum analiz yazilarinin goruntulenmesini TEK toplu sorguda alir.
 * Rapor basina alt sorgu ACILMAZ: liste uclarina korele alt sorgu eklemek
 * daha once sayfayi 25 saniyeye cikarmisti. `path` indeksli, on-ek taramasi
 * 3,6M satirda ~35 ms.
 */
export async function reportViewSummary(): Promise<ReportViewSummary> {
  const [views, since] = await Promise.all([
    db.execute<ViewRow>(sql`
      SELECT SUBSTRING(path, 9) AS slug, COUNT(*) AS views, MAX(created_at) AS last_viewed
      FROM audit_request_logs
      WHERE path LIKE '/analiz/%'
        AND COALESCE(is_bot, 0) = 0
        AND COALESCE(is_internal, 0) = 0
      GROUP BY path
    `),
    db.execute<SinceRow>(sql`
      SELECT MIN(created_at) AS since FROM audit_request_logs WHERE path LIKE '/analiz/%'
    `),
  ]);

  const rows = (Array.isArray(views) ? views[0] : views) as unknown as ViewRow[];
  const sinceRows = (Array.isArray(since) ? since[0] : since) as unknown as SinceRow[];

  const byslug = new Map<string, ReportViewStat>();
  for (const row of rows ?? []) {
    if (!row?.slug) continue;
    byslug.set(row.slug, { views: Number(row.views) || 0, lastViewedAt: iso(row.last_viewed) });
  }

  return { byslug, since: iso(sinceRows?.[0]?.since ?? null) };
}

export function attachViews<T extends { slug: string }>(
  rows: T[],
  summary: ReportViewSummary,
): Array<T & ReportViewStat> {
  return rows.map((row) => {
    const stat = summary.byslug.get(row.slug);
    return { ...row, views: stat?.views ?? 0, lastViewedAt: stat?.lastViewedAt ?? null };
  });
}
