// =============================================================
// FILE: src/modules/review/admin.controller.ts (ADMIN)
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { reviewListQuerySchema, reviewCreateSchema, reviewUpdateSchema } from './validation';
import {
  repoListReviews,
  repoGetReview,
  repoCreateReview,
  repoUpdateReview,
  repoDeleteReview,
} from './repository';
import { handleRouteError, sendNotFound } from '@agro/shared-backend/modules/_shared';

/** GET /admin/reviews */
export async function listReviewsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = reviewListQuerySchema.parse(req.query);
    const locale = q.locale || 'tr';
    const data = await repoListReviews(q, locale, false);
    return reply.send(data);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_ADMIN');
  }
}

/** GET /admin/reviews/:id */
export async function getReviewAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const locale = ((req.query as any)?.locale as string) || 'tr';
    const review = await repoGetReview(id, locale);
    if (!review) return sendNotFound(reply);
    return reply.send(review);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_ADMIN');
  }
}

/** POST /admin/reviews */
export async function createReviewAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = reviewCreateSchema.parse(req.body);
    const locale = body.locale || 'tr';
    const created = await repoCreateReview(body, locale);
    return reply.code(201).send(created);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_ADMIN');
  }
}

/** PATCH /admin/reviews/:id */
export async function updateReviewAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const body = reviewUpdateSchema.parse(req.body);
    const locale = body.locale || 'tr';
    const updated = await repoUpdateReview(id, body, locale);
    if (!updated) return sendNotFound(reply);
    return reply.send(updated);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_ADMIN');
  }
}

/** DELETE /admin/reviews/:id */
export async function removeReviewAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    await repoDeleteReview(id);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_ADMIN');
  }
}
