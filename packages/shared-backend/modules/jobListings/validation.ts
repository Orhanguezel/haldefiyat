// src/modules/jobListings/validation.ts
import { z } from 'zod';

export const jobListingCreateSchema = z.object({
  locale: z.string().min(2).max(8).default('tr'),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  description: z.string().optional(),
  requirements: z.string().optional(),
  department: z.string().max(128).optional(),
  location: z.string().max(255).optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern']).default('full_time'),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
});

export const jobListingUpdateSchema = z.object({
  locale: z.string().min(2).max(8).optional(),
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  department: z.string().max(128).optional(),
  location: z.string().max(255).optional(),
  employment_type: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().optional(),
  meta_title: z.string().max(255).optional(),
  meta_description: z.string().max(500).optional(),
});

export type JobListingCreateInput = z.infer<typeof jobListingCreateSchema>;
export type JobListingUpdateInput = z.infer<typeof jobListingUpdateSchema>;
