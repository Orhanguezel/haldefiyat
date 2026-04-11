// src/modules/jobApplications/router.ts
import type { FastifyInstance } from 'fastify';
import { submitApplication } from './controller';

export async function registerJobApplications(app: FastifyInstance) {
  app.post('/job-applications', submitApplication);
}
