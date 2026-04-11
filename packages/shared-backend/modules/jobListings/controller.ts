// src/modules/jobListings/controller.ts
import type { RouteHandler } from 'fastify';
import { repoListActiveJobs, repoGetJobBySlug } from './repository';
import { handleRouteError, sendNotFound } from '@agro/shared-backend/modules/_shared';

export const listJobs: RouteHandler = async (req, reply) => {
  try {
    const locale = (req.query as { locale?: string }).locale || 'tr';
    const rows = await repoListActiveJobs(locale);
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'list_jobs_error');
  }
};

export const getJobBySlug: RouteHandler = async (req, reply) => {
  try {
    const { slug } = req.params as { slug: string };
    const locale = (req.query as { locale?: string }).locale || 'tr';
    const row = await repoGetJobBySlug(slug, locale);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'get_job_error');
  }
};
