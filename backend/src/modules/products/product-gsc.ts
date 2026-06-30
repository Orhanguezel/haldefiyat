import type { FastifyInstance } from "fastify";
import { inspectSearchConsoleUrl } from "@agro/shared-backend/modules/searchConsole";
import { pool } from "@/db/client";
import { gscBlock, publicOrigin, readGscRow, upsertGscRow } from "@/modules/seo/gsc-index";
import { isGscBulkRunning, startGscBulkBackground } from "@/modules/seo/gsc-bulk";

type ProductRow = { id: number; slug: string; seo_index: number };

function productUrl(slug: string): string {
  return `${publicOrigin()}/urun/${slug}`;
}

async function loadProduct(idRaw: string): Promise<ProductRow | null> {
  const id = Number(idRaw);
  if (!Number.isFinite(id)) return null;
  const [rows] = await pool.query<any[]>("SELECT id, slug, seo_index FROM hf_products WHERE id = ? LIMIT 1", [id]);
  return (rows?.[0] as ProductRow) ?? null;
}

async function buildProductGsc(product: ProductRow) {
  const url = productUrl(product.slug);
  const row = await readGscRow(url);
  return {
    productId: product.id,
    slug: product.slug,
    seoIndex: Boolean(product.seo_index),
    publicUrl: url,
    gsc: gscBlock(url, row),
  };
}

export async function registerProductGsc(app: FastifyInstance) {
  // Toplu GSC denetimi: tum hal URL'lerini (urun+hal+analiz) tek seferde tarar.
  // Arka planda calisir, HTTP istegini bloklamaz.
  app.post<{ Body: { limit?: number; force?: boolean } }>("/hal/gsc/bulk-refresh", async (req, reply) => {
    const body = req.body ?? {};
    const limit = Number.isFinite(body.limit) ? Number(body.limit) : undefined;
    const r = startGscBulkBackground(app.log, { limit, force: Boolean(body.force) });
    if (!r.started) return reply.status(409).send({ error: "Toplu denetim zaten çalışıyor" });
    return reply.send({ ok: true, started: true });
  });

  app.get("/hal/gsc/summary", async (_req, reply) => {
    const [rows] = await pool.query<any[]>(
      `SELECT COUNT(*) AS total,
         SUM(coverage_state LIKE 'Submitted and indexed%' OR verdict = 'PASS') AS indexed,
         SUM(coverage_state LIKE '%redirect%' OR coverage_state LIKE '%noindex%'
             OR coverage_state LIKE '%error%' OR coverage_state LIKE '%duplicate%'
             OR coverage_state LIKE '%not found%') AS issue,
         MAX(checked_at) AS lastChecked
       FROM gsc_url_index`,
    );
    const s = rows?.[0] ?? {};
    return reply.send({
      data: {
        total: Number(s.total ?? 0),
        indexed: Number(s.indexed ?? 0),
        issue: Number(s.issue ?? 0),
        lastChecked: s.lastChecked ? new Date(s.lastChecked).toISOString() : null,
        running: isGscBulkRunning(),
      },
    });
  });

  app.get<{ Params: { id: string } }>("/hal/products/:id/gsc", async (req, reply) => {
    const product = await loadProduct(req.params.id);
    if (!product) return reply.status(404).send({ error: "Urun bulunamadi" });
    return reply.send({ data: await buildProductGsc(product) });
  });

  app.post<{ Params: { id: string } }>("/hal/products/:id/gsc/inspect", async (req, reply) => {
    const product = await loadProduct(req.params.id);
    if (!product) return reply.status(404).send({ error: "Urun bulunamadi" });
    const url = productUrl(product.slug);
    try {
      const r = await inspectSearchConsoleUrl(url);
      await upsertGscRow(url, { verdict: r.verdict, coverage: r.coverage, last_crawl: r.last_crawl });
    } catch (err) {
      app.log.error({ err, url }, "[product:inspect] GSC url inspection failed");
      return reply.status(502).send({ error: "Google Search Console denetimi başarısız. Yetkilendirme/kotayı kontrol edin." });
    }
    return reply.send({ data: await buildProductGsc(product) });
  });
}
