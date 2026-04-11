import { z } from 'zod';
import { LOCALE_LIKE, UUID36, boolLike } from '@agro/shared-backend/modules/_shared';

const supportCategories = ['genel', 'urunler', 'hesap', 'teknik'] as const;
const ticketStatuses = ['open', 'in_progress', 'resolved', 'closed'] as const;
const ticketPriorities = ['low', 'normal', 'high', 'urgent'] as const;

export const faqListQuerySchema = z.object({
  locale: LOCALE_LIKE.optional().default('tr'),
  category: z.enum(supportCategories).optional(),
  is_published: boolLike.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const faqCreateSchema = z.object({
  locale: LOCALE_LIKE.default('tr'),
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(20000),
  category: z.enum(supportCategories).default('genel'),
  is_published: boolLike.optional(),
  display_order: z.coerce.number().int().min(0).optional(),
});

export const faqUpdateSchema = faqCreateSchema.partial().extend({
  locale: LOCALE_LIKE,
});

export const faqReorderSchema = z.object({
  items: z.array(z.object({
    id: UUID36,
    display_order: z.coerce.number().int().min(0),
  })).min(1),
});

export const ticketCreateSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().max(255),
  subject: z.string().min(2).max(255),
  message: z.string().min(10).max(10000),
  category: z.enum(supportCategories).default('genel'),
  website: z.string().max(255).optional().nullable(),
});

export const ticketListQuerySchema = z.object({
  status: z.enum(ticketStatuses).optional(),
  category: z.enum(supportCategories).optional(),
  priority: z.enum(ticketPriorities).optional(),
  search: z.string().max(255).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const ticketUpdateSchema = z.object({
  status: z.enum(ticketStatuses).optional(),
  priority: z.enum(ticketPriorities).optional(),
  admin_note: z.string().max(10000).optional().nullable(),
});

export const ticketMessageCreateSchema = z.object({
  body: z.string().min(1).max(10000),
});

export const ticketIdParamSchema = z.object({
  id: UUID36,
});

export type FaqListQueryInput = z.infer<typeof faqListQuerySchema>;
export type FaqCreateInput = z.infer<typeof faqCreateSchema>;
export type FaqUpdateInput = z.infer<typeof faqUpdateSchema>;
export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
export type TicketListQueryInput = z.infer<typeof ticketListQuerySchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
export type TicketMessageCreateInput = z.infer<typeof ticketMessageCreateSchema>;
