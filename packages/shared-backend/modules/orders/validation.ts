// src/modules/orders/validation.ts
import { z } from 'zod';
import { ORDER_STATUSES } from './schema';

/* ---- Create order ---- */
const orderItemInputSchema = z.object({
  product_id: z.string().min(1, 'product_id required'),
  quantity: z.number().int().min(1, 'quantity must be >= 1'),
});

export const orderCreateSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'at least one item required'),
  seller_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type OrderCreateInput = z.infer<typeof orderCreateSchema>;

/* ---- Update status ---- */
export const orderUpdateStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export type OrderUpdateStatusInput = z.infer<typeof orderUpdateStatusSchema>;

/* ---- List query ---- */
export const orderListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  seller_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export const adminAssignOrderSellerSchema = z.object({
  seller_id: z.union([z.string().uuid(), z.null()]),
});

export const orderPaymentAttemptListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  order_id: z.string().uuid().optional(),
  provider: z.string().min(1).max(32).optional(),
  status: z.enum(['pending', 'succeeded', 'failed', 'expired']).optional(),
  payment_ref: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
});

export const adminOrderRefundSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
