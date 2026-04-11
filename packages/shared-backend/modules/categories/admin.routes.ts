// src/modules/categories/admin.routes.ts

import type { FastifyInstance } from 'fastify';
import {
  adminListCategories,
  adminGetCategory,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminReorderCategories,
  adminToggleCategoryActive,
  adminToggleCategoryFeatured,
  adminSetCategoryImage,
} from './admin.controller';

export async function registerCategoriesAdmin(app: FastifyInstance) {
  const B = '/categories';
  app.get(`${B}/list`, adminListCategories);
  app.post(`${B}/reorder`, adminReorderCategories);
  app.get(`${B}/:id`, adminGetCategory);
  app.post(B, adminCreateCategory);
  app.patch(`${B}/:id`, adminUpdateCategory);
  app.delete(`${B}/:id`, adminDeleteCategory);
  app.patch(`${B}/:id/active`, adminToggleCategoryActive);
  app.patch(`${B}/:id/featured`, adminToggleCategoryFeatured);
  app.patch(`${B}/:id/image`, adminSetCategoryImage);
}
