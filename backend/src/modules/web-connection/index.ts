import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { pool } from "@/db/client";
import { env } from "@/core/env";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().max(160).optional(),
  updated_since: z.string().datetime().optional(),
  sort: z.enum(["newest", "popular"]).default("newest"),
});

const draftSchema = z.object({
  externalId: z.string().trim().min(3).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  title: z.string().trim().min(10).max(500),
  summary: z.string().trim().min(20).max(3000),
  content: z.string().trim().min(100).max(100_000),
  metaTitle: z.string().trim().max(255).optional(),
  metaDescription: z.string().trim().max(500).optional(),
  ogImage: z.string().url().max(500).optional(),
  tags: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
});

function authorized(req: FastifyRequest) {
  const expected = env.TANITIO_CONTENT_API_KEY;
  const bearer = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
  const supplied = bearer || String(req.headers["x-api-key"] ?? "");
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

function dateOrNull(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function registerWebConnection(app: FastifyInstance) {
  app.addHook("onRequest", async (req, reply) => {
    if (!authorized(req)) return reply.status(401).send({ error: "invalid_api_key" });
  });

  app.get("/contract", async () => ({
    contract: "haldefiyat-tanitio-web-connection", version: "1.0",
    tenant: "haldefiyat", locale: "tr-TR", timezone: "Europe/Istanbul",
    capabilities: {
      read: ["articles", "products", "context"],
      write: ["analysis_draft"],
      publish: false,
    },
    endpoints: { articles: "/articles", products: "/products", context: "/context", analysisDrafts: "/analysis-drafts" },
    auth: { type: "bearer", header: "Authorization" },
  }));

  app.get("/articles", async (req) => {
    const q = querySchema.parse(req.query);
    const where = ["status = 'published'"]; const args: unknown[] = [];
    if (q.q) { where.push("(title LIKE ? OR summary LIKE ? OR content LIKE ?)"); args.push(`%${q.q}%`, `%${q.q}%`, `%${q.q}%`); }
    if (q.updated_since) { where.push("updated_at >= ?"); args.push(new Date(q.updated_since)); }
    const [countResult, rowsResult] = await Promise.all([
      pool.query<any[]>(`SELECT COUNT(*) total FROM hf_analysis_reports WHERE ${where.join(" AND ")}`, args),
      pool.query<any[]>(`SELECT id,slug,title,summary,meta_title,meta_description,og_image,tags,published_at,updated_at FROM hf_analysis_reports WHERE ${where.join(" AND ")} ORDER BY ${q.sort === "popular" ? "total_records" : "report_date"} DESC LIMIT ? OFFSET ?`, [...args, q.limit, q.offset]),
    ]);
    const count = countResult[0] as any[]; const rows = rowsResult[0] as any[];
    const total = Number(count[0]?.total ?? 0);
    return { items: rows.map((r) => ({ id: String(r.id), kind: "article", slug: r.slug, title: r.title, excerpt: r.summary, url: `https://haldefiyat.com/analiz/${r.slug}`, image_url: r.og_image, tags: typeof r.tags === "string" ? JSON.parse(r.tags) : r.tags, published_at: dateOrNull(r.published_at), updated_at: dateOrNull(r.updated_at) })), total, hasMore: q.offset + q.limit < total };
  });

  app.get("/products", async (req) => {
    const q = querySchema.parse(req.query);
    const where = ["p.is_active=1", "p.seo_index=1"]; const args: unknown[] = [];
    if (q.q) { where.push("(p.name_tr LIKE ? OR p.slug LIKE ?)"); args.push(`%${q.q}%`, `%${q.q}%`); }
    if (q.updated_since) { where.push("p.updated_at >= ?"); args.push(new Date(q.updated_since)); }
    const order = q.sort === "popular" ? "p.search_volume DESC" : "p.updated_at DESC";
    const [countResult, rowsResult] = await Promise.all([
      pool.query<any[]>(`SELECT COUNT(*) total FROM hf_products p WHERE ${where.join(" AND ")}`, args),
      pool.query<any[]>(`SELECT p.id,p.slug,p.name_tr,p.category_slug,p.unit,p.image_url,p.search_volume,p.data_quality,p.updated_at,(SELECT ph.avg_price FROM hf_price_history ph WHERE ph.product_id=p.id ORDER BY ph.recorded_date DESC LIMIT 1) price FROM hf_products p WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`, [...args, q.limit, q.offset]),
    ]);
    const count = countResult[0] as any[]; const rows = rowsResult[0] as any[];
    const total = Number(count[0]?.total ?? 0);
    return { items: rows.map((r) => ({ id: String(r.id), kind: "product", slug: r.slug, title: r.name_tr, url: `https://haldefiyat.com/urun/${r.slug}`, image_url: r.image_url, category: r.category_slug, unit: r.unit, price: r.price == null ? null : Number(r.price), currency: "TRY", popularity: Number(r.search_volume || 0), dataQuality: Number(r.data_quality || 0), updated_at: dateOrNull(r.updated_at) })), total, hasMore: q.offset + q.limit < total };
  });

  app.get("/context", async () => {
    const [productsResult, marketsResult, articlesResult] = await Promise.all([
      pool.query<any[]>("SELECT COUNT(*) total, SUM(seo_index=1) indexable FROM hf_products WHERE is_active=1"),
      pool.query<any[]>("SELECT COUNT(*) total FROM hf_markets WHERE is_active=1"),
      pool.query<any[]>("SELECT COUNT(*) total, MAX(updated_at) lastUpdated FROM hf_analysis_reports WHERE status='published'"),
    ]);
    const products = productsResult[0] as any[]; const markets = marketsResult[0] as any[]; const articles = articlesResult[0] as any[];
    return { tenant: "haldefiyat", brand: "HalDeFiyat", website: "https://haldefiyat.com", sector: "hal fiyatları ve tarımsal piyasa", audience: ["çiftçiler", "tüccarlar", "manavlar", "tüketiciler"], contentPillars: ["güncel hal fiyatları", "ürün fiyat analizleri", "şehir ve hal karşılaştırmaları", "tarımsal piyasa eğilimleri"], defaultHashtags: ["#haldefiyat", "#halfiyatlari", "#tarim", "#sebze", "#meyve"], inventory: { products: products[0], markets: markets[0], articles: { ...articles[0], lastUpdated: dateOrNull(articles[0]?.lastUpdated) } } };
  });

  app.post("/analysis-drafts", async (req, reply) => {
    const body = draftSchema.parse(req.body);
    const now = new Date(); const date = now.toISOString().slice(0, 10);
    const week = `${now.getUTCFullYear()}-W${String(Math.ceil((((now.getTime() - Date.UTC(now.getUTCFullYear(), 0, 1)) / 86400000) + new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).getUTCDay() + 1) / 7)).padStart(2, "0")}`;
    await pool.query(`INSERT INTO hf_analysis_reports (slug,title,summary,meta_title,meta_description,og_image,content,author,tags,iso_week,week_start,week_end,report_date,source,status,total_records) VALUES (?,?,?,?,?,?,?,?,?,?,?, ?,?,'manual','draft',0) ON DUPLICATE KEY UPDATE title=VALUES(title),summary=VALUES(summary),meta_title=VALUES(meta_title),meta_description=VALUES(meta_description),og_image=VALUES(og_image),content=VALUES(content),tags=VALUES(tags),status='draft',updated_at=CURRENT_TIMESTAMP(3)`, [body.slug, body.title, body.summary, body.metaTitle ?? null, body.metaDescription ?? null, body.ogImage ?? null, body.content, "Tanitio İçerik Asistanı", JSON.stringify([...new Set([...body.tags, `tanitio:${body.externalId}`])]), week, date, date, date]);
    return reply.status(202).send({ ok: true, status: "draft", slug: body.slug, publishRequired: true });
  });
}
