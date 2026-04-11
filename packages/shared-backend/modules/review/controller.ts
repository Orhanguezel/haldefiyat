// =============================================================
// FILE: src/modules/review/controller.ts (PUBLIC)
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { reviewListQuerySchema, reviewCreateSchema } from './validation';
import { repoListReviews, repoGetReview, repoCreateReview, repoAddReaction } from './repository';
import { isRecaptchaEnabled, shouldBypassRecaptchaForOrigin, verifyRecaptchaToken } from './recaptcha';
import { handleRouteError, sendNotFound } from '@agro/shared-backend/modules/_shared';

/** GET /reviews */
export async function listReviewsPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = reviewListQuerySchema.parse(req.query);
    const locale = q.locale || 'tr';
    const data = await repoListReviews(q, locale, true);
    return reply.send(data);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_PUBLIC');
  }
}

/** GET /reviews/:id */
export async function getReviewPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const locale = ((req.query as any)?.locale as string) || 'tr';
    const review = await repoGetReview(id, locale);
    if (!review) return sendNotFound(reply);
    return reply.send(review);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_PUBLIC');
  }
}

/** POST /reviews */
export async function createReviewPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = reviewCreateSchema.parse(req.body);
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';

    if (isRecaptchaEnabled() && !shouldBypassRecaptchaForOrigin(origin)) {
      if (!body.captcha_token) {
        return reply.code(400).send({ error: { message: 'captcha_required' } });
      }
      const remoteIp = ((req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0] || '').trim() || req.ip;
      const result = await verifyRecaptchaToken(body.captcha_token, remoteIp || undefined);
      if (!result.success) {
        return reply.code(400).send({ error: { message: 'captcha_verification_failed' } });
      }
    }

    const locale = body.locale || 'tr';
    const created = await repoCreateReview(body, locale);
    return reply.code(201).send(created);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_PUBLIC');
  }
}

/** POST /reviews/:id/reactions */
export async function addReviewReactionPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const locale = ((req.query as any)?.locale as string) || 'tr';
    const updated = await repoAddReaction(id, locale);
    if (!updated) return sendNotFound(reply);
    return reply.send(updated);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REVIEW_PUBLIC');
  }
}
