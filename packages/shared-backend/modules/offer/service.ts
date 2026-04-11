import { log } from '../../core/app-logger';
// =============================================================
// FILE: src/modules/offer/service.ts
// Bereket Fide – Offer Module Service
//   - PDF (Puppeteer) → uploads/offers/*.pdf
//   - Fallback txt dosyası (pdf-error.txt)
//   - Email templates + notifications
//   - ✅ PDF için product isimlerini i18n tablodan çeker (locale fallback)
//   - ✅ pdf_url DB'de RELATIVE saklanır, e-mail/template için ABSOLUTE üretilir
//   - ✅ site_settings locale-aware okuma (offer.locale → prefix → de → en → tr)
// =============================================================

import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'crypto';
import { eq, and, inArray, desc } from 'drizzle-orm';

import { db } from '../../db/client';
import { siteSettings } from '../siteSettings/schema';
import { notifications, type NotificationType } from '../notifications/schema';

import { offersTable, type OfferRow } from '@agro/shared-backend/modules/offer';
import { updateOffer } from './repository';
import { renderOfferPdfHtml } from './pdfTemplate';

import {
  sendBereketOfferAdminMail,
  sendBereketOfferCustomerMail,
  sendBereketOfferRequestAdminMail,
} from '../../core/bereket-mail';
import { telegramNotify } from '../telegram/helpers/telegram.notifier';

// ✅ Product schema (i18n)
import { products, productI18n } from '../products/schema';

import type { OfferListItem } from './repository';

// -------------------------------------------------------------
// Dosya yolları (FS) + local storage path
// -------------------------------------------------------------

const UPLOADS_ROOT_DIR = path.resolve(process.cwd(), 'uploads');
const OFFERS_DIR = path.join(UPLOADS_ROOT_DIR, 'offers');

async function ensureOffersDir() {
  await fs.mkdir(OFFERS_DIR, { recursive: true });
}

// -------------------------------------------------------------
// Puppeteer executable path resolution
// -------------------------------------------------------------

const POSSIBLE_EXECUTABLE_PATHS: string[] = [
  process.env.PUPPETEER_EXECUTABLE_PATH || '',
  process.env.CHROME_PATH || '',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
].filter(Boolean);

function resolvePuppeteerExecutable(): string | undefined {
  for (const p of POSSIBLE_EXECUTABLE_PATHS) {
    if (fsSync.existsSync(p)) {
      log.info({ puppeteerExecutable: p }, '[offer] Using puppeteer executable');
      return p;
    }
  }
  log.warn(
    '[offer] No explicit puppeteer executable found, Puppeteer will use its bundled browser (if installed).',
  );
  return undefined;
}

// -------------------------------------------------------------
// Locale helpers (offer.locale → prefix → de → en → tr)
// -------------------------------------------------------------

function uniq(arr: string[]) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function buildLocaleCandidates(rawLocale?: string | null): string[] {
  const lc = (rawLocale || '').trim();
  const langPart = lc.includes('-') ? lc.split('-')[0] : lc;

  // ✅ yorumla uyumlu + pratik sıra:
  // - offer locale (de-DE)
  // - prefix (de)
  // - de → en → tr fallback
  return uniq([lc, langPart, 'de', 'en', 'tr'].map((x) => x?.trim()).filter(Boolean));
}

// -------------------------------------------------------------
// site_settings helpers (locale-aware + fallback)
// -------------------------------------------------------------

async function getSiteSettingValue(key: string, locale?: string | null): Promise<unknown | null> {
  const candidates = buildLocaleCandidates(locale);

  // locale zorunlu olduğu için: aynı key için candidate locale’leri çek
  const rows = await db
    .select({
      locale: siteSettings.locale,
      value: siteSettings.value,
    })
    .from(siteSettings)
    .where(and(eq(siteSettings.key, key), inArray(siteSettings.locale, candidates)))
    .orderBy(desc(siteSettings.updated_at))
    .limit(50);

  if (!rows.length) return null;

  for (const loc of candidates) {
    const hit = rows.find((r) => r.locale === loc);
    if (typeof hit !== 'undefined') return hit.value ?? null;
  }

  return null;
}

function parseToStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[;,]+/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [String(value)].filter(Boolean);
}

async function getOffersAdminEmails(locale?: string | null): Promise<string[]> {
  const raw = await getSiteSettingValue('offers_admin_email', locale);
  return parseToStringArray(raw);
}

async function getOffersAdminUserIds(locale?: string | null): Promise<string[]> {
  const raw = await getSiteSettingValue('offers_admin_user_ids', locale);
  return parseToStringArray(raw);
}

