// =============================================================
// FILE: src/modules/review/router.ts (PUBLIC)
// =============================================================
import type { FastifyInstance } from 'fastify';
import { listReviewsPublic, getReviewPublic, createReviewPublic, addReviewReactionPublic } from './controller';

const B = '/reviews';

export async function registerReviews(app: FastifyInstance) {
  app.get(B, { config: { public: true } }, listReviewsPublic);
  app.get(`${B}/:id`, { config: { public: true } }, getReviewPublic);
  app.post(B, { config: { public: true } }, createReviewPublic);
  app.post(`${B}/:id/reactions`, { config: { public: true } }, addReviewReactionPublic);
}
