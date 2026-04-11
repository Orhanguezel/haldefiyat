// =============================================================
// FILE: src/modules/offer/router.ts
// Bereket Fide – Offer Module Public Routes
// =============================================================

import type { FastifyInstance } from "fastify";
import { createOfferPublic } from "./controller";

const BASE = "/offers";

export async function registerOffer(app: FastifyInstance) {
  // Public teklif talebi oluşturma
  app.post(
    `${BASE}`,
    { config: { public: true } },
    createOfferPublic,
  );

  // İleride public status tracking vs. eklenecekse buraya gelir.
}
