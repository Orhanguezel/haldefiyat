import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import {
  adminListNewsletter,
  adminGetNewsletterSubscriber,
  adminDeleteNewsletterSubscriber,
} from './admin.controller';

export async function registerNewsletterAdmin(app: FastifyInstance) {
  const B = '/newsletter';
  const guard = { preHandler: [requireAuth, requireAdmin] };

  app.get(B, guard, adminListNewsletter);
  app.get(`${B}/:id`, guard, adminGetNewsletterSubscriber);
  app.delete(`${B}/:id`, guard, adminDeleteNewsletterSubscriber);
}
