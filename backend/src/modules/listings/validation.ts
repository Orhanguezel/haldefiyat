import { z } from "zod";
import { isValidCitySlug, isValidDistrictSlug } from "@/data/turkey-city-slugs";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const positiveMoney = z.coerce.number().positive().optional().nullable();
const positiveAmount = z.coerce.number().positive().optional().nullable();

function validateLocation(data: { citySlug?: string | null; districtSlug?: string | null }, ctx: z.RefinementCtx) {
  if (data.citySlug && !isValidCitySlug(data.citySlug)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["citySlug"], message: "invalid_city" });
  }
  if (data.districtSlug && !isValidDistrictSlug(data.citySlug, data.districtSlug)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["districtSlug"], message: "invalid_district" });
  }
}

function validateDates(data: { validUntil?: string }, ctx: z.RefinementCtx) {
  const today = new Date().toISOString().slice(0, 10);
  if (data.validUntil && data.validUntil < today) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["validUntil"], message: "past_date" });
  }
}

function validatePrice(data: { priceType?: string; priceMin?: number | null; priceMax?: number | null }, ctx: z.RefinementCtx) {
  if (data.priceType === "sabit" && data.priceMin == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["priceMin"], message: "required_for_fixed_price" });
  }
  if (data.priceMin != null && data.priceMax != null && data.priceMax < data.priceMin) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["priceMax"], message: "max_lt_min" });
  }
}

const listingFields = z.object({
  listingType: z.enum(["satis", "alim"]).default("satis"),
  partyRole: z.enum(["uretici", "komisyoncu", "alici", "diger"]).default("uretici"),
  productSlug: z.string().trim().max(128).optional().nullable(),
  productName: z.string().trim().min(1).max(255),
  title: z.string().trim().min(4).max(255),
  description: z.string().trim().max(5000).optional().nullable(),
  quality: z.string().trim().max(96).optional().nullable(),
  packaging: z.string().trim().max(96).optional().nullable(),
  quantity: positiveAmount,
  quantityUnit: z.string().trim().min(1).max(32).default("kg"),
  priceType: z.enum(["sabit", "pazarlik", "hal_endeksli"]).default("sabit"),
  priceMin: positiveMoney,
  priceMax: positiveMoney,
  priceUnit: z.string().trim().min(1).max(32).default("kg"),
  halIndexPct: z.coerce.number().min(-100).max(300).optional().nullable(),
  currency: z.string().trim().min(3).max(8).default("TRY"),
  citySlug: z.string().trim().max(96).optional().nullable(),
  districtSlug: z.string().trim().max(128).optional().nullable(),
  firmId: z.coerce.number().int().positive().optional().nullable(),
  contactName: z.string().trim().max(255).optional().nullable(),
  contactPhone: z.string().trim().max(128).optional().nullable(),
  hidePhone: z.coerce.boolean().default(false),
  images: z.array(z.string().trim().min(1).max(512)).max(6).optional(),
  validUntil: dateOnly,
});

export const adminCreateSchema = listingFields.extend({
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
}).superRefine((data, ctx) => {
  validateLocation(data, ctx);
  validateDates(data, ctx);
  validatePrice(data, ctx);
});

export const listingCreateSchema = listingFields.superRefine((data, ctx) => {
  validateLocation(data, ctx);
  validateDates(data, ctx);
  validatePrice(data, ctx);
  // Web formundan ilan vermek icin telefon zorunlu (Telegram kanali bu semadan gecmez).
  if (!data.contactPhone || data.contactPhone.trim().length < 7) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["contactPhone"], message: "phone_required" });
  }
});

export const listingPatchSchema = listingFields.partial().superRefine((data, ctx) => {
  validateLocation(data, ctx);
  validateDates(data, ctx);
  validatePrice(data, ctx);
});

export const listingQuerySchema = z.object({
  type: z.enum(["satis", "alim"]).optional(),
  product: z.string().trim().max(128).optional(),
  city: z.string().trim().max(96).optional(),
  district: z.string().trim().max(128).optional(),
  status: z.enum(["pending", "approved", "rejected", "expired", "closed", "all"]).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(5).max(128),
  message: z.string().trim().min(5).max(2000),
  offerPrice: positiveMoney,
});

export const moderateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  moderationNote: z.string().trim().max(2000).optional().nullable(),
});

export const featureSchema = z.object({
  package: z.enum(["daily", "weekly", "monthly"]),
});

export type ListingCreateInput = z.infer<typeof listingCreateSchema>;
export type ListingPatchInput = z.infer<typeof listingPatchSchema>;
