// src/modules/categories/validation.ts

import { z } from 'zod';
import { LOCALE_LIKE, SLUG, boolLike } from '../_shared';

export const createCategorySchema = z.object({
  module_key: z.string().min(1).max(64).default('general'),
  icon: z.string().max(255).optional(),
  is_active: boolLike.optional(),
  is_featured: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).default(0),
  // i18n fields
  locale: LOCALE_LIKE,
  name: z.string().min(1).max(255),
  slug: SLUG,
  description: z.string().max(5000).optional(),
  alt: z.string().max(255).optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const listCategoriesSchema = z.object({
  locale: LOCALE_LIKE.optional(),
  module_key: z.string().max(64).optional(),
  search: z.string().max(255).optional(),
  is_active: boolLike.optional(),
  is_featured: boolLike.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
