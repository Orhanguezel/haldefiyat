import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { inspectSearchConsoleUrl } from "@agro/shared-backend/modules/searchConsole";
import { db, pool } from "@/db/client";
import { hfAnalysisReports } from "@/db/schema";
import { env } from "@/core/env";

type BreakItem = { key: string; label: string; points: number; max: number; pass: boolean; detail?: string };
type GscCategory = "indexed" | "not_indexed" | "issue" | "unknown";

type ReportRow = typeof hfAnalysisReports.$inferSelect;

function publicOrigin(): string {
  const raw = env.PUBLIC_BASE_URL || env.PUBLIC_URL || "https://haldefiyat.com";
  return raw.replace(/\/+$/, "");
}

function reportUrl(slug: string): string {
  return `${publicOrigin()}/analiz/${slug}`;
}

function textFromHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countMatches(html: string, re: RegExp): number {
  return (html.match(re) ?? []).length;
}

function scoreContent(report: ReportRow): { score: number; breakdown: BreakItem[]; wordCount: number; h2: number; tables: number } {
  const html = report.content ?? "";
  const text = textFromHtml(html);
  const wordCount = text ? text.split(" ").filter(Boolean).length : 0;
  const h2 = countMatches(html, /<h2[\s>]/gi);
  const tables = countMatches(html, /<table[\s>]/gi);
  const hasMethodology = /hdf-note|metodoloji/i.test(html);
  const hasDek = /hdf-dek|hdf-kicker/i.test(html);
  const summaryLen = (report.summary ?? "").trim().length;

  const wordPts = wordCount >= 600 ? 30 : wordCount >= 350 ? 18 : wordCount >= 150 ? 8 : 0;
  const h2Pts = h2 >= 4 ? 20 : h2 >= 2 ? 12 : h2 >= 1 ? 5 : 0;
  const tablePts = tables >= 2 ? 20 : tables === 1 ? 10 : 0;
  const methodPts = hasMethodology ? 10 : 0;
  const summaryPts = summaryLen >= 120 && summaryLen <= 320 ? 10 : summaryLen > 0 ? 4 : 0;
  const dekPts = hasDek ? 10 : 0;

  const breakdown: BreakItem[] = [
    { key: "words", label: "İçerik derinliği (gövde kelime)", points: wordPts, max: 30, pass: wordPts >= 18, detail: `${wordCount} kelime` },
    { key: "sections", label: "Bölüm başlıkları (H2)", points: h2Pts, max: 20, pass: h2 >= 2, detail: `${h2} başlık` },
    { key: "tables", label: "Veri tabloları (endeks + hareket)", points: tablePts, max: 20, pass: tables >= 1, detail: `${tables} tablo` },
    { key: "methodology", label: "Metodoloji notu", points: methodPts, max: 10, pass: hasMethodology },
    { key: "summary", label: "Özet uzunluğu (120-320 krk)", points: summaryPts, max: 10, pass: summaryPts === 10, detail: `${summaryLen} karakter` },
    { key: "dek", label: "Giriş / kicker bloğu", points: dekPts, max: 10, pass: hasDek },
  ];
  const score = Math.min(100, breakdown.reduce((s, b) => s + b.points, 0));
  return { score, breakdown, wordCount, h2, tables };
}

