// src/modules/jobApplications/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  adminListApplications,
  adminGetApplication,
  adminUpdateApplicationStatus,
  adminDeleteApplication,
} from './admin.controller';

export async function registerJobApplicationsAdmin(app: FastifyInstance) {
  const B = '/job-applications';
  app.get(B, adminListApplications);
  app.get(`${B}/:id`, adminGetApplication);
  app.patch(`${B}/:id/status`, adminUpdateApplicationStatus);
  app.delete(`${B}/:id`, adminDeleteApplication);
}
