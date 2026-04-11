// =============================================================
// FILE: src/modules/offer/validation.ts
// Bereket Fide – Offer Module Validation (Zod schemas)
// =============================================================

import { z } from 'zod';

/** Yerel tanim: shared `boolLike` farkli `zod` kopyasiyla gelince `.extend()` tipi kiriliyor. */
const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

// Teklif durumları – hem DB hem API için ortak enum
export const OFFER_STATUSES = [
  'new', // yeni geldi, incelenmedi
  'in_review', // teknik ekip inceliyor
  'quoted', // fiyat tekliflendirildi (taslak)
  'sent', // teklif müşteriye gönderildi
  'accepted', // müşteri teklifi kabul etti
  'rejected', // müşteri reddetti
  'cancelled', // iptal (iç süreç)
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const OFFER_STATUS_ENUM = z.enum(OFFER_STATUSES);

// ✅ country_code artık "ülke serbest metin" gibi:
// - "Almanya", "Deutschland", "Germany", "DE", "Türkiye", "United States" vs.
// - Sadece trim + uzunluk kontrolü yapıyoruz.
// - Büyük/küçük harf değiştirmiyoruz; kullanıcı girişi olduğu gibi kalsın.
const countryFreeTextSchema = z.string().trim().min(2).max(80);

/* -------------------------------------------------------------
 * PUBLIC – Offer Request Body
 * ------------------------------------------------------------- */

export const offerRequestBodySchema = z.object({
  source: z.string().min(1).max(64).default('bereketfide'),
  locale: z.string().max(10).optional(),

  // ✅ Serbest metin (kısıt yok, sadece uzunluk)
  country_code: countryFreeTextSchema.optional(),

  customer_name: z.string().min(1).max(255).trim(),
  company_name: z.string().max(255).trim().optional().nullable(),

  email: z.string().email().max(255),
  phone: z.string().max(50).trim().optional().nullable(),

  subject: z.string().max(255).trim().optional().nullable(),
  message: z.string().optional().nullable(),

  product_id: z.string().uuid().optional().nullable(),
  service_id: z.string().uuid().optional().nullable(),

  form_data: z.record(z.any()).optional().default({}),

  consent_marketing: boolLike.optional(),
  consent_terms: boolLike.optional(),
});

export type OfferRequestBody = z.infer<typeof offerRequestBodySchema>;

/* -------------------------------------------------------------
 * ADMIN – List query
 * ------------------------------------------------------------- */

export const offerListQuerySchema = z.object({
  order: z.string().optional(),
  sort: z.enum(['created_at', 'updated_at']).optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  status: OFFER_STATUS_ENUM.optional(),
  source: z.string().max(64).optional(),
  locale: z.string().max(10).optional(),

  // ✅ Admin filtrede de serbest metin
  country_code: z.string().trim().min(2).max(80).optional(),

  q: z.string().optional(),
  email: z.string().optional(),
  product_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),

  created_from: z.string().optional(),
  created_to: z.string().optional(),
});

export type OfferListQuery = z.infer<typeof offerListQuerySchema>;

/* -------------------------------------------------------------
 * ADMIN – Create / Update body
 * ------------------------------------------------------------- */

export const upsertOfferAdminBodySchema = offerRequestBodySchema.extend({
  status: OFFER_STATUS_ENUM.optional().default('new'),

  currency: z.string().max(10).default('EUR'),
  net_total: z.coerce.number().min(0).optional(),
  vat_rate: z.coerce.number().min(0).max(100).optional(), // YENİ
  vat_total: z.coerce.number().min(0).optional(),
  shipping_total: z.coerce.number().min(0).optional(), // YENİ
  gross_total: z.coerce.number().min(0).optional(),

  // Teklif numarası (örn: ENS-2025-0001)
  offer_no: z.string().max(100).optional().nullable(),

  // Teklif geçerlilik tarihi (ISO string)
  valid_until: z.string().optional().nullable(),

  // Admin notları
  admin_notes: z.string().optional().nullable(),

  // PDF alanları – relative path da olabilir, o yüzden .url() yok
  pdf_url: z.string().max(500).optional().nullable(),
  pdf_asset_id: z.string().length(36).optional().nullable(),

  // E-posta gönderim zamanı – ISO string
  email_sent_at: z.string().optional().nullable(),
});

export type UpsertOfferAdminBody = z.infer<typeof upsertOfferAdminBodySchema>;

export const patchOfferAdminBodySchema = upsertOfferAdminBodySchema.partial();

export type PatchOfferAdminBody = z.infer<typeof patchOfferAdminBodySchema>;

/* -------------------------------------------------------------
 * PARAMS
 * ------------------------------------------------------------- */

export const offerIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type OfferIdParams = z.infer<typeof offerIdParamsSchema>;