function scoreSeo(report: ReportRow): { score: number; breakdown: BreakItem[] } {
  const metaTitle = (report.metaTitle ?? "").trim();
  const metaDesc = (report.metaDescription ?? "").trim();
  const slug = (report.slug ?? "").trim();
  const tags = Array.isArray(report.tags) ? (report.tags as string[]) : [];
  const ogImage = (report.ogImage ?? "").trim();
  const imageAlt = (report.imageAlt ?? "").trim();
  const titleLen = (report.title ?? "").trim().length;

  const mtPts = metaTitle.length >= 30 && metaTitle.length <= 60 ? 20 : metaTitle.length >= 15 && metaTitle.length <= 70 ? 10 : metaTitle ? 4 : 0;
  const mdPts = metaDesc.length >= 120 && metaDesc.length <= 160 ? 20 : metaDesc.length >= 80 && metaDesc.length <= 185 ? 12 : metaDesc ? 5 : 0;
  const slugPts = slug && /^[a-z0-9-]+$/.test(slug) && slug.length <= 80 ? 15 : slug ? 6 : 0;
  const tagPts = tags.length >= 3 ? 15 : tags.length >= 1 ? 8 : 0;
  const hasCustomOg = Boolean(ogImage) && !/og-default/.test(ogImage);
  const ogPts = 10;
  const titlePts = titleLen >= 30 && titleLen <= 65 ? 10 : titleLen ? 4 : 0;
  const altPts = imageAlt ? 10 : 0;

  const breakdown: BreakItem[] = [
    { key: "metaTitle", label: "Meta başlık (30-60 krk)", points: mtPts, max: 20, pass: mtPts === 20, detail: `${metaTitle.length} krk` },
    { key: "metaDesc", label: "Meta açıklama (120-160 krk)", points: mdPts, max: 20, pass: mdPts === 20, detail: `${metaDesc.length} krk` },
    { key: "slug", label: "Temiz slug", points: slugPts, max: 15, pass: slugPts === 15 },
    { key: "tags", label: "Etiketler (≥3)", points: tagPts, max: 15, pass: tags.length >= 3, detail: `${tags.length} etiket` },
    { key: "og", label: "Kapak (OG) görseli", points: ogPts, max: 10, pass: true, detail: hasCustomOg ? "özel görsel" : "otomatik üretilen kapak (/og/analiz)" },
    { key: "title", label: "Başlık uzunluğu (30-65 krk)", points: titlePts, max: 10, pass: titlePts === 10, detail: `${titleLen} krk` },
    { key: "alt", label: "Görsel alt metni", points: altPts, max: 10, pass: altPts === 10 },
  ];
  const score = Math.min(100, breakdown.reduce((s, b) => s + b.points, 0));
  return { score, breakdown };
}

function classifyGsc(verdict: string | null, coverage: string | null): { category: GscCategory; label: string } {
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

type GscRow = { url: string; verdict: string | null; coverage_state: string | null; last_crawl: Date | string | null; checked_at: Date | string | null };

async function readGscRow(url: string): Promise<GscRow | null> {
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

function gscBlock(url: string, row: GscRow | null) {
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

async function buildQuality(report: ReportRow) {
  const url = reportUrl(report.slug);
  const content = scoreContent(report);
  const seo = scoreSeo(report);
  const readiness = Math.min(100, Math.round(content.score * 0.45 + seo.score * 0.45 + (report.status === "published" ? 10 : 0)));
  const gscRow = await readGscRow(url);
  return {
    reportId: report.id,
    slug: report.slug,
    status: report.status,
    publicUrl: url,
    readiness,
    content,
    seo,
    gsc: gscBlock(url, gscRow),
  };
}

async function loadReport(idRaw: string): Promise<ReportRow | null> {
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return null;
  const [row] = await db.select().from(hfAnalysisReports).where(eq(hfAnalysisReports.id, id)).limit(1);
  return row ?? null;
}

export async function registerAnalysisQuality(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>("/analysis/reports/:id/quality", async (req, reply) => {
    const report = await loadReport(req.params.id);
    if (!report) return reply.status(404).send({ error: "Rapor bulunamadi" });
    return reply.send({ data: await buildQuality(report) });
  });

  app.post<{ Params: { id: string } }>("/analysis/reports/:id/inspect", async (req, reply) => {
    const report = await loadReport(req.params.id);
    if (!report) return reply.status(404).send({ error: "Rapor bulunamadi" });
    const url = reportUrl(report.slug);
    try {
      const r = await inspectSearchConsoleUrl(url);
      await pool.execute(
        `INSERT INTO gsc_url_index (url, verdict, coverage_state, last_crawl, checked_at)
         VALUES (?, ?, ?, ?, NOW(3))
         ON DUPLICATE KEY UPDATE verdict = VALUES(verdict), coverage_state = VALUES(coverage_state),
           last_crawl = VALUES(last_crawl), checked_at = VALUES(checked_at)`,
        [url, r.verdict || null, r.coverage || null, toMysqlDt(r.last_crawl)],
      );
    } catch (err) {
      app.log.error({ err, url }, "[analysis:inspect] GSC url inspection failed");
      return reply.status(502).send({ error: "Google Search Console denetimi başarısız. Yetkilendirme/kotayı kontrol edin." });
    }
    return reply.send({ data: await buildQuality(report) });
  });
}
