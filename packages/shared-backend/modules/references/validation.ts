// =============================================================
// FILE: src/modules/references/validation.ts
// =============================================================
import { z } from 'zod';

// ✅ Core i18n (dynamic locales runtime from site_settings)
import { isSupported, normalizeLocale } from '../../core/i18n';

type Locale = string;

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

/**
 * Locale input: accept string, validate later (dynamic).
 * We do NOT use z.enum(...) because locales are runtime-loaded.
 */
export const localeInputSchema = z
  .string()
  .optional()
  .transform((v) => {
    const n = normalizeLocale(v);
    return n || undefined;
  });

/** LIST query (public/admin ortak temel) */
export const referencesListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at', 'display_order']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  is_published: boolLike.optional(),
  is_featured: boolLike.optional(),
  q: z.string().optional(),
  slug: z.string().optional(),
  select: z.string().optional(),

  category_id: z.string().uuid().optional(),

  module_key: z.string().optional(),
  has_website: boolLike.optional(),

  // ✅ dynamic locale input (validated in controller)
  locale: localeInputSchema,
});

export type ReferencesListQuery = z.infer<typeof referencesListQuerySchema>;

/** PUBLIC list query – is_published zorunlu true olacak, burada param almıyoruz */
export const publicReferencesListQuerySchema = referencesListQuerySchema.omit({
  is_published: true,
});

export type PublicReferencesListQuery = z.infer<typeof publicReferencesListQuerySchema>;

/** Parent (dil-bağımsız) create/update */
export const upsertReferenceParentBodySchema = z.object({
  is_published: boolLike.optional().default(false),
  is_featured: boolLike.optional().default(false),
  display_order: z.coerce.number().int().min(0).optional(),

  featured_image: z.string().nullable().optional(),
  featured_image_asset_id: z.string().max(64).nullable().optional(),

  website_url: z.string().max(500).nullable().optional(),

  category_id: z.string().nullable().optional(),
});

export type UpsertReferenceParentBody = z.infer<typeof upsertReferenceParentBodySchema>;
export const patchReferenceParentBodySchema = upsertReferenceParentBodySchema.partial();
export type PatchReferenceParentBody = z.infer<typeof patchReferenceParentBodySchema>;

/** i18n create/update */
export const upsertReferenceI18nBodySchema = z.object({
  // ✅ accept input locale, validate later
  locale: localeInputSchema,
  title: z.string().min(1).max(255).trim(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug sadece küçük harf, rakam ve tire içermelidir')
    .trim(),
  summary: z.string().nullable().optional(),
  content: z.string().min(1),

  featured_image_alt: z.string().max(255).nullable().optional(),
  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
});

export type UpsertReferenceI18nBody = z.infer<typeof upsertReferenceI18nBodySchema>;

export const patchReferenceI18nBodySchema = z.object({
  locale: localeInputSchema,
  title: z.string().min(1).max(255).trim().optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug sadece küçük harf, rakam ve tire içermelidir')
    .trim()
    .optional(),
  summary: z.string().nullable().optional(),
  content: z.string().min(1).optional(),
  featured_image_alt: z.string().max(255).nullable().optional(),
  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
});

export type PatchReferenceI18nBody = z.infer<typeof patchReferenceI18nBodySchema>;

export const upsertReferenceBodySchema = upsertReferenceI18nBodySchema.extend({
  is_published: boolLike.optional().default(false),
  is_featured: boolLike.optional().default(false),
  display_order: z.coerce.number().int().min(0).optional(),

  featured_image: z.string().nullable().optional(),
  featured_image_asset_id: z.string().max(64).nullable().optional(),

  category_id: z.string().nullable().optional(),
  website_url: z.string().max(500).nullable().optional(),
});

export type UpsertReferenceBody = z.infer<typeof upsertReferenceBodySchema>;

export const patchReferenceBodySchema = patchReferenceI18nBodySchema.extend({
  is_published: boolLike.optional(),
  is_featured: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).optional(),

  featured_image: z.string().nullable().optional(),
  featured_image_asset_id: z.string().max(64).nullable().optional(),

  category_id: z.string().nullable().optional(),
  website_url: z.string().max(500).nullable().optional(),
});

export type PatchReferenceBody = z.infer<typeof patchReferenceBodySchema>;

export const upsertReferenceImageBodySchema = z.object({
  image_url: z.string().min(1).max(500),
  storage_asset_id: z.string().max(64).nullable().optional(),
  display_order: z.coerce.number().int().min(0).optional(),
  is_featured: boolLike.optional().default(false),
  is_published: boolLike.optional().default(true),
  title: z.string().max(200).nullable().optional(),
  alt: z.string().max(255).nullable().optional(),
  locale: localeInputSchema,
  replicate_all_locales: boolLike.optional(),
});

export type UpsertReferenceImageBody = z.infer<typeof upsertReferenceImageBodySchema>;

export const patchReferenceImageBodySchema = z.object({
  image_url: z.string().min(1).max(500).optional(),
  storage_asset_id: z.string().max(64).nullable().optional(),
  display_order: z.coerce.number().int().min(0).optional(),
  is_featured: boolLike.optional(),
  is_published: boolLike.optional(),
  title: z.string().max(200).nullable().optional(),
  alt: z.string().max(255).nullable().optional(),
  locale: localeInputSchema,
  apply_all_locales: boolLike.optional(),
});

export type PatchReferenceImageBody = z.infer<typeof patchReferenceImageBodySchema>;

export const referenceBySlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const referenceBySlugQuerySchema = z.object({
  locale: localeInputSchema,
});

export type ReferenceBySlugParams = z.infer<typeof referenceBySlugParamsSchema>;
export type ReferenceBySlugQuery = z.infer<typeof referenceBySlugQuerySchema>;

/**
 * Helper: validate/resolve locale at runtime
 * - If invalid: return undefined, controller will pick req.locale or default
 */
export function resolveLocaleOrUndefined(input?: string): Locale | undefined {
  const n = normalizeLocale(input);
  if (n && isSupported(n)) return n as Locale;
  return undefined;
}
