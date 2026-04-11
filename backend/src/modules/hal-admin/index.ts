import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { upsertPriceRow } from "@/modules/prices/repository";
import { runDailyEtl, runSingleSource } from "@/modules/etl";
import { db } from "@/db/client";
import { hfEtlRuns } from "@/db/schema";
import { desc } from "drizzle-orm";

const obsBody = z.object({
  productId:    z.coerce.number().int().positive(),
  marketId:     z.coerce.number().int().positive(),
  avgPrice:     z.coerce.number().positive(),
  minPrice:     z.coerce.number().positive().optional(),
  maxPrice:     z.coerce.number().positive().optional(),
  recordedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sourceApi:    z.string().max(64).optional(),
});

const etlBody = z.object({
  source: z.enum(["ibb", "izmir", "all"]).optional().default("all"),
  date:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function registerHalAdmin(app: FastifyInstance) {
  /**
   * POST /api/v1/admin/hal/observations
   * Manuel fiyat girişi
   */
  app.post("/hal/observations", async (req, reply) => {
    const parsed = obsBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Geçersiz gövde", details: parsed.error.flatten() });
    const b = parsed.data;
    await upsertPriceRow({
      productId:    b.productId,
      marketId:     b.marketId,
      avgPrice:     b.avgPrice.toFixed(2),
      minPrice:     b.minPrice != null ? b.minPrice.toFixed(2) : null,
      maxPrice:     b.maxPrice != null ? b.maxPrice.toFixed(2) : null,
      recordedDate: b.recordedDate,
      sourceApi:    b.sourceApi ?? "manual",
    });
    return reply.send({ ok: true });
  });

  /**
   * POST /api/v1/admin/hal/etl/run
   * ETL tetikleme (belirli kaynak veya hepsini çalıştır)
   * Body: { source: "ibb" | "izmir" | "all", date?: "YYYY-MM-DD" }
   */
  app.post("/hal/etl/run", async (req, reply) => {
    const parsed = etlBody.safeParse(req.body);
    if (!parsed.success) return reply.status(400).send({ error: "Geçersiz gövde" });
    const { source, date } = parsed.data;

    if (source === "all") {
      const results = await runDailyEtl(date);
      return reply.send({ ok: true, results });
    }

    const result = await runSingleSource(source, date);
    return reply.send({ ok: true, source, result });
  });

  /**
   * GET /api/v1/admin/hal/etl/logs
   * Son ETL çalıştırma logları
   */
  app.get("/hal/etl/logs", async (_req, reply) => {
    const logs = await db
      .select()
      .from(hfEtlRuns)
      .orderBy(desc(hfEtlRuns.createdAt))
      .limit(50);
    return reply.send({ logs });
  });
}
