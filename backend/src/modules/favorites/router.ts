import type { FastifyInstance, FastifyRequest } from "fastify";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { hfUserFavorites, hfProducts } from "@/db/schema";
import { requireAuth } from "@agro/shared-backend/middleware/auth";

type AuthReq = FastifyRequest & { user?: { id: string } };

export async function registerFavorites(app: FastifyInstance) {
  /**
   * GET /api/v1/favorites
   * Kullanıcının favori ürün listesini döner.
   */
  app.get("/favorites", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = (req as AuthReq).user!.id;
    const rows = await db
      .select({
        productId:   hfUserFavorites.productId,
        slug:        hfProducts.slug,
        nameTr:      hfProducts.nameTr,
        categorySlug: hfProducts.categorySlug,
        unit:        hfProducts.unit,
        createdAt:   hfUserFavorites.createdAt,
      })
      .from(hfUserFavorites)
      .innerJoin(hfProducts, eq(hfProducts.id, hfUserFavorites.productId))
      .where(eq(hfUserFavorites.userId, userId));
    return reply.send({ items: rows });
  });

  /**
   * POST /api/v1/favorites
   * Body: { productSlug: string }
   */
  app.post("/favorites", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = (req as AuthReq).user!.id;
    const parsed = z.object({ productSlug: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "productSlug zorunlu" });

    const [product] = await db.select({ id: hfProducts.id })
      .from(hfProducts).where(eq(hfProducts.slug, parsed.data.productSlug)).limit(1);
    if (!product) return reply.status(404).send({ error: "Urun bulunamadi" });

    await db.insert(hfUserFavorites)
      .values({ userId, productId: product.id })
      .onDuplicateKeyUpdate({ set: { userId } });
    return reply.send({ ok: true });
  });

  /**
   * POST /api/v1/favorites/sync
   * Body: { slugs: string[] } — login sonrası localStorage → DB toplu aktarım
   */
  app.post("/favorites/sync", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = (req as AuthReq).user!.id;
    const parsed = z.object({ slugs: z.array(z.string()).max(200) }).safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz slugs listesi" });

    const products = await db
      .select({ id: hfProducts.id, slug: hfProducts.slug })
      .from(hfProducts)
      .where(eq(hfProducts.isActive, 1));
    const slugMap = new Map(products.map((p) => [p.slug, p.id]));

    let added = 0;
    for (const slug of parsed.data.slugs) {
      const productId = slugMap.get(slug);
      if (!productId) continue;
      await db.insert(hfUserFavorites)
        .values({ userId, productId })
        .onDuplicateKeyUpdate({ set: { userId } });
      added++;
    }
    return reply.send({ ok: true, added });
  });

  /**
   * DELETE /api/v1/favorites/:slug
   */
  app.delete<{ Params: { slug: string } }>(
    "/favorites/:slug",
    { onRequest: [requireAuth] },
    async (req, reply) => {
      const userId = (req as AuthReq).user!.id;
      const [product] = await db.select({ id: hfProducts.id })
        .from(hfProducts).where(eq(hfProducts.slug, req.params.slug)).limit(1);
      if (!product) return reply.status(404).send({ error: "Urun bulunamadi" });

      await db.delete(hfUserFavorites)
        .where(and(eq(hfUserFavorites.userId, userId), eq(hfUserFavorites.productId, product.id)));
      return reply.send({ ok: true });
    },
  );
}
