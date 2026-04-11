import type { FastifyInstance } from 'fastify';
import {
  adminCreatePage,
  adminDeletePage,
  adminGetPage,
  adminListPages,
  adminReorderPages,
  adminUpdatePage,
} from './admin.controller';

export async function registerCustomPagesAdmin(app: FastifyInstance) {
  const B = '/custom-pages';
  app.get(B, adminListPages);
  app.get(`${B}/:id`, adminGetPage);
  app.post(B, adminCreatePage);
  app.patch(`${B}/:id`, adminUpdatePage);
  app.delete(`${B}/:id`, adminDeletePage);
  app.post(`${B}/reorder`, adminReorderPages);
}
