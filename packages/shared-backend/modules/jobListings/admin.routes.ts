// src/modules/jobListings/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  adminListJobs,
  adminGetJob,
  adminCreateJob,
  adminUpdateJob,
  adminDeleteJob,
  adminToggleJobActive,
  adminReorderJobs,
} from './admin.controller';

export async function registerJobListingsAdmin(app: FastifyInstance) {
  const B = '/jobs';
  app.get(B, adminListJobs);
  app.get(`${B}/:id`, adminGetJob);
  app.post(B, adminCreateJob);
  app.put(`${B}/:id`, adminUpdateJob);
  app.delete(`${B}/:id`, adminDeleteJob);
  app.patch(`${B}/:id/active`, adminToggleJobActive);
  app.post(`${B}/reorder`, adminReorderJobs);
}
