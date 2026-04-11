// =============================================================
// FILE: src/modules/offer/admin.routes.ts
// Bereket Fide – Offer Module Admin Routes
//   - Auth + Admin guard
// =============================================================

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";

import {
  listOffersAdmin,
  getOfferAdmin,
  createOfferAdmin,
  updateOfferAdmin,
  removeOfferAdmin,

  // ✅ yeni
  generateOfferPdfAdmin,
  sendOfferEmailAdmin,

  // eski (kalsın)
  sendOfferAdmin,
} from "./admin.controller";

const BASE = "/offers";

export async function registerOfferAdmin(app: FastifyInstance) {
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    if (reply.sent) return;
    await requireAdmin(req, reply);
  };

  app.get(
    `${BASE}`,
    { preHandler: adminGuard },
    listOffersAdmin,
  );

  app.get(
    `${BASE}/:id`,
    { preHandler: adminGuard },
    getOfferAdmin,
  );

  app.post(
    `${BASE}`,
    { preHandler: adminGuard },
    createOfferAdmin,
  );

  app.patch(
    `${BASE}/:id`,
    { preHandler: adminGuard },
    updateOfferAdmin,
  );

  app.delete(
    `${BASE}/:id`,
    { preHandler: adminGuard },
    removeOfferAdmin,
  );

  // ✅ YENİ: sadece PDF üret
  app.post(
    `${BASE}/:id/pdf`,
    { preHandler: adminGuard },
    generateOfferPdfAdmin,
  );

  // ✅ YENİ: sadece email gönder
  app.post(
    `${BASE}/:id/email`,
    { preHandler: adminGuard },
    sendOfferEmailAdmin,
  );

  // eski: PDF üret + mail gönder
  app.post(
    `${BASE}/:id/send`,
    { preHandler: adminGuard },
    sendOfferAdmin,
  );
}
