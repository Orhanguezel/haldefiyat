import type { FastifyInstance } from "fastify";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { hfAlerts, hfMarkets, hfProducts } from "@/db/schema";

const createSchema = z.object({
  productId:       z.number().int().positive(),
  marketId:        z.number().int().positive().optional(),
  thresholdPrice:  z.number().positive(),
  direction:       z.enum(["above", "below"]),
  contactEmail:    z.string().email().optional(),
  contactTelegram: z.string().min(3).max(128).optional(),
}).refine(
  (d) => Boolean(d.contactEmail || d.contactTelegram),
  { message: "contactEmail veya contactTelegram zorunlu", path: ["contactEmail"] },
);

const listQuerySchema = z.object({
  email: z.string().email(),
});

export async function registerAlerts(app: FastifyInstance) {
  /**
   * POST /api/v1/alerts
   * Yeni fiyat alarmi olustur
   */
  app.post("/alerts", async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Gecersiz alarm verisi",
        details: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }
    const d = parsed.data;

    const result = await db.insert(hfAlerts).values({
      productId:       d.productId,
      marketId:        d.marketId ?? null,
      thresholdPrice:  d.thresholdPrice.toFixed(2),
      direction:       d.direction,
      contactEmail:    d.contactEmail ?? null,
      contactTelegram: d.contactTelegram ?? null,
      isActive:        1,
    });

    const id = Number((result as unknown as Array<{ insertId?: number }>)[0]?.insertId ?? 0);
    return reply.send({ ok: true, id });
  });

  /**
   * GET /api/v1/alerts?email=foo@bar.com
   * Bir email'e ait aktif alarmlari listeler (MVP — auth yok)
   */
  app.get("/alerts", async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: "email parametresi zorunlu" });
    }

    const rows = await db
      .select({
        id:              hfAlerts.id,
        productId:       hfAlerts.productId,
        marketId:        hfAlerts.marketId,
        thresholdPrice:  hfAlerts.thresholdPrice,
        direction:       hfAlerts.direction,
        contactEmail:    hfAlerts.contactEmail,
        contactTelegram: hfAlerts.contactTelegram,
        lastTriggered:   hfAlerts.lastTriggered,
        createdAt:       hfAlerts.createdAt,
        productSlug:     hfProducts.slug,
        productName:     hfProducts.nameTr,
        marketSlug:      hfMarkets.slug,
        marketName:      hfMarkets.name,
      })
      .from(hfAlerts)
      .innerJoin(hfProducts, eq(hfProducts.id, hfAlerts.productId))
      .leftJoin(hfMarkets,   eq(hfMarkets.id,  hfAlerts.marketId))
      .where(and(eq(hfAlerts.isActive, 1), eq(hfAlerts.contactEmail, parsed.data.email)))
      .orderBy(desc(hfAlerts.createdAt));

    return reply.send({ items: rows });
  });

  /**
   * DELETE /api/v1/alerts/:id
   * Alarmi soft-delete eder (isActive = 0)
   */
  app.delete<{ Params: { id: string } }>("/alerts/:id", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return reply.status(400).send({ error: "Gecersiz id" });
    }

    await db.update(hfAlerts).set({ isActive: 0 }).where(eq(hfAlerts.id, id));
    return reply.send({ ok: true });
  });
}
