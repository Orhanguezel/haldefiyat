import { z } from "zod";

import { boolLike } from "@agro/shared-backend/modules/_shared";

export const OFFER_STATUSES = [
  "new",
  "in_review",
  "quoted",
  "sent",
  "accepted",
  "rejected",
  "cancelled",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const offerStatusEnum = z.enum(OFFER_STATUSES);

export const offerIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const offerListQuerySchema = z.object({
  q: z.string().optional(),
  status: offerStatusEnum.optional(),
  source: z.string().max(64).optional(),
  locale: z.string().max(10).optional(),
  country_code: z.string().trim().min(2).max(80).optional(),
  email: z.string().optional(),
  product_id: z.string().uuid().optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  sort: z.enum(["created_at", "updated_at"]).optional(),
  orderDir: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const baseOfferBodySchema = z.object({
  source: z.string().min(1).max(64).default("vistaseed"),
  locale: z.string().max(10).optional().nullable(),
  country_code: z.string().trim().min(2).max(80).optional().nullable(),
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

export const upsertOfferAdminBodySchema = baseOfferBodySchema.extend({
  status: offerStatusEnum.optional().default("new"),
  currency: z.string().max(10).default("EUR"),
  net_total: z.coerce.number().min(0).optional().nullable(),
  vat_rate: z.coerce.number().min(0).max(100).optional().nullable(),
  vat_total: z.coerce.number().min(0).optional().nullable(),
  shipping_total: z.coerce.number().min(0).optional().nullable(),
  gross_total: z.coerce.number().min(0).optional().nullable(),
  offer_no: z.string().max(100).optional().nullable(),
  valid_until: z.string().optional().nullable(),
  admin_notes: z.string().optional().nullable(),
  pdf_url: z.string().max(500).optional().nullable(),
  pdf_asset_id: z.string().length(36).optional().nullable(),
  email_sent_at: z.string().optional().nullable(),
});

export const patchOfferAdminBodySchema = upsertOfferAdminBodySchema.partial();

export const PUBLIC_OFFER_ORG_TYPES = [
  "cooperative",
  "producer_union",
  "retailer_chain",
  "exporter",
  "other",
] as const;

const consentTermsAccepted = z.union([
  z.literal(true),
  z.literal(1),
  z.literal("1"),
  z.literal("true"),
]);

export const publicOfferSourceEnum = z.enum(["toplu-satis", "teklif-al"]);

export const publicOfferCreateSchema = z.object({
  website: z.string().max(255).optional().nullable(),
  source: publicOfferSourceEnum.optional().default("toplu-satis"),
  customer_name: z.string().min(1).max(255).trim(),
  company_name: z.string().max(255).trim().optional().nullable(),
  email: z.string().email().max(255),
  phone: z.string().max(50).trim().optional().nullable(),
  locale: z.string().max(10).optional().nullable(),
  country_code: z.string().trim().min(2).max(80).optional().nullable(),
  message: z.string().min(10).max(8000).trim(),
  consent_terms: consentTermsAccepted,
  consent_marketing: boolLike.optional(),
  org_type: z.enum(PUBLIC_OFFER_ORG_TYPES).optional(),
  city: z.string().max(128).trim().optional().nullable(),
  region: z.string().max(128).trim().optional().nullable(),
  estimated_volume: z.string().max(128).trim().optional().nullable(),
});

export type OfferListQuery = z.infer<typeof offerListQuerySchema>;
export type UpsertOfferAdminBody = z.infer<typeof upsertOfferAdminBodySchema>;
export type PatchOfferAdminBody = z.infer<typeof patchOfferAdminBodySchema>;
