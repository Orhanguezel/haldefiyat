// =============================================================
// FILE: src/modules/review/validation.ts
// =============================================================
import { z } from 'zod';

/* Query boolean coercion: "0"/"1"/"true"/"false"/boolean */
const boolQuery = z.preprocess((v) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '1' || s === 'true') return true;
    if (s === '0' || s === 'false') return false;
  }
  return undefined;
}, z.boolean().optional());

/* ── LIST QUERY ── */
export const reviewListQuerySchema = z.object({
  target_type: z.string().trim().optional(),
  target_id: z.string().trim().optional(),
  locale: z.string().min(2).max(8).optional(),
  approved: boolQuery,
  active: boolQuery,
  min_rating: z.coerce.number().int().min(1).max(5).optional(),
  max_rating: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'rating', 'display_order', 'name']).default('display_order'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

/* ── CREATE ── */
export const reviewCreateSchema = z.object({
  target_type: z.string().trim().min(1).max(50),
  target_id: z.string().trim().min(1).max(36),
  locale: z.string().min(2).max(8).optional(),
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(5),
  captcha_token: z.string().trim().optional(),
});

/* ── UPDATE (partial) ── */
export const reviewUpdateSchema = reviewCreateSchema.partial();

/* ── TYPES ── */
export type ReviewListQuery = z.infer<typeof reviewListQuerySchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
