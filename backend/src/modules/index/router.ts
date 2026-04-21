import type { FastifyInstance } from "fastify";
import { repoGetLatestSnapshot, repoGetSnapshotHistory } from "./repository";
import { calculateWeeklyIndex, INDEX_BASKET_SLUGS } from "./calculator";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { requireAdmin } from "@agro/shared-backend/middleware/roles";

export async function registerIndex(app: FastifyInstance) {
  // En güncel endeks değeri
  app.get("/index/latest", async (_req, reply) => {
    reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
    const snapshot = await repoGetLatestSnapshot();
    return reply.send({ success: true, data: snapshot });
  });

  // Haftalık endeks geçmişi
  app.get<{ Querystring: { weeks?: string } }>(
    "/index/history",
    async (req, reply) => {
      reply.header("Cache-Control", "public, max-age=300, s-maxage=300");
      const weeks = Math.min(parseInt(req.query.weeks ?? "26", 10) || 26, 104);
      const history = await repoGetSnapshotHistory(weeks);
      return reply.send({ success: true, data: history });
    },
  );

  // Sepet ürün listesi
  app.get("/index/basket", async (_req, reply) => {
    return reply.send({ success: true, data: INDEX_BASKET_SLUGS });
  });

  // Admin: manuel endeks hesaplama tetikleyici
  app.post<{ Body: { week?: string } }>(
    "/admin/index/calculate",
    { onRequest: [requireAuth, requireAdmin] },
    async (req, reply) => {
      const result = await calculateWeeklyIndex(req.body?.week);
      if (!result) {
        return reply.code(422).send({ success: false, error: "Bu hafta için yeterli veri yok." });
      }
      return reply.send({ success: true, data: result });
    },
  );
}
