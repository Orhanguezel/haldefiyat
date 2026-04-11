// src/modules/mail/validation.ts
import { z } from "zod";

export const sendMailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(255),
  text: z.string().optional(),
  html: z.string().optional(),
});

export type SendMailInput = z.infer<typeof sendMailSchema>;
