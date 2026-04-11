// =============================================================
// FILE: src/modules/slider/validation.ts
// Slider – parent + i18n (core/i18n runtime locale aware) [FINAL]
// =============================================================
import { z } from 'zod';

/** Ortak: id param (parent id = slider.id) */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/** Ortak: idOrSlug param (public detail – slug) */
export const idOrSlugParamSchema = z.object({
  idOrSlug: z.string().min(1),
});

/** Locale format (DB doğrulaması yok; yalnız format) */
const LOCALE_SCHEMA = z
  .string()
  .min(2)
  .max(10)
  .regex(/^[a-zA-Z]{2,3}([_-][a-zA-Z0-9]{2,8})?$/, 'invalid_locale');

/** Public list (aktifler; locale/default_locale controller’da çözülecek) */
export const publicListQuerySchema = z.object({
  locale: LOCALE_SCHEMA.optional(),
  default_locale: LOCALE_SCHEMA.optional(),

  q: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['display_order', 'name', 'created_at', 'updated_at']).default('display_order'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

/** Admin list */
export const adminListQuerySchema = z.object({
  locale: LOCALE_SCHEMA.optional(),
  default_locale: LOCALE_SCHEMA.optional(),

  q: z.string().optional(),
  limit: z.coerce.number().int().min(0).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['display_order', 'name', 'created_at', 'updated_at']).default('display_order'),
  order: z.enum(['asc', 'desc']).default('asc'),
  is_active: z.coerce.boolean().optional(),
});

/**
 * Create:
 *  - Parent + i18n tek body
 */
export const createSchema = z.object({
  locale: LOCALE_SCHEMA.optional(),

  name: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional().nullable(),

  image_url: z.string().refine((s) => s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/'), 'URL veya relative path olmalı').optional().nullable(),
  image_asset_id: z.string().uuid().optional().nullable(),

  alt: z.string().max(255).optional().nullable(),
  buttonText: z.string().max(100).optional().nullable(),
  buttonLink: z.string().max(255).optional().nullable(),

  featured: z.coerce.boolean().optional().default(false),
  is_active: z.coerce.boolean().optional().default(true),

  display_order: z.coerce.number().int().min(0).optional(),
});

/** Update: tamamen partial */
export const updateSchema = createSchema.partial();

/** Reorder */
export const reorderSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
});

/** Toggle/set status */
export const setStatusSchema = z.object({
  is_active: z.coerce.boolean(),
});

/**
 * ✅ Görsel bağlama/çıkarma (parent slider.image_* alanları)
 * - asset_id: tek kapak
 * - asset_ids: çoklu gönderilebilir; ilk geçerli olan kapak olur
 * - null/undefined ⇒ temizle
 */
export const setImageSchema = z.object({
  asset_id: z.string().uuid().nullable().optional(),
  asset_ids: z.array(z.string().uuid()).optional(),
});

export type PublicListQuery = z.infer<typeof publicListQuerySchema>;
export type AdminListQuery = z.infer<typeof adminListQuerySchema>;
export type CreateBody = z.infer<typeof createSchema>;
export type UpdateBody = z.infer<typeof updateSchema>;
export type SetImageBody = z.infer<typeof setImageSchema>;
