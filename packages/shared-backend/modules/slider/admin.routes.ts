// src/modules/slider/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  adminListSlides,
  adminGetSlide,
  adminCreateSlide,
  adminUpdateSlide,
  adminDeleteSlide,
  adminReorderSlides,
  adminSetStatus,
  adminSetSliderImage,
} from './admin.controller';

export async function registerSliderAdmin(app: FastifyInstance) {
  const B = '/sliders';
  app.get(B, adminListSlides);
  app.get(`${B}/:id`, adminGetSlide);
  app.post(B, adminCreateSlide);
  app.patch(`${B}/:id`, adminUpdateSlide);
  app.delete(`${B}/:id`, adminDeleteSlide);
  app.post(`${B}/reorder`, adminReorderSlides);
  app.post(`${B}/:id/status`, adminSetStatus);
  app.patch(`${B}/:id/image`, adminSetSliderImage);
}
