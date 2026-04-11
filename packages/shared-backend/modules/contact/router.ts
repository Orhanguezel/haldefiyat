// src/modules/contact/router.ts
import type { FastifyInstance } from "fastify";
import { createContactPublic } from "./controller";

const B = "/contacts";

export async function registerContacts(app: FastifyInstance) {
  app.post(B, { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, createContactPublic);
}
