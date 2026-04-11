// src/modules/mail/helpers/service.ts
import type { Transporter } from "nodemailer";
import type { SendMailInput } from "../validation";
import type { SmtpSettings } from "../../../siteSettings";
import { z } from "zod";
import { env } from "../../../../core/env";

const SITE_NAME = env.SITE_NAME || "Corporate Site";

export function buildMailTransportSignature(cfg: SmtpSettings): string {
  return [cfg.host ?? "", cfg.port ?? "", cfg.username ?? "", cfg.secure ? "1" : "0"].join("|");
}

export function buildMailFromAddress(smtpCfg: SmtpSettings): string {
  const fromEmail = smtpCfg.fromEmail || smtpCfg.username || "no-reply@example.com";
  return smtpCfg.fromName ? `${smtpCfg.fromName} <${fromEmail}>` : fromEmail;
}

export function createMailTransportConfig(cfg: SmtpSettings & { host: string; port: number }) {
  return {
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.username && cfg.password ? { user: cfg.username, pass: cfg.password } : undefined,
  };
}

export function escapeMailHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function wrapMailBody(body: string): string {
  return `<div style="font-family:'DM Sans',system-ui,sans-serif;font-size:14px;color:#0F172A;line-height:1.6;max-width:560px;margin:0 auto;">${body}<p style="margin-top:24px;color:#64748B;font-size:12px;">Bu e-posta ${SITE_NAME} tarafindan gonderilmistir.</p></div>`;
}

export function sendMailWithTransport(transporter: Transporter, from: string, data: SendMailInput) {
  return transporter.sendMail({ from, to: data.to, subject: data.subject, text: data.text, html: data.html });
}

export const welcomeMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  user_email: z.string().email(),
});

export type WelcomeMailInput = z.infer<typeof welcomeMailSchema>;

export const passwordChangedSchema = z.object({
  to: z.string().email(),
  user_name: z.string().optional(),
});

export type PasswordChangedMailInput = z.infer<typeof passwordChangedSchema>;

export { SITE_NAME };