// -------------------------------------------------------------
// URL helpers (relative ↔ absolute)
// -------------------------------------------------------------

function normalizeBaseUrl(v: string): string {
  return v.trim().replace(/\/+$/, '');
}

function ensureLeadingSlash(p: string): string {
  const s = (p || '').trim();
  if (!s) return '/';
  return s.startsWith('/') ? s : `/${s}`;
}

function isAbsoluteUrl(u: string): boolean {
  return /^https?:\/\//i.test(u);
}

function joinUrl(base: string, p: string): string {
  const b = normalizeBaseUrl(base);
  const pathPart = ensureLeadingSlash(p);
  return `${b}${pathPart}`;
}

async function getPublicBaseUrl(locale?: string | null): Promise<string | null> {
  // DB’den oku (seed: public_base_url)
  const raw = await getSiteSettingValue('public_base_url', locale);
  if (typeof raw === 'string' && raw.trim()) return normalizeBaseUrl(raw);

  // opsiyonel env fallback
  if (process.env.PUBLIC_BASE_URL && process.env.PUBLIC_BASE_URL.trim()) {
    return normalizeBaseUrl(process.env.PUBLIC_BASE_URL);
  }

  return null;
}

async function toAbsolutePublicUrl(
  maybeRelative: string | null | undefined,
  locale?: string | null,
): Promise<string | null> {
  if (!maybeRelative) return null;
  const u = String(maybeRelative).trim();
  if (!u) return null;
  if (isAbsoluteUrl(u)) return u;

  const base = await getPublicBaseUrl(locale);
  if (!base) return u; // base yoksa relative bırak
  return joinUrl(base, u);
}

/**
 * local storage base url: seed’de var (storage_local_base_url=/uploads)
 * Eğer boşsa fallback: /uploads
 */
async function getStorageLocalBaseUrl(locale?: string | null): Promise<string> {
  const raw = await getSiteSettingValue('storage_local_base_url', locale);
  if (typeof raw === 'string' && raw.trim()) return ensureLeadingSlash(raw.trim());
  return '/uploads';
}

// -------------------------------------------------------------
// form_data helper
// -------------------------------------------------------------

function parseJsonRecord(v: unknown): Record<string, unknown> | null {
  if (!v) return null;
  if (typeof v === 'object') return v as Record<string, unknown>;
  if (typeof v !== 'string') return null;
  try {
    const parsed = JSON.parse(v);
    if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, unknown>;
    return { raw: parsed };
  } catch {
    return null;
  }
}

function pickFirstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

// -------------------------------------------------------------
// Product name resolve (i18n)
// -------------------------------------------------------------

async function getProductTitleById(opts: {
  productId: string;
  locale?: string | null;
}): Promise<string | null> {
  const { productId, locale } = opts;
  const candidates = buildLocaleCandidates(locale);

  try {
    const rows = await db
      .select({
        locale: productI18n.locale,
        title: productI18n.title,
      })
      .from(productI18n)
      .where(and(eq(productI18n.product_id, productId), inArray(productI18n.locale, candidates)));

    for (const loc of candidates) {
      const hit = rows.find((r) => r.locale === loc);
      if (hit?.title) return hit.title;
    }

    const base = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!base.length) return null;
    return null;
  } catch (err) {
    log.error({ err }, 'offer:getProductTitleById_failed');
    return null;
  }
}

// -------------------------------------------------------------
// Notifications helper
// -------------------------------------------------------------

async function createNotificationForAdmins(opts: {
  title: string;
  message: string;
  type: NotificationType;
  locale?: string | null;
}) {
  const adminUserIds = await getOffersAdminUserIds(opts.locale);
  if (!adminUserIds.length) return;

  const rows = adminUserIds.map((uid) => ({
    id: randomUUID(),
    user_id: uid,
    title: opts.title,
    message: opts.message,
    type: opts.type,
  }));

  await db.insert(notifications).values(rows);
}

// -------------------------------------------------------------
// PDF üretim (Puppeteer) – HTML → Uint8Array
// -------------------------------------------------------------

