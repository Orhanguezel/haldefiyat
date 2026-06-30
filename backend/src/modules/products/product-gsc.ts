import type { FastifyInstance } from "fastify";
import { inspectSearchConsoleUrl } from "@agro/shared-backend/modules/searchConsole";
import { pool } from "@/db/client";
import { gscBlock, publicOrigin, readGscRow, upsertGscRow } from "@/modules/seo/gsc-index";

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
