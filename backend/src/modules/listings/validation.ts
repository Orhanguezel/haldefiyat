import { z } from "zod";
import { isValidCitySlug, isValidDistrictSlug } from "@/data/turkey-city-slugs";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/**
 * Bos string'i "deger yok" sayar.
 *
 * Web formu FormData'yi `Object.fromEntries` ile gonderiyor: doldurulmayan her
 * alan `undefined` degil BOS STRING olarak geliyor. `z.coerce.number()` bos
 * string'i 0'a cevirdigi icin `.positive()` patliyor ve ISTEGE BAGLI bir alani
 * bos birakan HERKES 400 aliyordu.
 *
 * 27 Agustos 2026: tek kullanici 16 kez ilan vermeyi denedi, 16'sinda da bu
 * yuzden reddedildi (fotograflarini bile yuklemisti). Modulun "talep yok"
 * sanilan olu hali buydu.
 */
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null || value === undefined ? undefined : value;

const optionalNumber = (schema: z.ZodTypeAny) => z.preprocess(emptyToUndefined, schema.optional());

const positiveMoney = optionalNumber(z.coerce.number().positive());
const positiveAmount = optionalNumber(z.coerce.number().positive());
const callSlot = z.enum(["asap", "morning", "afternoon", "evening"]);

function validateLocation(data: { citySlug?: string | null; districtSlug?: string | null }, ctx: z.RefinementCtx) {
  if (data.citySlug && !isValidCitySlug(data.citySlug)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["citySlug"], message: "invalid_city" });
  }
  if (data.districtSlug && !isValidDistrictSlug(data.citySlug, data.districtSlug)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["districtSlug"], message: "invalid_district" });
  }
}

function validateDates(data: { validUntil?: string }, ctx: z.RefinementCtx) {
  // Public listeleme validUntil >= CURRENT_DATE() filtreler. Bugunu secen ilan ertesi gun
  // kaybolur — bu yuzden en az yarin sart (aksi halde 0 gun yayinda kalan ilan olusur).
  const today = new Date().toISOString().slice(0, 10);
  if (data.validUntil && data.validUntil <= today) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["validUntil"], message: "must_be_future" });
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
  halIndexPct: optionalNumber(z.coerce.number().min(-100).max(300)),
  currency: z.string().trim().min(3).max(8).default("TRY"),
  citySlug: z.string().trim().max(96).optional().nullable(),
  districtSlug: z.string().trim().max(128).optional().nullable(),
  firmId: optionalNumber(z.coerce.number().int().positive()),
  contactName: z.string().trim().max(255).optional().nullable(),
  contactPhone: z.string().trim().max(128).optional().nullable(),
  hidePhone: z.coerce.boolean().default(false),
  callRequestsEnabled: z.boolean().default(true),
  callAvailability: z.array(callSlot).min(1).max(4).default(["asap", "morning", "afternoon", "evening"]),
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
  q: z.string().trim().max(100).optional(),
  type: z.enum(["satis", "alim"]).optional(),
  product: z.string().trim().max(128).optional(),
  city: z.string().trim().max(96).optional(),
  district: z.string().trim().max(128).optional(),
  unit: z.enum(["kg", "adet", "kasa", "bag", "demet", "koli", "paket", "ton", "litre"]).optional(),
  date: z.enum(["today", "7d", "30d"]).optional(),
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

export const callRequestSchema = z.object({
  preferredSlot: z.enum(["asap", "morning", "afternoon", "evening"]).default("asap"),
  note: z.string().trim().max(500).optional().nullable(),
  privacyAccepted: z.literal(true),
  otpToken: z.string().trim().min(16).max(2048).optional(),
  // Normal kullaniciya gorunmeyen adaptif bot sinyalleri. CAPTCHA benzeri
  // challenge yalniz bu sinyaller supheli oldugunda istenir.
  formElapsedMs: z.coerce.number().int().min(0).max(86_400_000).optional(),
  website: z.string().trim().max(200).optional(),
  riskChallengeToken: z.string().trim().min(16).max(2048).optional(),
  riskChallengeAnswer: z.string().trim().regex(/^\d{1,3}$/).optional(),
});

export const callRequestStatusSchema = z.object({
  status: z.enum(["accepted", "declined", "cancelled", "completed"]),
});

export const listingCallSettingsSchema = z.object({
  callRequestsEnabled: z.boolean(),
  callAvailability: z.array(callSlot).min(1).max(4),
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