export async function generateOfferPdfBuffer(
  offer: OfferRow & {
    site_name?: string | null;
    product_name?: string | null;
    service_name?: string | null;
  },
): Promise<Uint8Array> {
  const html = await renderOfferPdfHtml(offer);

  const execPath = resolvePuppeteerExecutable();

  const launchOptions: Parameters<typeof puppeteer.launch>[0] = {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (execPath) {
    (launchOptions as any).executablePath = execPath;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

// -------------------------------------------------------------
// PDF / TXT'i diske kaydet – uploads/offers
// DB: pdf_url RELATIVE saklanır (örn: /uploads/offers/x.pdf)
// -------------------------------------------------------------

async function saveOfferFileToLocalStorage(
  buffer: Uint8Array | Buffer,
  fileName: string,
  locale?: string | null,
): Promise<{ pdf_url: string; pdf_asset_id: string | null }> {
  await ensureOffersDir();

  const safeName = fileName.replace(/[^A-Za-z0-9_.-]/g, '-') || `offer-${Date.now()}.pdf`;
  const absPath = path.join(OFFERS_DIR, safeName);

  await fs.writeFile(absPath, buffer);

  const baseUploads = await getStorageLocalBaseUrl(locale); // default: /uploads
  const pdf_url = `${baseUploads.replace(/\/+$/, '')}/offers/${safeName}`;

  return {
    pdf_url, // ✅ RELATIVE (DB)
    pdf_asset_id: null,
  };
}

async function saveOfferErrorFile(
  offerId: string,
  err: unknown,
  locale?: string | null,
): Promise<{ pdf_url: string; pdf_asset_id: string | null }> {
  const text = [
    `PDF generation failed for offer ${offerId}.`,
    '',
    'Error:',
    err instanceof Error ? err.message : String(err),
    '',
    'This file is created as a fallback placeholder.',
  ].join('\n');

  const buffer = Buffer.from(text, 'utf8');
  const fileName = `${offerId}-pdf-error.txt`;

  return saveOfferFileToLocalStorage(buffer, fileName, locale);
}

// -------------------------------------------------------------
// Teklif için PDF üret + offers tablosuna pdf_url/pdf_asset_id yaz
// -------------------------------------------------------------

export async function generateAndAttachOfferPdf(
  offer: OfferRow,
): Promise<{ pdf_url: string | null; pdf_asset_id: string | null }> {
  const siteTitleRaw = await getSiteSettingValue('site_title', offer.locale ?? null);
  const siteName = (typeof siteTitleRaw === 'string' && siteTitleRaw) || 'Bereket Fide';

  const productId = offer.product_id ?? null;

  const [product_name] = await Promise.all([
    productId
      ? getProductTitleById({ productId, locale: offer.locale ?? null })
      : Promise.resolve(null),
  ]);

  try {
    const buffer = await generateOfferPdfBuffer({
      ...offer,
      site_name: siteName,
      product_name,
      service_name: null,
    });

    const fileName = (offer.offer_no || `offer-${offer.id}`) + '.pdf';

    const { pdf_url, pdf_asset_id } = await saveOfferFileToLocalStorage(
      buffer,
      fileName,
      offer.locale ?? null,
    );

    await updateOffer(offer.id, { pdf_url, pdf_asset_id } as any);

    return { pdf_url, pdf_asset_id };
  } catch (err) {
    log.error({ err }, 'generateAndAttachOfferPdf_failed');

    const { pdf_url, pdf_asset_id } = await saveOfferErrorFile(offer.id, err, offer.locale ?? null);

    await updateOffer(offer.id, { pdf_url, pdf_asset_id } as any);

    return { pdf_url, pdf_asset_id };
  }
}

// -------------------------------------------------------------
// Mail helper – kompozit icin kod-temelli dar mail seti
// -------------------------------------------------------------

type OfferEmailContext = {
  offer: OfferRow;
  pdf_url?: string | null;
  pdf_asset_id?: string | null;
};

async function sendCustomerOfferMail(ctx: OfferEmailContext): Promise<boolean> {
  const o = ctx.offer;
  const pdfAbs = await toAbsolutePublicUrl(ctx.pdf_url ?? o.pdf_url ?? null, o.locale ?? null);

  await sendBereketOfferCustomerMail({
    customer_name: o.customer_name,
    company_name: o.company_name,
    offer_no: o.offer_no ?? o.id,
    email: o.email,
    phone: o.phone,
    currency: o.currency,
    net_total: o.net_total,
    vat_rate: (o as any).vat_rate ?? null,
    vat_total: o.vat_total,
    shipping_total: (o as any).shipping_total ?? null,
    gross_total: o.gross_total,
    valid_until:
      o.valid_until instanceof Date ? o.valid_until.toISOString().substring(0, 10) : null,
    pdf_url: pdfAbs,
    locale: o.locale ?? null,
  });

  return true;
}

async function sendAdminOfferMail(ctx: OfferEmailContext): Promise<boolean> {
  const o = ctx.offer;
  const adminEmails = await getOffersAdminEmails(o.locale ?? null);
  if (!adminEmails.length) return false;

  const pdfAbs = await toAbsolutePublicUrl(ctx.pdf_url ?? o.pdf_url ?? null, o.locale ?? null);

  for (const to of adminEmails) {
    await sendBereketOfferAdminMail(
      {
        customer_name: o.customer_name,
        company_name: o.company_name,
        offer_no: o.offer_no ?? o.id,
        email: o.email,
        phone: o.phone,
        currency: o.currency,
        net_total: o.net_total,
        vat_rate: (o as any).vat_rate ?? null,
        vat_total: o.vat_total,
        shipping_total: (o as any).shipping_total ?? null,
        gross_total: o.gross_total,
        valid_until:
          o.valid_until instanceof Date ? o.valid_until.toISOString().substring(0, 10) : null,
        pdf_url: pdfAbs,
        locale: o.locale ?? null,
      },
      to,
    );
  }

  return true;
}

// -------------------------------------------------------------
// Public form submit → admin'e notification + opsiyonel mail
// -------------------------------------------------------------

export async function triggerNewOfferNotifications(offer: OfferRow) {
  const title = 'Yeni Teklif Talebi';
  const message = `Yeni teklif talebi oluşturuldu.
Müşteri: ${offer.customer_name}
E-posta: ${offer.email}
Teklif ID: ${offer.id}`;

  await createNotificationForAdmins({
    title,
    message,
    type: 'offer_created' as NotificationType,
    locale: offer.locale ?? null,
  });

  try {
    const createdAt =
      offer.created_at instanceof Date ? offer.created_at.toISOString() : new Date().toISOString();
    await telegramNotify({
      title: 'Yeni Teklif Talebi',
      message: [
        `Müşteri: ${offer.customer_name}`,
        `E-posta: ${offer.email}`,
        `Telefon: ${offer.phone ?? ''}`,
        `Firma: ${offer.company_name ?? ''}`,
        `Konu: ${offer.subject ?? ''}`,
        `Mesaj: ${offer.message ?? ''}`,
        `Oluşturulma: ${createdAt}`,
      ].join('\n'),
      type: 'new_offer_request',
    });
  } catch (err) {
    log.error({ err }, 'offer_request_telegram_failed');
  }

  try {
    const adminEmails = await getOffersAdminEmails(offer.locale ?? null);
    if (!adminEmails.length) return;

    for (const to of adminEmails) {
      await sendBereketOfferRequestAdminMail(
        {
          customer_name: offer.customer_name,
          company_name: offer.company_name,
          email: offer.email,
          phone: offer.phone,
          offer_id: offer.id,
          message: offer.message,
          country_code: (offer as any).country_code ?? null,
          locale: offer.locale ?? null,
        },
        to,
      );
    }
  } catch (err) {
    log.error({ err }, 'offer_request_admin_mail_failed');
  }
}

// -------------------------------------------------------------
// Admin → "Teklifi Gönder" aksiyonu
// -------------------------------------------------------------

export async function sendOfferEmailsAndNotifications(
  offer: OfferRow,
  opts: { pdf_url?: string | null; pdf_asset_id?: string | null },
): Promise<{ customerSent: boolean; adminSent: boolean }> {
  const pdf_url = opts.pdf_url ?? offer.pdf_url ?? null;
  const pdf_asset_id = opts.pdf_asset_id ?? offer.pdf_asset_id ?? null;

  const ctx: OfferEmailContext = { offer, pdf_url, pdf_asset_id };

  let customerSent = false;
  let adminSent = false;

  try {
    customerSent = await sendCustomerOfferMail(ctx);
  } catch (err) {
    log.error({ err }, 'sendCustomerOfferMail failed');
    customerSent = false;
  }

  try {
    adminSent = await sendAdminOfferMail(ctx);
  } catch (err) {
    log.error({ err }, 'sendAdminOfferMail failed');
    adminSent = false;
  }

  if (!customerSent) {
    return { customerSent, adminSent };
  }

  const title = 'Teklif Gönderildi';
  const message = `Bir teklif müşteriye gönderildi.
Teklif No: ${offer.offer_no ?? offer.id}
Müşteri: ${offer.customer_name}
E-posta: ${offer.email}`;

  await createNotificationForAdmins({
    title,
    message,
    type: 'offer_sent' as NotificationType,
    locale: offer.locale ?? null,
  });

  try {
    await telegramNotify({
      title: 'Teklif Gönderildi',
      message: [
        `Teklif No: ${offer.offer_no ?? offer.id}`,
        `Müşteri: ${offer.customer_name}`,
        `E-posta: ${offer.email}`,
        `Durum: sent`,
      ].join('\n'),
      type: 'offer_sent',
    });
  } catch (err) {
    log.error({ err }, 'offer_sent_telegram_failed');
  }

  await db
    .update(offersTable)
    .set({
      email_sent_at: new Date() as any,
      status: offer.status === 'sent' ? offer.status : ('sent' as any),
    })
    .where(eq(offersTable.id, offer.id));

  return { customerSent, adminSent };
}

// -------------------------------------------------------------
// ✅ sadece mail gönder (existing API), email_sent_at + status günceller
// -------------------------------------------------------------

export async function sendOfferEmailOnly(
  offer: OfferListItem,
): Promise<{ customerSent: boolean; adminSent?: boolean }> {
  if (!offer.pdf_url) {
    return { customerSent: false };
  }

  const res = await sendOfferEmailsAndNotifications(offer as any, {
    pdf_url: offer.pdf_url,
    pdf_asset_id: offer.pdf_asset_id ?? null,
  });

  if (res.customerSent) {
    await updateOffer(offer.id, {
      email_sent_at: new Date() as any,
      status: 'sent' as any,
    } as any);
  }

  return res;
}

// ---------------------------------------------------------------------------
// OFFER PDF LABELS (localized JSON) - site_settings.offer_pdf_labels
//   - Uses THIS module's locale fallback (buildLocaleCandidates + getSiteSettingValue)
//   - No dependency on siteSettings/service.ts internals
// ---------------------------------------------------------------------------

export type OfferPdfLabels = {
  title?: string;
  quoteNo?: string;
  date?: string;
  validity?: string;
  status?: string;

  customerInfo?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  formLanguage?: string;
  product?: string;
  service?: string;

  summary?: string;
  subject?: string;
  noMessage?: string;

  pricing?: string;
  net?: string;
  vat?: string;
  shipping?: string;
  total?: string;
  pricingEmpty?: string;

  notes?: string;

  notesLegalTemplate?: string;
  validUntilPartTemplate?: string;
  internalNotes?: string;

  footerLeftTemplate?: string;
  footerRight?: string;
};

function tryParseJsonObject(v: unknown): Record<string, unknown> | null {
  if (!v) return null;

  if (typeof v === 'object') {
    return v as Record<string, unknown>;
  }

  if (typeof v !== 'string') return null;

  const s = v.trim();
  if (!s) return null;

  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function pickString(obj: Record<string, unknown>, key: string): string | undefined {
  const v = obj[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export async function getOfferPdfLabels(locale?: string | null): Promise<OfferPdfLabels | null> {
  const raw = await getSiteSettingValue('offer_pdf_labels', locale);
  const obj = tryParseJsonObject(raw);

  if (!obj) return null;

  const out: OfferPdfLabels = {
    title: pickString(obj, 'title'),
    quoteNo: pickString(obj, 'quoteNo'),
    date: pickString(obj, 'date'),
    validity: pickString(obj, 'validity'),
    status: pickString(obj, 'status'),

    customerInfo: pickString(obj, 'customerInfo'),
    name: pickString(obj, 'name'),
    company: pickString(obj, 'company'),
    email: pickString(obj, 'email'),
    phone: pickString(obj, 'phone'),
    country: pickString(obj, 'country'),
    formLanguage: pickString(obj, 'formLanguage'),
    product: pickString(obj, 'product'),
    service: pickString(obj, 'service'),

    summary: pickString(obj, 'summary'),
    subject: pickString(obj, 'subject'),
    noMessage: pickString(obj, 'noMessage'),

    pricing: pickString(obj, 'pricing'),
    net: pickString(obj, 'net'),
    vat: pickString(obj, 'vat'),
    shipping: pickString(obj, 'shipping'),
    total: pickString(obj, 'total'),
    pricingEmpty: pickString(obj, 'pricingEmpty'),

    notes: pickString(obj, 'notes'),

    notesLegalTemplate: pickString(obj, 'notesLegalTemplate'),
    validUntilPartTemplate: pickString(obj, 'validUntilPartTemplate'),
    internalNotes: pickString(obj, 'internalNotes'),

    footerLeftTemplate: pickString(obj, 'footerLeftTemplate'),
    footerRight: pickString(obj, 'footerRight'),
  };

  return out;
}
