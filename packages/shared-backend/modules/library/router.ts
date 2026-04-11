// src/modules/library/router.ts
import type { FastifyInstance } from 'fastify';
import {
  listLibraryPublic,
  getLibraryPublic,
  getLibraryBySlugPublic,
  listLibraryImagesPublic,
  listLibraryFilesPublic,
  trackLibraryDownload,
} from './controller';

export async function registerLibrary(app: FastifyInstance) {
  const B = '/library';
  app.get(B, { config: { public: true } }, listLibraryPublic);
  app.get(`${B}/:id`, { config: { public: true } }, getLibraryPublic);
  app.get(`${B}/by-slug/:slug`, { config: { public: true } }, getLibraryBySlugPublic);
  app.get(`${B}/:id/images`, { config: { public: true } }, listLibraryImagesPublic);
  app.get(`${B}/:id/files`, { config: { public: true } }, listLibraryFilesPublic);
  app.post(`${B}/:id/track-download`, { config: { public: true } }, trackLibraryDownload);
}
