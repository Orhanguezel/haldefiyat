import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

import { db } from '../db/client';
import { siteSettings } from '../modules/siteSettings/schema';
import { getSmtpSettings } from '../modules/siteSettings/service';
import { eq } from 'drizzle-orm';

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type ContactMailContext = {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  locale?: string | null;
};

type OfferMailContext = {
  customer_name: string;
  company_name?: string | null;
  offer_no?: string | null;
  email: string;
  phone?: string | null;
  currency?: string | null;
  net_total?: string | number | null;
  vat_rate?: string | number | null;
  vat_total?: string | number | null;
  shipping_total?: string | number | null;
  gross_total?: string | number | null;
  valid_until?: string | null;
  pdf_url?: string | null;
  locale?: string | null;
  offer_id?: string | null;
  country_code?: string | null;
  message?: string | null;
};

type WelcomeMailContext = {
  to: string;
  user_name?: string | null;
  user_email?: string | null;
  site_name?: string | null;
};

type PasswordChangedMailContext = {
  to: string;
  user_name?: string | null;
  site_name?: string | null;
};

let cachedTransporter: Transporter | null = null;
let cachedSignature: string | null = null;
let cachedSiteName: string | null = null;
let cachedSiteNameAt: number | null = null;

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toLine(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

async function getSiteName(): Promise<string> {
  const now = Date.now();
  if (cachedSiteName && cachedSiteNameAt && now - cachedSiteNameAt < 5 * 60_000) {
    return cachedSiteName;
  }

  const [titleRow] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, 'site_title'))
    .limit(1);

  const fallback = toLine(titleRow?.value) ?? 'Bereket Fide';
  cachedSiteName = fallback;
  cachedSiteNameAt = now;
  return fallback;
}

async function getTransporter(): Promise<{ transporter: Transporter; from: string }> {
  const cfg = await getSmtpSettings();
  const host = cfg.host?.trim();
  if (!host) {
    throw new Error('smtp_host_not_configured');
  }

  const port = typeof cfg.port === 'number' && cfg.port > 0 ? cfg.port : 587;
  const secure = typeof cfg.secure === 'boolean' ? cfg.secure : port === 465;
  const signature = [host, port, cfg.username ?? '', secure ? '1' : '0'].join('|');

  if (!cachedTransporter || cachedSignature !== signature) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        cfg.username && cfg.password
          ? {
              user: cfg.username,
              pass: cfg.password,
            }
          : undefined,
    });
    cachedSignature = signature;
  }

  const fromEmail = cfg.fromEmail || cfg.username || 'no-reply@bereketfide.local';
  const from = cfg.fromName ? `${cfg.fromName} <${fromEmail}>` : fromEmail;

  return { transporter: cachedTransporter, from };
}

