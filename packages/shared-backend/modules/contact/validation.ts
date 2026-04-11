// =============================================================
// FILE: src/modules/contact/validation.ts
// =============================================================
import { z } from "zod";

export const ContactCreateSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  phone: z.string().min(5).max(64),
  subject: z.string().min(2).max(255),
  message: z.string().min(10).max(5000),
  // Opsiyonel antispam alanları (honeypot)
  website: z.string().max(255).optional().nullable(),
});

export const ContactUpdateSchema = z.object({
  status: z.enum(["new", "in_progress", "closed"]).optional(),
  is_resolved: z.boolean().optional(),
  admin_note: z.string().max(2000).optional().nullable(),
});

export const ContactListParamsSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["new", "in_progress", "closed"]).optional(),
  // 🔧 Query string'den geldiği için coerce et
  resolved: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  orderBy: z.enum(["created_at", "updated_at", "status", "name"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>;
export type ContactListParams = z.infer<typeof ContactListParamsSchema>;
