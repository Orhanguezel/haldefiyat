import type { FastifyInstance } from "fastify";
import { listSocialPosts, isSocialPlatform, type SocialPlatformKey } from "./repository";

function resolvePlatform(raw: unknown): SocialPlatformKey {
  return isSocialPlatform(raw) ? raw : "twitter";
}

export async function registerSocial(app: FastifyInstance) {
  // Public besleme — geriye dönük uyumlu (varsayılan twitter), opsiyonel ?platform=
  app.get("/social/feed", async (req, reply) => {
    const q = req.query as { limit?: string; platform?: string };
    const limit = Number(q?.limit) || 30;
    const platform = resolvePlatform(q?.platform);
    try {
      const items = await listSocialPosts(platform, limit);
      reply.header("cache-control", "public, max-age=300");
      return reply.send({ handle: "haldefiyat", platform, count: items.length, items });
    } catch (err) {
      req.log.warn({ err }, "social_feed_failed");
      return reply.send({ handle: "haldefiyat", platform, count: 0, items: [] });
    }
  });
}

export async function registerSocialAdmin(adminApi: FastifyInstance) {
  // Admin izleme paneli — platform başına gerçek gönderiler + analitik.
  adminApi.get("/social/feed", async (req, reply) => {
    const q = req.query as { limit?: string; platform?: string };
    const limit = Number(q?.limit) || 30;
    const platform = resolvePlatform(q?.platform);
    try {
      const items = await listSocialPosts(platform, limit);
      return reply.send({ handle: "haldefiyat", platform, count: items.length, items });
    } catch (err) {
      req.log.warn({ err }, "admin_social_feed_failed");
      return reply.send({ handle: "haldefiyat", platform, count: 0, items: [] });
    }
  });
}
