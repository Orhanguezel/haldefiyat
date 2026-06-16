import type { FastifyInstance } from "fastify";
import { listSocialTweets } from "./repository";

export async function registerSocial(app: FastifyInstance) {
  app.get("/social/feed", async (req, reply) => {
    const limit = Number((req.query as { limit?: string })?.limit) || 30;
    try {
      const items = await listSocialTweets(limit);
      reply.header("cache-control", "public, max-age=300");
      return reply.send({ handle: "haldefiyat", count: items.length, items });
    } catch (err) {
      req.log.warn({ err }, "social_feed_failed");
      return reply.send({ handle: "haldefiyat", count: 0, items: [] });
    }
  });
}
