// =============================================================
// FILE: src/modules/review/admin.routes.ts (ADMIN)
// =============================================================
import type { FastifyInstance } from 'fastify';
import {
  listReviewsAdmin,
  getReviewAdmin,
  createReviewAdmin,
  updateReviewAdmin,
  removeReviewAdmin,
} from './admin.controller';

const B = '/reviews';

export async function registerReviewsAdmin(app: FastifyInstance) {
  app.get(B, listReviewsAdmin);
  app.get(`${B}/:id`, getReviewAdmin);
  app.post(B, createReviewAdmin);
  app.patch(`${B}/:id`, updateReviewAdmin);
  app.delete(`${B}/:id`, removeReviewAdmin);
}
