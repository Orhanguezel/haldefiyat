// src/modules/gallery/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  adminListGalleries,
  adminGetGallery,
  adminCreateGallery,
  adminUpdateGallery,
  adminDeleteGallery,
  adminReorderGalleries,
  adminListGalleryImages,
  adminAddGalleryImage,
  adminBulkAddGalleryImages,
  adminUpdateGalleryImage,
  adminDeleteGalleryImage,
  adminReorderGalleryImages,
} from './admin.controller';

export async function registerGalleryAdmin(app: FastifyInstance) {
  const B = '/galleries';
  app.get(B, adminListGalleries);
  app.get(`${B}/:id`, adminGetGallery);
  app.post(B, adminCreateGallery);
  app.patch(`${B}/:id`, adminUpdateGallery);
  app.delete(`${B}/:id`, adminDeleteGallery);
  app.post(`${B}/reorder`, adminReorderGalleries);
  app.get(`${B}/:id/images`, adminListGalleryImages);
  app.post(`${B}/:id/images`, adminAddGalleryImage);
  app.post(`${B}/:id/images/bulk`, adminBulkAddGalleryImages);
  app.patch(`${B}/:id/images/:imageId`, adminUpdateGalleryImage);
  app.delete(`${B}/:id/images/:imageId`, adminDeleteGalleryImage);
  app.post(`${B}/:id/images/reorder`, adminReorderGalleryImages);
}
