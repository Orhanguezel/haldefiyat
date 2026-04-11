import { z } from 'zod';

export const blogCategories = [
  'genel',
  'haber',
  'tohum-bilimi',
  'ekim-teknikleri',
  'tarim-teknolojisi',
  'piyasa-analizi',
  'mevsimsel',
] as const;

export const blogStatuses = ['draft', 'published'] as const;

export const blogListQuerySchema = z.object({
  locale: z.string().min(2).max(8).optional(),
  category: z.enum(blogCategories).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(50).optional(),
});

export const blogPostCreateSchema = z.object({
  locale: z.string().min(2).max(8),
  category: z.enum(blogCategories),
  author: z.string().max(128).optional().nullable(),
  image_url: z.string().max(512).optional().nullable(),
  status: z.enum(blogStatuses),
  published_at: z.string().optional().nullable(),
  is_active: z.boolean(),
  display_order: z.number().int(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1),
  meta_title: z.string().max(255).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
});

export const blogPostUpdateSchema = blogPostCreateSchema.partial().extend({
  locale: z.string().min(2).max(8).optional(),
});

export const rssImportBodySchema = z.object({
  feed_urls: z.array(z.string().min(4).max(2048)).max(10).optional(),
  force: z.boolean().optional(),
  locale: z.string().min(2).max(8).optional(),
  category: z.enum(blogCategories).optional(),
});
