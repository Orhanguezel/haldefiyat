import { z } from "zod";
import { LOCALE_LIKE, boolLike } from "@agro/shared-backend/modules/_shared";

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const publicListQuerySchema = z.object({
  type:   z.string().optional(),
  q:      z.string().optional(),
  current_path: z.string().trim().min(1).max(500).optional(),
  limit:  z.coerce.number().int().min(0).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort:   z.enum(["display_order", "created_at", "updated_at"]).default("display_order"),
  order:  z.enum(["asc", "desc"]).default("asc"),
  locale: LOCALE_LIKE.optional(),
  default_locale: LOCALE_LIKE.optional(),
});

export const adminListQuerySchema = publicListQuerySchema.extend({
  is_active: boolLike.optional(),
});

export const localeQuerySchema = z.object({
  locale: LOCALE_LIKE.optional(),
  default_locale: LOCALE_LIKE.optional(),
});

const colorField = z.string().max(30).optional().nullable();

export const createSchema = z.object({
  locale: LOCALE_LIKE.optional(),
  type:  z.enum(["topbar", "sidebar_top", "sidebar_center", "sidebar_bottom"]).default("topbar"),
  title: z.string().min(1).max(255),

  content: z.string().optional().nullable(),

  background_color: colorField,
  text_color:       colorField,

  button_text:        z.string().max(100).optional().nullable(),
  button_color:       colorField,
  button_hover_color: colorField,
  button_text_color:  colorField,

  link_url:    z.string().max(500).optional().nullable(),
  link_target: z.enum(["_self", "_blank"]).optional().default("_self"),
  target_paths: z.array(z.string().trim().min(1).max(255)).max(25).optional().default([]),

  image_url:      z.string().url().optional().nullable(),
  image_asset_id: z.string().uuid().optional().nullable(),
  alt:            z.string().max(255).optional().nullable(),

  text_behavior: z.enum(["static", "marquee"]).optional().default("marquee"),
  scroll_speed:  z.coerce.number().int().min(10).max(500).optional().default(60),

  closeable:         boolLike.optional().default(true),
  delay_seconds:     z.coerce.number().int().min(0).optional().default(0),
  display_frequency: z.enum(["always", "once", "daily"]).optional().default("always"),

  is_active:     boolLike.optional().default(true),
  display_order: z.coerce.number().int().min(0).optional(),

  start_at: z.coerce.date().optional().nullable(),
  end_at:   z.coerce.date().optional().nullable(),
});

export const updateSchema = createSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.coerce.number().int().positive()).min(1),
});

export const setStatusSchema = z.object({
  is_active: boolLike,
});

export type PublicListQuery = z.infer<typeof publicListQuerySchema>;
export type AdminListQuery  = z.infer<typeof adminListQuerySchema>;
export type CreateBody      = z.infer<typeof createSchema>;
export type UpdateBody      = z.infer<typeof updateSchema>;
