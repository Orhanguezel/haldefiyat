import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import {
  adminListServices,
  adminGetService,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
  adminListServiceImages,
  adminCreateServiceImage,
  adminUpdateServiceImage,
  adminDeleteServiceImage,
} from './admin.controller';

export async function registerServicesAdmin(app: FastifyInstance) {
  const BASE = '/services';
  const guard = { preHandler: [requireAuth, requireAdmin] };

  app.get(BASE, guard, adminListServices);
  app.get(`${BASE}/:id`, guard, adminGetService);
  app.post(BASE, guard, adminCreateService);
  app.patch(`${BASE}/:id`, guard, adminUpdateService);
  app.delete(`${BASE}/:id`, guard, adminDeleteService);

  // Service images
  app.get(`${BASE}/:id/images`, guard, adminListServiceImages);
  app.post(`${BASE}/:id/images`, guard, adminCreateServiceImage);
  app.patch(`${BASE}/:id/images/:imageId`, guard, adminUpdateServiceImage);
  app.delete(`${BASE}/:id/images/:imageId`, guard, adminDeleteServiceImage);
}
