import { z } from "zod";

const optionalText = (schema: z.ZodString) => z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  schema.optional(),
);

export const publicLeadBodySchema = z.object({
  name: z.string().trim().min(2).max(128),
  phone: optionalText(z.string().trim().min(5).max(64)),
  email: optionalText(z.string().trim().email()),
  preferredChannel: z.enum(["phone", "email"]),
  message: z.string().trim().min(5).max(1000),
  privacyConsent: z.literal(true),
}).superRefine((data, ctx) => {
  if (!data.phone && !data.email) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "contact_required" });
  }
  if (data.preferredChannel === "phone" && !data.phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["preferredChannel"], message: "phone_required" });
  }
  if (data.preferredChannel === "email" && !data.email) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["preferredChannel"], message: "email_required" });
  }
});

export const claimBodySchema = z.object({
  evidence: z.string().trim().max(2000).nullable().optional(),
  authorityConfirmed: z.literal(true),
  privacyConsent: z.literal(true),
});

/**
 * Kaldirma talebi — oturum GEREKTIRMEZ. KVKK basvurusunun onune giris
 * zorunlulugu konulamaz; kimlik/yetki dogrulamasi moderasyonda yapilir.
 */
export const removalRequestBodySchema = z.object({
  requesterName: z.string().trim().min(2).max(160),
  relationship: z.enum(["sahibi", "yetkili", "calisan", "diger"]),
  contact: z.string().trim().min(5).max(190),
  reason: z.string().trim().max(2000).optional(),
  // Talebi karsilayabilmek icin geri donus sarttir; ayri ve onceden isaretsiz.
  contactConsent: z.literal(true),
});

