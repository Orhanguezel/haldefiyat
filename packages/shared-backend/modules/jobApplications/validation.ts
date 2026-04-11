// src/modules/jobApplications/validation.ts
import { z } from 'zod';

export const jobApplicationCreateSchema = z.object({
  job_listing_id: z.string().uuid(),
  full_name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(64).optional(),
  cover_letter: z.string().optional(),
  cv_url: z.string().max(512).optional(),
  cv_asset_id: z.string().uuid().optional(),
});

export const jobApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'shortlisted', 'rejected', 'hired']),
  admin_note: z.string().max(2000).optional(),
});

export type JobApplicationCreateInput = z.infer<typeof jobApplicationCreateSchema>;
export type JobApplicationStatusInput = z.infer<typeof jobApplicationStatusSchema>;
