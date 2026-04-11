// src/modules/slider/router.ts
import type { FastifyInstance } from 'fastify';
import { listPublicSlides, getPublicSlide } from './controller';

export async function registerSlider(app: FastifyInstance) {
  const B = '/sliders';
  app.get(B, listPublicSlides);
  app.get(`${B}/:idOrSlug`, getPublicSlide);
}
