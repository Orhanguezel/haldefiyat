// src/modules/dealerFinance/validation.ts
import { z } from 'zod';
import { TRANSACTION_TYPES } from './schema';

/** Dealer profile create — dealer self-registration fields */
export const dealerProfileCreateSchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  tax_number: z.string().max(50).optional(),
  tax_office: z.string().max(255).optional(),
});
export type DealerProfileCreateInput = z.infer<typeof dealerProfileCreateSchema>;

/** Dealer profile update — admin-only fields included */
export const dealerProfileUpdateSchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  tax_number: z.string().max(50).optional(),
  tax_office: z.string().max(255).optional(),
  credit_limit: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  risk_limit: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  discount_rate: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  ecosystem_id: z.string().max(128).nullable().optional(),
  is_approved: z.union([z.literal(0), z.literal(1)]).optional(),
});
export type DealerProfileUpdateInput = z.infer<typeof dealerProfileUpdateSchema>;

/** Dealer self-update — only company info, no financial fields */
export const dealerSelfUpdateSchema = z.object({
  company_name: z.string().min(1).max(255).optional(),
  tax_number: z.string().max(50).optional(),
  tax_office: z.string().max(255).optional(),
});
export type DealerSelfUpdateInput = z.infer<typeof dealerSelfUpdateSchema>;

/** Kamu bayi basvurusu — POST /dealer/register */
export const dealerPublicRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(8).max(50),
  company_name: z.string().trim().min(2).max(255),
  tax_number: z.string().trim().min(5).max(50),
  tax_office: z.string().trim().min(2).max(255),
  city: z.string().trim().max(128).optional(),
  region: z.string().trim().max(128).optional(),
  rules_accepted: z.literal(true),
});
export type DealerPublicRegisterInput = z.infer<typeof dealerPublicRegisterSchema>;

/** Transaction create — admin manual entry (dealer URL path'ten) */
export const adminTransactionCreateSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/),
  description: z.string().max(500).optional(),
  order_id: z.string().uuid().optional(),
  due_date: z.string().min(1).optional(),
});
export type AdminTransactionCreateInput = z.infer<typeof adminTransactionCreateSchema>;

/** Transaction list query */
export const transactionListQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(TRANSACTION_TYPES).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  due_from: z.string().optional(),
  due_to: z.string().optional(),
});
export type TransactionListQueryInput = z.infer<typeof transactionListQuerySchema>;

const emptyToUndef = (v: unknown) =>
  v === '' || v === undefined || v === null ? undefined : v;

/** GET /dealers/public — liste + filtre (query string / tekrarlayan anahtar güvenli) */
export const publicDealersQuerySchema = z.object({
  q: z.preprocess(emptyToUndef, z.string().max(128).optional()),
  city: z.preprocess(emptyToUndef, z.string().max(128).optional()),
  region: z.preprocess(emptyToUndef, z.string().max(128).optional()),
  page: z.preprocess(emptyToUndef, z.coerce.number().int().positive().optional()),
  limit: z.preprocess(emptyToUndef, z.coerce.number().int().positive().max(50).optional()),
});
export type PublicDealersQueryInput = z.infer<typeof publicDealersQuerySchema>;

/** GET /dealer/products — katalog */
export const dealerCatalogQuerySchema = z.object({
  locale: z.string().min(2).max(8).default('tr'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().max(200).optional(),
});
export type DealerCatalogQueryInput = z.infer<typeof dealerCatalogQuerySchema>;

export const dealerDirectPaymentBodySchema = z.object({
  amount: z.coerce.number().positive().max(1_000_000),
  note: z.string().trim().max(500).optional().default(''),
  locale: z.string().min(2).max(8).optional(),
  cc_holder_name: z.string().trim().min(2).max(100).optional(),
  cc_no: z.string().trim().regex(/^\d{13,19}$/).optional(),
  exp_month: z.string().trim().regex(/^(0[1-9]|1[0-2])$/).optional(),
  exp_year: z.string().trim().regex(/^\d{2,4}$/).optional(),
  cvv: z.string().trim().regex(/^\d{3,4}$/).optional(),
});
export type DealerDirectPaymentBodyInput = z.infer<typeof dealerDirectPaymentBodySchema>;
