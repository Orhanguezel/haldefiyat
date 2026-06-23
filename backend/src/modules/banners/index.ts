import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  bannerStats,
  createBanner,
  deleteBanner,
  getBannerById,
  incClick,
  incImpression,
  isAdsEnabled,
  listBanners,
  pickActiveForPosition,
  updateBanner,
} from "./repository";

// Kanonik reklam pozisyonları (frontend slot key'leri ile birebir).
export const BANNER_POSITIONS = [
  "global_top",
  "global_footer",
  "home_ticker_below",
  "home_mid",
  "home_footer_top",
  "prices_top",
  "prices_sidebar",
  "analiz_inline",
  "analiz_sidebar",
  "urun_sidebar",
  "hal_sidebar",
] as const;

const positionSchema = z.enum(BANNER_POSITIONS);
const deviceSchema = z.enum(["all", "desktop", "mobile"]);
const typeSchema = z.enum(["image", "code"]);

const upsertSchema = z.object({
  position: positionSchema,
  title: z.string().trim().min(2).max(190),
  advertiser: z.string().trim().max(160).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
  type: typeSchema.optional(),
  imageUrl: z.string().trim().max(512).nullable().optional(),
  alt: z.string().trim().max(255).nullable().optional(),
  linkUrl: z.string().trim().max(500).nullable().optional(),
  linkTarget: z.string().trim().max(20).optional(),
  rel: z.string().trim().max(64).optional(),
  code: z.string().max(20000).nullable().optional(),
  caption: z.string().trim().max(300).nullable().optional(),
  ctaLabel: z.string().trim().max(60).nullable().optional(),
  device: deviceSchema.optional(),
  weight: z.coerce.number().int().min(1).max(1000).optional(),
  displayOrder: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
});

const patchSchema = upsertSchema.partial();

const listQuerySchema = z.object({
  position: positionSchema.optional(),
  is_active: z.enum(["0", "1"]).optional(),
  q: z.string().trim().min(1).max(128).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

function publicBanner(row: NonNullable<Awaited<ReturnType<typeof pickActiveForPosition>>>) {
  return {
    id: row.id,
    position: row.position,
    type: row.type,
    title: row.title,
    advertiser: row.advertiser,
    imageUrl: row.imageUrl,
    alt: row.alt ?? row.title,
    linkUrl: row.linkUrl,
    linkTarget: row.linkTarget,
    rel: row.rel,
    code: row.code,
    caption: row.caption,
    ctaLabel: row.ctaLabel,
    device: row.device,
  };
}

export async function registerBanners(app: FastifyInstance) {
  // Slot için aktif banner döndürür; reklam kapalıysa veya banner yoksa null.
  app.get("/banners", async (req, reply) => {
    const parsed = z.object({ position: positionSchema }).safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz pozisyon" });
    if (!(await isAdsEnabled())) return reply.send({ data: null });
    const row = await pickActiveForPosition(parsed.data.position);
    if (!row) return reply.send({ data: null });
    void incImpression(row.id);
    reply.header("Cache-Control", "public, max-age=120, s-maxage=120");
    return reply.send({ data: publicBanner(row) });
  });

  // Tıklama sayar + hedefe 302 yönlendirir (görünür <a href> bu endpoint'e gider).
  app.get<{ Params: { id: string } }>("/banners/:id/click", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const row = await getBannerById(id);
    if (!row || !row.linkUrl) return reply.status(404).send({ error: "Bulunamadi" });
    void incClick(id);
    return reply.redirect(row.linkUrl, 302);
  });
}

export async function registerBannersAdmin(app: FastifyInstance) {
  app.get("/banners", async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz sorgu" });
    const { position, is_active, q, limit, offset } = parsed.data;
    const items = await listBanners({
      position,
      isActive: is_active === undefined ? undefined : is_active === "1",
      q,
      limit,
      offset,
    });
    return reply.send({ items, positions: BANNER_POSITIONS });
  });

  app.get("/banners/stats", async (_req, reply) => {
    return reply.send({ items: await bannerStats() });
  });

  app.get<{ Params: { id: string } }>("/banners/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const row = await getBannerById(id);
    if (!row) return reply.status(404).send({ error: "Bulunamadi" });
    return reply.send({ data: row });
  });

  app.post("/banners", async (req, reply) => {
    const parsed = upsertSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz alanlar", issues: parsed.error.issues });
    const id = await createBanner(parsed.data);
    const row = await getBannerById(id);
    return reply.status(201).send({ data: row });
  });

  app.patch<{ Params: { id: string } }>("/banners/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    const parsed = patchSchema.safeParse(req.body ?? {});
    if (!parsed.success) return reply.status(400).send({ error: "Gecersiz alanlar", issues: parsed.error.issues });
    const ok = await updateBanner(id, parsed.data);
    if (!ok) return reply.status(400).send({ error: "Guncellenecek alan yok" });
    const row = await getBannerById(id);
    if (!row) return reply.status(404).send({ error: "Bulunamadi" });
    return reply.send({ data: row });
  });

  app.delete<{ Params: { id: string } }>("/banners/:id", async (req, reply) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ error: "Gecersiz id" });
    await deleteBanner(id);
    return reply.send({ ok: true });
  });
}
