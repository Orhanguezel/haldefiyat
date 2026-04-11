// =============================================================
// FILE: src/modules/services/router.ts
// =============================================================
import type { FastifyInstance } from 'fastify';
import { listServices, getServiceBySlug, getServiceById } from './controller';

export async function registerServices(app: FastifyInstance) {
  app.get('/services', { config: { public: true } }, listServices);
  app.get('/services/by-slug/:slug', { config: { public: true } }, getServiceBySlug);
  app.get('/services/:id', { config: { public: true } }, getServiceById);
}
