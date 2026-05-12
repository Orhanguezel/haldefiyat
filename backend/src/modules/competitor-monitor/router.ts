import type { FastifyInstance } from "fastify";
import { db } from "@/db/client";
import { hfCompetitorSites, hfCompetitorSnapshots } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { runCompetitorCheck } from "./checker";

export async function registerCompetitorMonitor(app: FastifyInstance) {
  /**
   * GET /api/v1/admin/competitor-monitor/sites
   * Tüm rakip site tanımları + son snapshot özeti
   */
  app.get("/competitor-monitor/sites", async (_req, reply) => {
    const sites = await db
      .select()
      .from(hfCompetitorSites)
      .orderBy(hfCompetitorSites.siteKey);

    // Her site için son snapshot'ı getir
    const result = await Promise.all(
      sites.map(async (site) => {
        const [lastSnap] = await db
          .select({
            productCount: hfCompetitorSnapshots.productCount,
            marketCount: hfCompetitorSnapshots.marketCount,
            detectedFeatures: hfCompetitorSnapshots.detectedFeatures,
            diffSummary: hfCompetitorSnapshots.diffSummary,
            checkedAt: hfCompetitorSnapshots.checkedAt,
            scrapeOk: hfCompetitorSnapshots.scrapeOk,
          })
          .from(hfCompetitorSnapshots)
          .where(eq(hfCompetitorSnapshots.siteKey, site.siteKey))
          .orderBy(desc(hfCompetitorSnapshots.checkedAt))
          .limit(1);

        return { ...site, lastSnapshot: lastSnap ?? null };
      }),
    );

    return reply.send({ items: result });
  });

  /**
   * GET /api/v1/admin/competitor-monitor/history/:siteKey
   * Bir sitenin son N snapshot'ı
   */
  app.get<{ Params: { siteKey: string }; Querystring: { limit?: string } }>(
    "/competitor-monitor/history/:siteKey",
    async (req, reply) => {
      const { siteKey } = req.params;
      const limit = Math.min(parseInt(req.query.limit ?? "20", 10), 100);

      const rows = await db
        .select()
        .from(hfCompetitorSnapshots)
        .where(eq(hfCompetitorSnapshots.siteKey, siteKey))
        .orderBy(desc(hfCompetitorSnapshots.checkedAt))
        .limit(limit);

      return reply.send({ siteKey, items: rows });
    },
  );

  /**
   * POST /api/v1/admin/competitor-monitor/run
   * Manuel kontrol tetikle. Body: { siteKey?: string }
   */
  app.post<{ Body: { siteKey?: string } }>(
    "/competitor-monitor/run",
    async (req, reply) => {
      const { siteKey } = (req.body ?? {}) as { siteKey?: string };
      const results = await runCompetitorCheck(siteKey);
      return reply.send({ ok: true, results });
    },
  );

  /**
   * PATCH /api/v1/admin/competitor-monitor/sites/:siteKey
   * Aktif/pasif geçiş
   */
  app.patch<{ Params: { siteKey: string }; Body: { isActive: 0 | 1 } }>(
    "/competitor-monitor/sites/:siteKey",
    async (req, reply) => {
      const { siteKey } = req.params;
      const { isActive } = req.body ?? {};
      if (isActive !== 0 && isActive !== 1) {
        return reply.status(400).send({ error: "isActive 0 veya 1 olmalı" });
      }
      await db
        .update(hfCompetitorSites)
        .set({ isActive })
        .where(eq(hfCompetitorSites.siteKey, siteKey));
      return reply.send({ ok: true });
    },
  );
}
