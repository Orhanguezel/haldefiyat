// =============================================================
// FILE: src/modules/gallery/router.ts
// Public gallery routes
// =============================================================
import type { FastifyInstance } from 'fastify';
import { listGalleriesPublic, getGalleryBySlugPublic } from './controller';

export async function registerGallery(app: FastifyInstance) {
  app.get('/galleries', { config: { public: true } }, listGalleriesPublic);
  app.get('/galleries/:slug', { config: { public: true } }, getGalleryBySlugPublic);
}
