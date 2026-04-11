// src/modules/library/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  listLibraryAdmin,
  getLibraryAdmin,
  getLibraryBySlugAdmin,
  createLibraryAdmin,
  updateLibraryAdmin,
  removeLibraryAdmin,
  listLibraryImagesAdmin,
  createLibraryImageAdmin,
  updateLibraryImageAdmin,
  removeLibraryImageAdmin,
  reorderLibraryAdmin,
  listLibraryFilesAdmin,
  createLibraryFileAdmin,
  updateLibraryFileAdmin,
  removeLibraryFileAdmin,
} from './admin.controller';

export async function registerLibraryAdmin(app: FastifyInstance) {
  const B = '/library';
  app.get(B, listLibraryAdmin);
  app.get(`${B}/:id`, getLibraryAdmin);
  app.get(`${B}/by-slug/:slug`, getLibraryBySlugAdmin);
  app.post(B, createLibraryAdmin);
  app.patch(`${B}/:id`, updateLibraryAdmin);
  app.delete(`${B}/:id`, removeLibraryAdmin);
  app.get(`${B}/:id/images`, listLibraryImagesAdmin);
  app.post(`${B}/:id/images`, createLibraryImageAdmin);
  app.patch(`${B}/:id/images/:imageId`, updateLibraryImageAdmin);
  app.delete(`${B}/:id/images/:imageId`, removeLibraryImageAdmin);
  app.post(`${B}/reorder`, reorderLibraryAdmin);
  app.get(`${B}/:id/files`, listLibraryFilesAdmin);
  app.post(`${B}/:id/files`, createLibraryFileAdmin);
  app.patch(`${B}/:id/files/:fileId`, updateLibraryFileAdmin);
  app.delete(`${B}/:id/files/:fileId`, removeLibraryFileAdmin);
}
