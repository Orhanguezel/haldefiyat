import type { FastifyInstance } from "fastify";
import { requireAuth } from "@agro/shared-backend/middleware/auth";

// Bu endpoint'ler P2 SSO entegrasyonu tamamlandığında aktif edilecek.
// hf_user_favorites tablosu henüz 020_hal_domain_schema.sql dosyasına eklenmedi
// (ALTER TABLE yasağı). Şema hazır olana kadar 501 döner.
// Detay: ./README.md

const NOT_IMPLEMENTED = {
  error: "Not Implemented",
  message: "Favori sistemi SSO entegrasyonu tamamlandığında aktif olacak",
  ready:   false,
};

export async function registerFavorites(app: FastifyInstance) {
  /**
   * GET /api/v1/favorites
   * Kullanicinin favori ürün listesini döner — auth zorunlu.
   */
  app.get("/favorites", { onRequest: [requireAuth] }, async (_req, reply) => {
    return reply.status(501).send(NOT_IMPLEMENTED);
  });

  /**
   * POST /api/v1/favorites
   * Body: { productSlug: string } — auth zorunlu.
   */
  app.post("/favorites", { onRequest: [requireAuth] }, async (_req, reply) => {
    return reply.status(501).send(NOT_IMPLEMENTED);
  });

  /**
   * DELETE /api/v1/favorites/:slug — auth zorunlu.
   */
  app.delete<{ Params: { slug: string } }>(
    "/favorites/:slug",
    { onRequest: [requireAuth] },
    async (_req, reply) => {
      return reply.status(501).send(NOT_IMPLEMENTED);
    },
  );
}
