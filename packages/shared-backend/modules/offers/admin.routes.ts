import type { FastifyInstance } from "fastify";

import {
  createOfferAdmin,
  generateOfferPdfAdmin,
  getOfferAdmin,
  listOffersAdmin,
  removeOfferAdmin,
  sendOfferAdmin,
  sendOfferEmailAdmin,
  updateOfferAdmin,
} from "./admin.controller";

export async function registerOffersAdmin(app: FastifyInstance) {
  const B = "/offers";
  app.get(B, listOffersAdmin);
  app.get(`${B}/:id`, getOfferAdmin);
  app.post(B, createOfferAdmin);
  app.patch(`${B}/:id`, updateOfferAdmin);
  app.delete(`${B}/:id`, removeOfferAdmin);
  app.post(`${B}/:id/pdf`, generateOfferPdfAdmin);
  app.post(`${B}/:id/email`, sendOfferEmailAdmin);
  app.post(`${B}/:id/send`, sendOfferAdmin);
}
