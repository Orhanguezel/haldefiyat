import type { FastifyInstance } from "fastify";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { hfAlerts, hfMarkets, hfProducts } from "@/db/schema";
import { requireAuth } from "@agro/shared-backend/middleware/auth";
import { getAuthUserId } from "@agro/shared-backend/modules/_shared";
import type { FastifyRequest } from "fastify";

const createSchema = z.object({
  productSlug:     z.string().min(1),
  marketSlug:      z.string().optional(),
  thresholdPrice:  z.number().positive(),
  direction:       z.enum(["above", "below"]),
  contactEmail:    z.string().email().optional(),
  contactTelegram: z.string().min(3).max(128).optional(),
  contactPush:     z.string().optional(),
}).refine(
  (d) => Boolean(d.contactEmail || d.contactTelegram || d.contactPush),
  { message: "En az bir bildirim kanalı zorunlu", path: ["contactEmail"] },
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

    // Slug'lari ID'ye cevir
    const [product] = await db.select({ id: hfProducts.id }).from(hfProducts).where(eq(hfProducts.slug, d.productSlug)).limit(1);
    if (!product) return reply.status(404).send({ error: "Urun bulunamadi" });

    let marketId: number | null = null;
    if (d.marketSlug) {
      const [market] = await db.select({ id: hfMarkets.id }).from(hfMarkets).where(eq(hfMarkets.slug, d.marketSlug)).limit(1);
      if (!market) return reply.status(404).send({ error: "Hal bulunamadi" });
      marketId = market.id;
    }

    const jwtUser = (req as FastifyRequest & { user?: { sub?: string; id?: string } }).user;
    const rawId = jwtUser?.sub ?? jwtUser?.id;
    const userId = rawId != null ? String(rawId) : null;

    const result = await db.insert(hfAlerts).values({
      userId:          userId,
      productId:       product.id,
      marketId:        marketId,
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
   * POST /api/v1/alerts/telegram-webhook
   * Telegram botundan gelen mesajlari karsilar
   */
  app.post("/telegram-webhook", async (req, reply) => {
    const body = req.body as any;
    console.log(`[telegram-webhook] Incoming update:`, JSON.stringify(body));

    const message = body.message || body.edited_message;
    if (message?.text?.startsWith("/start") || message?.text?.toLowerCase() === "baslat") {
      const chatId = message.chat.id;
      const { sendTelegramAlert } = await import("./telegram");
      const text =
        `🍅 <b>HaldeFiyat'a Hoşgeldiniz!</b>\n\n` +
        `Sayısal ID'niz: <code>${chatId}</code>\n\n` +
        `Bu numarayı kopyalayıp sitemizdeki <b>"Telegram"</b> alanına yapıştırarak fiyat uyarısı oluşturabilirsiniz.\n\n` +
        `🌐 <a href="https://haldefiyat.com/uyarilar">Uyarıları Yönet</a>`;
      
      console.log(`[telegram-webhook] Sending start message to ${chatId}`);
      await sendTelegramAlert(String(chatId), text);
    }
    return reply.send({ ok: true });
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

  // ── Üye uyarıları (auth zorunlu) ──────────────────────────────────────────

  const alertSelectFields = {
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
  };

  /**
   * GET /api/v1/user/alerts
   * Giriş yapmış kullanıcının tüm aktif uyarıları
   */
  app.get("/user/alerts", { onRequest: [requireAuth] }, async (req, reply) => {
    const userId = getAuthUserId(req);
    const rows = await db
      .select(alertSelectFields)
      .from(hfAlerts)
      .innerJoin(hfProducts, eq(hfProducts.id, hfAlerts.productId))
      .leftJoin(hfMarkets, eq(hfMarkets.id, hfAlerts.marketId))
      .where(and(eq(hfAlerts.isActive, 1), eq(hfAlerts.userId, userId)))
      .orderBy(desc(hfAlerts.createdAt));
    return reply.send({ items: rows });
  });

  /**
   * PATCH /api/v1/user/alerts/:id
   * Uyarı eşik/yön güncelle — sahiplik zorunlu
   */
  app.patch<{ Params: { id: string } }>(
    "/user/alerts/:id",
    { onRequest: [requireAuth] },
    async (req, reply) => {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });

      const userId = getAuthUserId(req);
      const [alert] = await db.select({ id: hfAlerts.id }).from(hfAlerts)
        .where(and(eq(hfAlerts.id, id), eq(hfAlerts.userId, userId), eq(hfAlerts.isActive, 1)))
        .limit(1);
      if (!alert) return reply.status(404).send({ error: "Uyari bulunamadi veya erisim yetkiniz yok" });

      const patchSchema = z.object({
        thresholdPrice: z.number().positive().optional(),
        direction:      z.enum(["above", "below"]).optional(),
      });
      const parsed = patchSchema.safeParse(req.body);
      if (!parsed.success) return reply.status(400).send({ error: "Gecersiz veri" });

      const updates: Record<string, unknown> = {};
      if (parsed.data.thresholdPrice !== undefined) updates.thresholdPrice = parsed.data.thresholdPrice.toFixed(2);
      if (parsed.data.direction !== undefined) updates.direction = parsed.data.direction;

      if (Object.keys(updates).length > 0) {
        await db.update(hfAlerts).set(updates).where(eq(hfAlerts.id, id));
      }
      return reply.send({ ok: true });
    },
  );

  /**
   * DELETE /api/v1/user/alerts/:id
   * Soft-delete — sahiplik kontrolü ile
   */
  app.delete<{ Params: { id: string } }>(
    "/user/alerts/:id",
    { onRequest: [requireAuth] },
    async (req, reply) => {
      const id = parseInt(req.params.id, 10);
      if (!Number.isFinite(id) || id <= 0) return reply.status(400).send({ error: "Gecersiz id" });

      const userId = getAuthUserId(req);
      const [alert] = await db.select({ id: hfAlerts.id }).from(hfAlerts)
        .where(and(eq(hfAlerts.id, id), eq(hfAlerts.userId, userId)))
        .limit(1);
      if (!alert) return reply.status(404).send({ error: "Uyari bulunamadi veya erisim yetkiniz yok" });

      await db.update(hfAlerts).set({ isActive: 0 }).where(eq(hfAlerts.id, id));
      return reply.send({ ok: true });
    },
  );
}
