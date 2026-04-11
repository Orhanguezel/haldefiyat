// src/modules/mail/router.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from '../../../middleware/auth';
import { sendTestMail, sendMailHandler } from "./controller";

const B = "/mail";

export async function registerMail(app: FastifyInstance) {
  app.post(`${B}/test`, { preHandler: [requireAuth] }, sendTestMail);
  app.post(`${B}/send`, { preHandler: [requireAuth] }, sendMailHandler);
}
