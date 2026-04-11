// src/modules/jobListings/router.ts
import type { FastifyInstance } from 'fastify';
import { listJobs, getJobBySlug } from './controller';

export async function registerJobListings(app: FastifyInstance) {
  const B = '/jobs';
  app.get(B, listJobs);
  app.get(`${B}/:slug`, getJobBySlug);
}
