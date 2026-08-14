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
