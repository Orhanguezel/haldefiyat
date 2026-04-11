// src/modules/references/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  listReferencesAdmin,
  getReferenceAdmin,
  getReferenceBySlugAdmin,
  createReferenceAdmin,
  updateReferenceAdmin,
  removeReferenceAdmin,
  listReferenceImagesAdmin,
  createReferenceImageAdmin,
  updateReferenceImageAdmin,
  removeReferenceImageAdmin,
} from './admin.controller';

export async function registerReferencesAdmin(app: FastifyInstance) {
  const B = '/references';
  app.get(B, listReferencesAdmin);
  app.get(`${B}/:id`, getReferenceAdmin);
  app.get(`${B}/by-slug/:slug`, getReferenceBySlugAdmin);
  app.post(B, createReferenceAdmin);
  app.patch(`${B}/:id`, updateReferenceAdmin);
  app.delete(`${B}/:id`, removeReferenceAdmin);
  app.get(`${B}/:id/images`, listReferenceImagesAdmin);
  app.post(`${B}/:id/images`, createReferenceImageAdmin);
  app.patch(`${B}/:id/images/:imageId`, updateReferenceImageAdmin);
  app.delete(`${B}/:id/images/:imageId`, removeReferenceImageAdmin);
}
