import { z } from 'zod';
import { LOCALE_LIKE, SLUG, UUID36, boolLike, emptyToNull } from '../_shared';

export const listQuerySchema = z.object({
  locale: LOCALE_LIKE.optional().default('tr'),
  module_key: z.string().max(100).optional(),
  is_published: boolLike.optional(),
  search: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(250).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const createSchema = z.object({
  module_key: z.string().min(1).max(100).default('kurumsal'),
  locale: LOCALE_LIKE.default('tr'),
  title: z.string().min(1).max(500),
  slug: SLUG,
  content: z.string().max(200000).optional().nullable(),
  summary: z.string().max(10000).optional().nullable(),
  meta_title: emptyToNull(z.string().max(255).optional().nullable()),
  meta_description: emptyToNull(z.string().max(500).optional().nullable()),
  is_published: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).optional(),
  featured_image: emptyToNull(z.string().max(500).optional().nullable()),
  storage_asset_id: emptyToNull(UUID36.optional().nullable()),
  images: z.array(z.string().min(1)).optional().default([]),
  storage_image_ids: z.array(z.string().min(1).max(64)).optional().default([]),
});

export const updateSchema = createSchema.partial().extend({
  locale: LOCALE_LIKE,
});

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: UUID36,
    display_order: z.coerce.number().int().min(0),
  })).min(1),
});

export const bySlugParamsSchema = z.object({
  slug: SLUG,
});

export type ListQueryInput = z.infer<typeof listQuerySchema>;
export type CreateCustomPageInput = z.infer<typeof createSchema>;
export type UpdateCustomPageInput = z.infer<typeof updateSchema>;
export type ReorderCustomPagesInput = z.infer<typeof reorderSchema>;