export async function sendBereketMail(input: SendMailInput) {
  const { transporter, from } = await getTransporter();
  return transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export async function sendBereketWelcomeMail(input: WelcomeMailContext) {
  const siteName = input.site_name?.trim() || (await getSiteName());
  const userName = input.user_name?.trim() || input.to.split('@')[0] || 'Kullanici';
  const userEmail = input.user_email?.trim() || input.to;
  const subject = `${siteName} hesabiniz hazir`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>${escapeHtml(siteName)}'e hos geldiniz</h2>
      <p>Merhaba ${escapeHtml(userName)},</p>
      <p>${escapeHtml(userEmail)} adresi ile hesabiniz olusturuldu.</p>
      <p>Artik ${escapeHtml(siteName)} icindeki yonetim akislarini kullanabilirsiniz.</p>
    </div>
  `;

  await sendBereketMail({ to: input.to, subject, html });
}

export async function sendBereketPasswordChangedMail(input: PasswordChangedMailContext) {
  const siteName = input.site_name?.trim() || (await getSiteName());
  const userName = input.user_name?.trim() || input.to.split('@')[0] || 'Kullanici';
  const subject = `${siteName} sifre bilgilendirmesi`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Sifreniz guncellendi</h2>
      <p>Merhaba ${escapeHtml(userName)},</p>
      <p>${escapeHtml(siteName)} hesabinizin sifresi guncellendi.</p>
      <p>Bu islemi siz yapmadiysaniz yoneticinizle veya destek ekibiyle hemen iletisime gecin.</p>
    </div>
  `;

  await sendBereketMail({ to: input.to, subject, html });
}

export async function sendBereketContactAdminMail(input: ContactMailContext) {
  const smtpCfg = await getSmtpSettings(input.locale ?? null);
  const adminTo = smtpCfg.fromEmail || smtpCfg.username || input.email;
  const siteName = await getSiteName();
  const subject = `[${siteName}] Yeni iletisim talebi`;

  const rows = [
    ['Ad Soyad', input.name],
    ['E-posta', input.email],
    ['Telefon', input.phone ?? '-'],
    ['Konu', input.subject ?? '-'],
    ['Mesaj', input.message],
  ]
    .map(([label, value]) => `<tr><td style="padding:6px 10px;font-weight:600">${label}</td><td style="padding:6px 10px">${escapeHtml(String(value))}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Yeni iletisim talebi</h2>
      <table style="border-collapse:collapse;width:100%">${rows}</table>
    </div>
  `;

  await sendBereketMail({ to: adminTo, subject, html });
}

export async function sendBereketContactAutoReplyMail(input: ContactMailContext) {
  const siteName = await getSiteName();
  const subject = `${siteName} talebiniz alindi`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Talebiniz bize ulasti</h2>
      <p>Merhaba ${escapeHtml(input.name)},</p>
      <p>Mesajiniz kayda alindi. Teknik ekibimiz en kisa surede size donus yapacak.</p>
      <p><strong>Konu:</strong> ${escapeHtml(input.subject ?? '-')}</p>
    </div>
  `;

  await sendBereketMail({ to: input.email, subject, html });
}

function renderPricingBlock(input: OfferMailContext): string {
  const rows = [
    ['Para Birimi', input.currency ?? '-'],
    ['Net Toplam', input.net_total ?? '-'],
    ['KDV Orani', input.vat_rate ?? '-'],
    ['KDV Toplami', input.vat_total ?? '-'],
    ['Sevkiyat', input.shipping_total ?? '-'],
    ['Genel Toplam', input.gross_total ?? '-'],
    ['Gecerlilik', input.valid_until ?? '-'],
  ]
    .map(([label, value]) => `<tr><td style="padding:6px 10px;font-weight:600">${label}</td><td style="padding:6px 10px">${escapeHtml(String(value))}</td></tr>`)
    .join('');

  return `<table style="border-collapse:collapse;width:100%">${rows}</table>`;
}

export async function sendBereketOfferCustomerMail(input: OfferMailContext) {
  const siteName = await getSiteName();
  const subject = `${siteName} teklifiniz hazir`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Teklifiniz hazir</h2>
      <p>Merhaba ${escapeHtml(input.customer_name)},</p>
      <p>${escapeHtml(siteName)} ekibi teklif kaydinizi hazirladi.</p>
      ${renderPricingBlock(input)}
      ${
        input.pdf_url
          ? `<p style="margin-top:16px"><a href="${escapeHtml(input.pdf_url)}">Teklif dosyasini goruntule</a></p>`
          : ''
      }
    </div>
  `;

  await sendBereketMail({ to: input.email, subject, html });
}

export async function sendBereketOfferAdminMail(input: OfferMailContext, to: string) {
  const siteName = await getSiteName();
  const subject = `[${siteName}] Teklif gonderildi`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Musteriye teklif gonderildi</h2>
      <p><strong>Musteri:</strong> ${escapeHtml(input.customer_name)}</p>
      <p><strong>E-posta:</strong> ${escapeHtml(input.email)}</p>
      <p><strong>Teklif No:</strong> ${escapeHtml(input.offer_no || input.offer_id || '-')}</p>
      ${renderPricingBlock(input)}
      ${
        input.pdf_url
          ? `<p style="margin-top:16px"><a href="${escapeHtml(input.pdf_url)}">PDF baglantisi</a></p>`
          : ''
      }
    </div>
  `;

  await sendBereketMail({ to, subject, html });
}

export async function sendBereketOfferRequestAdminMail(input: OfferMailContext, to: string) {
  const siteName = await getSiteName();
  const subject = `[${siteName}] Yeni teklif talebi`;
  const rows = [
    ['Musteri', input.customer_name],
    ['Firma', input.company_name ?? '-'],
    ['E-posta', input.email],
    ['Telefon', input.phone ?? '-'],
    ['Ulke', input.country_code ?? '-'],
    ['Mesaj', input.message ?? '-'],
    ['Teklif ID', input.offer_id ?? '-'],
  ]
    .map(([label, value]) => `<tr><td style="padding:6px 10px;font-weight:600">${label}</td><td style="padding:6px 10px">${escapeHtml(String(value))}</td></tr>`)
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Yeni teklif talebi</h2>
      <table style="border-collapse:collapse;width:100%">${rows}</table>
    </div>
  `;

  await sendBereketMail({ to, subject, html });
}
