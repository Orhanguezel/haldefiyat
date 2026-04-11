// src/modules/mail/service.ts
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  SITE_NAME,
  buildMailFromAddress,
  buildMailTransportSignature,
  createMailTransportConfig,
  escapeMailHtml,
  sendMailWithTransport,
  wrapMailBody,
  passwordChangedSchema,
  welcomeMailSchema,
} from "./helpers";
import type {
  PasswordChangedMailInput,
  WelcomeMailInput,
} from "./helpers";
import {
  sendMailSchema,
  type SendMailInput,
} from "./validation";
import {
  getSmtpSettings,
} from "../../siteSettings";

let cachedTransporter: Transporter | null = null;
let cachedSignature: string | null = null;

async function getTransporter(): Promise<Transporter> {
  const cfg = await getSmtpSettings();
  if (!cfg.host) throw new Error("smtp_host_not_configured");
  if (!cfg.port) cfg.port = cfg.secure ? 465 : 587;
  const resolvedCfg = { ...cfg, host: cfg.host, port: cfg.port };

  const signature = buildMailTransportSignature(cfg);
  if (cachedTransporter && cachedSignature === signature) return cachedTransporter;
  const transporter = nodemailer.createTransport(createMailTransportConfig(resolvedCfg));
  cachedTransporter = transporter;
  cachedSignature = signature;
  return transporter;
}

export async function sendMailRaw(input: SendMailInput) {
  const data = sendMailSchema.parse(input);
  const smtpCfg = await getSmtpSettings();
  const from = buildMailFromAddress(smtpCfg);
  const transporter = await getTransporter();
  return sendMailWithTransport(transporter, from, data);
}

export async function sendMail(input: SendMailInput) {
  return sendMailRaw(input);
}

export async function sendWelcomeMail(input: WelcomeMailInput) {
  const d = welcomeMailSchema.parse(input);
  const subject = `${SITE_NAME} - Hos Geldiniz!`;
  const html = wrapMailBody(`
    <h2 style="font-size:18px;">Merhaba ${escapeMailHtml(d.user_name)},</h2>
    <p>${SITE_NAME} ailesine hos geldiniz! Hesabiniz basariyla olusturuldu.</p>
    <p>E-posta: <strong>${escapeMailHtml(d.user_email)}</strong></p>
    <p>${SITE_NAME} Ekibi</p>
  `);
  const text = `Merhaba ${d.user_name},\n\n${SITE_NAME}'e hos geldiniz! Hesabiniz olusturuldu.\nE-posta: ${d.user_email}\n\n${SITE_NAME} Ekibi`;
  return sendMailRaw({ to: d.to, subject, html, text });
}

export async function sendPasswordChangedMail(input: PasswordChangedMailInput) {
  const d = passwordChangedSchema.parse(input);
  const name = d.user_name ?? "Kullanicimiz";
  const subject = `Sifreniz Guncellendi — ${SITE_NAME}`;
  const html = wrapMailBody(`
    <h2 style="font-size:18px;">Sifreniz Guncellendi</h2>
    <p>Merhaba <strong>${escapeMailHtml(name)}</strong>,</p>
    <p>Hesap sifreniz basariyla degistirildi.</p>
    <p>Eger bu islemi siz yapmadiysiniz lutfen en kisa surede bizimle iletisime gecin.</p>
    <p>${SITE_NAME} Ekibi</p>
  `);
  const text = `Merhaba ${name},\n\nSifreniz degistirildi. Bu siz degilseniz bizimle iletisime gecin.\n\n${SITE_NAME} Ekibi`;
  return sendMailRaw({ to: d.to, subject, html, text });
}
