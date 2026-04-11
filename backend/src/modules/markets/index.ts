import type { FastifyInstance } from "fastify";
import { listMarkets } from "./repository";

export async function registerMarkets(app: FastifyInstance) {
  app.get("/markets", async (_req, reply) => {
    const items = await listMarkets();
    return reply.send({ items });
  });
}
