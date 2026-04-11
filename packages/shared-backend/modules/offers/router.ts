import type { FastifyInstance } from "fastify";

import { createPublicOffer } from "./public.controller";

export async function registerOffersPublic(app: FastifyInstance) {
  const B = "/offers";
  app.post(`${B}/public`, createPublicOffer);
}
