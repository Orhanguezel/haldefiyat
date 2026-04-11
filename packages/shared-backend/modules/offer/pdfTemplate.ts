import { log } from '../../core/app-logger';
// =============================================================
// FILE: src/modules/offer/pdfTemplate.ts
// Bereket Fide – Offer PDF HTML Template
//   - Teklif PDF'inde kullanılacak HTML + inline CSS
//   - Kaynak: OfferRow (offers tablosu)
//   - Dil: site_settings.app_locales + offer.locale + default_locale
//   - Firma bilgisi + logo: site_settings.company_brand
// =============================================================

import type { OfferRow } from '@agro/shared-backend/modules/offer';
import { getAppLocales, getDefaultLocale } from '../siteSettings/service';
import { db } from '../../db/client';
import { siteSettings } from '../siteSettings/schema';
import { and, inArray, eq } from 'drizzle-orm';

type PdfTemplateContext = OfferRow & {
  site_name?: string | null;
  product_name?: string | null;
  service_name?: string | null;
};

function safe(value: unknown): string {
  if (value == null) return '';
  return String(value);
}

function safeText(value: unknown): string {
  const s = safe(value);
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ✅ Label dilleri (TR/EN/DE)
type LabelLocale = 'tr' | 'en' | 'de';

function toIntlLocale(locale: LabelLocale): string {
  if (locale === 'tr') return 'tr-TR';
  if (locale === 'de') return 'de-DE';
  return 'en-US';
}

function formatDate(d: Date | string | null | undefined, locale: LabelLocale) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  const intlLocale = toIntlLocale(locale);

  try {
    return date.toLocaleDateString(intlLocale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return date.toISOString().substring(0, 10);
  }
}

function formatMoney(
  value: string | number | null | undefined,
  currency: string | null | undefined,
  locale: LabelLocale,
) {
  if (value == null) return '';

  const raw = typeof value === 'string' ? value.trim() : value;
  if (raw === '') return '';

  const num = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isNaN(num)) return typeof value === 'string' ? value : '';

  const c = currency || 'EUR';
  const intlLocale = toIntlLocale(locale);

  try {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: c,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${c}`;
  }
}

function normalizeNumberish(input: string): string {
  let s = input.trim();
  s = s.replace(/%/g, '').trim();
  s = s.replace(/\s+/g, '');

  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
    return s;
  }
  if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.');
    return s;
  }
  return s;
}

function parseDecimal(v: unknown): number | null {
  if (v == null) return null;

  if (typeof v === 'number') return Number.isFinite(v) ? v : null;

  if (typeof v === 'string') {
    const s = normalizeNumberish(v);
    if (!s) return null;
    const n = Number(s);
    return Number.isNaN(n) || !Number.isFinite(n) ? null : n;
  }

  if (typeof v === 'object') {
    const s = (v as any)?.toString?.();
    if (typeof s === 'string' && s.trim()) return parseDecimal(s);
  }

  return null;
}

function parseJsonRecord(v: unknown): Record<string, unknown> | null {
  if (!v) return null;
  if (typeof v === 'object') return v as Record<string, unknown>;
  if (typeof v !== 'string') return null;
  try {
    const parsed = JSON.parse(v);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : { raw: parsed };
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
// app_locales + default_locale → dinamik locale çözümü
// -------------------------------------------------------------

let cachedAppLocales: string[] | null = null;
let cachedDefaultLocale: string | null = null;

function normalizeLocaleShort(input?: string | null): string | null {
  const s = String(input || '')
    .trim()
    .toLowerCase()
    .replace('_', '-');
  if (!s) return null;
  return (s.split('-')[0] || '').trim() || null;
}

async function ensureAppLocales(): Promise<string[]> {
  if (cachedAppLocales && cachedAppLocales.length) return cachedAppLocales;

  try {
    const list = await getAppLocales(); // expected: string[] (already normalized ideally)
    if (Array.isArray(list) && list.length) {
      const uniq: string[] = [];
      for (const x of list) {
        const n = normalizeLocaleShort(x);
        if (n && !uniq.includes(n)) uniq.push(n);
      }
      if (uniq.length) {
        cachedAppLocales = uniq;
        return uniq;
      }
    }
  } catch (err) {
    log.error({ err }, 'offer_pdf:getAppLocales_failed');
  }

  // fallback
  cachedAppLocales = ['de', 'en', 'tr'];
  return cachedAppLocales;
}

async function ensureDefaultLocale(): Promise<string | null> {
  if (cachedDefaultLocale) return cachedDefaultLocale;

  try {
    const v = await getDefaultLocale(); // expected: string like "de"
    const n = normalizeLocaleShort(v);
    if (n) {
      cachedDefaultLocale = n;
      return n;
    }
  } catch (err) {
    log.error({ err }, 'offer_pdf:getDefaultLocale_failed');
  }

  return null;
}

/**
 * Runtime locale:
 *   - Önce offer.locale (örn: "de", "en", "tr-TR" vs.)
 *   - app_locales içinde exact/prefix match
 *   - Bulunamazsa DB default_locale
 *   - O da yoksa app_locales[0]
 */
async function resolveRuntimeLocale(rawLocale?: string | null): Promise<string> {
  const appLocales = await ensureAppLocales();
  const dbDefault = await ensureDefaultLocale();
  const fallback = dbDefault || appLocales[0] || 'en';

  if (!rawLocale) return fallback;

  const lcFull = String(rawLocale).trim().toLowerCase().replace('_', '-');
  const lcShort = normalizeLocaleShort(lcFull);

  if (!lcShort) return fallback;

  // exact match (short)
  if (appLocales.includes(lcShort)) return lcShort;

  // prefix match: "tr-tr" startsWith "tr"
  const prefix = appLocales.find((l) => lcFull.startsWith(`${l.toLowerCase()}`));
  if (prefix) return prefix;

  return fallback;
}

/**
 * Label set için desteklediğimiz diller: "tr" | "en" | "de"
 * Runtime locale başka ise label tarafında en yakınını seç.
 */
function toLabelLocale(runtimeLocale: string): LabelLocale {
  const lc = String(runtimeLocale || '').toLowerCase();
  if (lc.startsWith('tr')) return 'tr';
  if (lc.startsWith('de')) return 'de';
  return 'en';
}

// -------------------------------------------------------------
// Firma bilgisi (company_brand) – site_settings’den
// -------------------------------------------------------------

type CompanyBrandSettings = {
  name: string;
  shortName: string | null;
  website: string | null;
  logoUrl: string | null;
  logoWidth: number | null;
  logoHeight: number | null;
};

const companyBrandCache = new Map<string, CompanyBrandSettings>();

async function getCompanyBrandSettings(runtimeLocale: string): Promise<CompanyBrandSettings> {
  const cached = companyBrandCache.get(runtimeLocale);
  if (cached) return cached;

  const langPart = runtimeLocale.split('-')[0].toLowerCase();
  const candidateLocales = Array.from(new Set<string>([runtimeLocale, langPart, 'en', 'de', 'tr']));

  let brand: CompanyBrandSettings = {
    name: 'Bereket Fide',
    shortName: null,
    website: null,
    logoUrl: null,
    logoWidth: null,
    logoHeight: null,
  };

  try {
    const rows = await db
      .select({
        locale: siteSettings.locale,
        value: siteSettings.value,
      })
      .from(siteSettings)
      .where(
        and(eq(siteSettings.key, 'company_brand'), inArray(siteSettings.locale, candidateLocales)),
      );

    let picked: { locale: string; value: string } | undefined;

    for (const loc of candidateLocales) {
      const row = rows.find((r) => r.locale === loc);
      if (row) {
        picked = row as { locale: string; value: string };
        break;
      }
    }

    if (picked) {
      try {
        const parsed = JSON.parse(picked.value);
        brand = {
          name: parsed.name || brand.name,
          shortName: typeof parsed.shortName === 'string' ? parsed.shortName : null,
          website: typeof parsed.website === 'string' ? parsed.website : null,
          logoUrl: parsed.logo && typeof parsed.logo.url === 'string' ? parsed.logo.url : null,
          logoWidth:
            parsed.logo && typeof parsed.logo.width === 'number' ? parsed.logo.width : null,
          logoHeight:
            parsed.logo && typeof parsed.logo.height === 'number' ? parsed.logo.height : null,
        };
      } catch (err) {
        log.error({ err }, 'offer_pdf:parse_company_brand_failed');
      }
    }
  } catch (err) {
    log.error({ err }, 'offer_pdf:load_company_brand_failed');
  }

  companyBrandCache.set(runtimeLocale, brand);
  return brand;
}

// -------------------------------------------------------------
// i18n – TR / EN / DE label fallback set
// -------------------------------------------------------------

const LABELS: Record<
  LabelLocale,
  {
    title: string;
    quoteNo: string;
    date: string;
    validity: string;
    status: string;

    customerInfo: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    country: string;
    formLanguage: string;
    product: string;
    service: string;

    summary: string;
    subject: string;
    noMessage: string;

    pricing: string;
    net: string;
    vat: string;
    shipping: string;
    total: string;
    pricingEmpty: string;

    notes: string;
    notesLegal: (validUntilStr: string, companyName: string) => string;
    internalNotes: string;

    footerLeft: (siteName: string) => string;
    footerRight: string;
  }
> = {
  tr: {
    title: 'Teklif',
    quoteNo: 'Teklif No',
    date: 'Tarih',
    validity: 'Geçerlilik',
    status: 'Durum',
    customerInfo: 'Müşteri Bilgileri',
    name: 'Ad Soyad',
    company: 'Firma',
    email: 'E-posta',
    phone: 'Telefon',
    country: 'Ülke',
    formLanguage: 'Form dili',
    product: 'Ürün',
    service: 'Hizmet',
    summary: 'Teklif Özeti',
    subject: 'Konu',
    noMessage: 'Müşteri mesajı bulunmamaktadır.',
    pricing: 'Fiyatlandırma',
    net: 'Net Tutar',
    vat: 'KDV',
    shipping: 'Nakliye',
    total: 'Genel Toplam',
    pricingEmpty: 'Fiyatlandırma henüz eklenmemiştir; bu belge ön teklif niteliğindedir.',
    notes: 'Notlar',
    notesLegal: (validUntilStr, companyName) =>
      `Bu belge bilgilendirme amaçlıdır. Nihai fiyat ve ticari koşullar, ${
        validUntilStr ? `${validUntilStr} tarihine kadar geçerli olup ` : ''
      }${companyName} tarafından yazılı olarak onaylandığında geçerli olacaktır.`,
    internalNotes: 'İdari not (dahili kullanım)',
    footerLeft: (siteName) => `${siteName} – Otomatik Teklif Sistemi`,
    footerRight: 'Bu PDF sistem tarafından oluşturulmuştur, imza gerektirmez.',
  },

  en: {
    title: 'Offer',
    quoteNo: 'Offer No',
    date: 'Date',
    validity: 'Valid Until',
    status: 'Status',
    customerInfo: 'Customer Information',
    name: 'Name',
    company: 'Company',
    email: 'Email',
    phone: 'Phone',
    country: 'Country',
    formLanguage: 'Form language',
    product: 'Product',
    service: 'Service',
    summary: 'Offer Summary',
    subject: 'Subject',
    noMessage: 'No customer message has been provided.',
    pricing: 'Pricing',
    net: 'Net Amount',
    vat: 'VAT',
    shipping: 'Shipping',
    total: 'Grand Total',
    pricingEmpty:
      'Pricing has not been added yet; this document should be considered a preliminary offer.',
    notes: 'Notes',
    notesLegal: (validUntilStr, companyName) =>
      `This document is for information purposes only. Final prices and commercial terms become valid only after written confirmation by ${companyName}${
        validUntilStr ? ` and are valid until ${validUntilStr}.` : '.'
      }`,
    internalNotes: 'Internal note',
    footerLeft: (siteName) => `${siteName} – Automated Offer System`,
    footerRight: 'This PDF is generated by the system and does not require a signature.',
  },

  de: {
    title: 'Angebot',
    quoteNo: 'Angebots-Nr.',
    date: 'Datum',
    validity: 'Gültig bis',
    status: 'Status',
    customerInfo: 'Kundendaten',
    name: 'Name',
    company: 'Firma',
    email: 'E-Mail',
    phone: 'Telefon',
    country: 'Land',
    formLanguage: 'Formularsprache',
    product: 'Produkt',
    service: 'Leistung',
    summary: 'Angebotsübersicht',
    subject: 'Betreff',
    noMessage: 'Es wurde keine Kundenmitteilung angegeben.',
    pricing: 'Preisübersicht',
    net: 'Nettobetrag',
    vat: 'MwSt.',
    shipping: 'Versand',
    total: 'Gesamtbetrag',
    pricingEmpty:
      'Preise wurden noch nicht hinterlegt; dieses Dokument ist ein unverbindlicher Vorab-Entwurf.',
    notes: 'Hinweise',
    notesLegal: (validUntilStr, companyName) =>
      `Dieses Dokument dient ausschließlich Informationszwecken. Endgültige Preise und Konditionen gelten erst nach schriftlicher Bestätigung durch ${companyName}${
        validUntilStr ? ` und sind bis zum ${validUntilStr} gültig.` : '.'
      }`,
    internalNotes: 'Interne Notiz',
    footerLeft: (siteName) => `${siteName} – Automatisiertes Angebotssystem`,
    footerRight: 'Dieses PDF wurde automatisch erstellt und benötigt keine Unterschrift.',
  },
};

// -------------------------------------------------------------
// MAIN RENDER
// -------------------------------------------------------------

export async function renderOfferPdfHtml(ctx: PdfTemplateContext): Promise<string> {
  const runtimeLocale = await resolveRuntimeLocale(ctx.locale || undefined);
  const labelLocale = toLabelLocale(runtimeLocale);
  const t = LABELS[labelLocale];

  const companyBrand = await getCompanyBrandSettings(runtimeLocale);
  const siteName = companyBrand.name || ctx.site_name || 'Bereket Fide';

  const offerNo = (ctx as any).offer_no || ctx.id;
  const createdAtStr = formatDate((ctx as any).created_at ?? null, labelLocale);
  const validUntilStr = formatDate((ctx as any).valid_until ?? null, labelLocale);

  const formData = parseJsonRecord((ctx as any).form_data);

  const formProductName = formData
    ? pickFirstString(
        (formData as any).product_name,
        (formData as any).productName,
        (formData as any).product_title,
        (formData as any).productTitle,
        (formData as any).product,
        (formData as any).item_name,
        (formData as any).itemName,
      )
    : null;

  const formServiceName = formData
    ? pickFirstString(
        (formData as any).service_name,
        (formData as any).serviceName,
        (formData as any).service_title,
        (formData as any).serviceTitle,
        (formData as any).service,
        (formData as any).requested_service,
        (formData as any).requestedService,
      )
    : null;

  const productDisplay = pickFirstString(ctx.product_name, formProductName) ?? null;
  const serviceDisplay = pickFirstString(ctx.service_name, formServiceName) ?? null;

  const currency = (ctx as any).currency;

  const netNum = parseDecimal((ctx as any).net_total);
  const vatNumFromRow = parseDecimal((ctx as any).vat_total);
  const grossNumFromRow = parseDecimal((ctx as any).gross_total);
  const shippingNum = parseDecimal((ctx as any).shipping_total);

  let vatNum: number | null = vatNumFromRow;
  let grossNum: number | null = grossNumFromRow;

  const vatRateRaw = (ctx as any).vat_rate as number | string | null | undefined;
  const vatRate = parseDecimal(vatRateRaw);

  if (vatNum == null && vatRate != null && netNum != null) {
    const ratio = vatRate / 100;
    if (Number.isFinite(ratio)) vatNum = netNum * ratio;
  }

  if (grossNum == null && netNum != null) {
    grossNum = netNum + (vatNum ?? 0) + (shippingNum ?? 0);
  }

  const netStr = netNum != null ? formatMoney(netNum.toFixed(2), currency, labelLocale) : '';
  const vatStr = vatNum != null ? formatMoney(vatNum.toFixed(2), currency, labelLocale) : '';
  const shippingStr =
    shippingNum != null ? formatMoney(shippingNum.toFixed(2), currency, labelLocale) : '';
  const grossStr = grossNum != null ? formatMoney(grossNum.toFixed(2), currency, labelLocale) : '';

  const vatLabel =
    vatRate != null && Number.isFinite(vatRate) ? `${t.vat} (${vatRate.toFixed(0)}%)` : `${t.vat}`;

  const logoUrl = companyBrand.logoUrl;
  const logoWidth = companyBrand.logoWidth || 160;
  const logoHeight = companyBrand.logoHeight || 60;

  const countryDisplay = (ctx as any).country_code
    ? String((ctx as any).country_code).toUpperCase()
    : '';
  const formLangDisplay = runtimeLocale || '';

  // Aşağısı: senin HTML template’in (dokunmadım; sadece runtimeLocale/labelLocale değişkenleri fix)
  return `<!DOCTYPE html>
<html lang="${safeText(runtimeLocale)}">
<head>
  <meta charset="UTF-8" />
  <title>${safeText(siteName)} – ${safeText(t.title)} ${safeText(offerNo)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 12px; color: #222; }
    body { padding: 24mm 18mm 20mm 18mm; background: #fff; }
    .page { width: 100%; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 2px solid #0b5ed7; padding-bottom: 8px; }
    .header-left { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
    .header-logo { max-height: 40px; max-width: 180px; display: block; }
    .header-left-title { font-size: 18px; font-weight: 700; color: #0b5ed7; }
    .header-left-sub { font-size: 12px; font-weight: 400; color: #444; }
    .header-right { text-align: right; font-size: 11px; line-height: 1.4; }
    .section-title { font-size: 13px; font-weight: 600; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: 0.06em; color: #555; }
    .details-grid { display: grid; grid-template-columns: 1.2fr 1.2fr; gap: 8px 32px; font-size: 11px; }
    .details-grid div { line-height: 1.4; }
    .label { font-weight: 600; color: #555; display: inline-block; min-width: 110px; }
    .muted { color: #777; }
    .box { border: 1px solid #e0e0e0; border-radius: 4px; padding: 10px 12px; margin-top: 4px; background: #fafafa; }
    .amounts { margin-top: 12px; width: 280px; margin-left: auto; font-size: 11px; }
    .amounts table { width: 100%; border-collapse: collapse; }
    .amounts td { padding: 4px 0; vertical-align: top; }
    .amounts td.label { text-align: left; }
    .amounts td.value { text-align: right; font-weight: 600; white-space: nowrap; }
    .amounts tr.total-row td { border-top: 1px solid #ccc; padding-top: 6px; font-size: 12px; }
    .text-block { font-size: 11px; line-height: 1.5; margin-top: 8px; white-space: pre-wrap; }
    .footer { margin-top: 24px; font-size: 9px; color: #888; border-top: 1px solid #e0e0e0; padding-top: 6px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-left">
        ${
          logoUrl
            ? `<img src="${safeText(logoUrl)}" alt="${safeText(
                siteName,
              )}" class="header-logo" width="${Number(logoWidth)}" height="${Number(
                logoHeight,
              )}" />`
            : ''
        }
        <div>
          <div class="header-left-title">${safeText(siteName)}</div>
          <div class="header-left-sub">${safeText(t.title)}</div>
        </div>
      </div>
      <div class="header-right">
        <div><span class="label">${safeText(t.quoteNo)}:</span> ${safeText(offerNo)}</div>
        <div><span class="label">${safeText(t.date)}:</span> ${safeText(createdAtStr)}</div>
        ${
          validUntilStr
            ? `<div><span class="label">${safeText(t.validity)}:</span> ${safeText(
                validUntilStr,
              )}</div>`
            : ''
        }
      </div>
    </div>

    <div class="section-title">${safeText(t.customerInfo)}</div>
    <div class="details-grid">
      <div>
        <div><span class="label">${safeText(t.name)}:</span> ${safeText(
    (ctx as any).customer_name,
  )}</div>
        ${
          (ctx as any).company_name
            ? `<div><span class="label">${safeText(t.company)}:</span> ${safeText(
                (ctx as any).company_name,
              )}</div>`
            : ''
        }
        <div><span class="label">${safeText(t.email)}:</span> ${safeText((ctx as any).email)}</div>
        ${
          (ctx as any).phone
            ? `<div><span class="label">${safeText(t.phone)}:</span> ${safeText(
                (ctx as any).phone,
              )}</div>`
            : ''
        }
        ${
          countryDisplay
            ? `<div><span class="label">${safeText(t.country)}:</span> ${safeText(
                countryDisplay,
              )}</div>`
            : ''
        }
        ${
          formLangDisplay
            ? `<div><span class="label">${safeText(t.formLanguage)}:</span> ${safeText(
                formLangDisplay,
              )}</div>`
            : ''
        }
      </div>

      <div>
        ${
          productDisplay
            ? `<div><span class="label">${safeText(t.product)}:</span> ${safeText(
                productDisplay,
              )}</div>`
            : ''
        }
        ${
          serviceDisplay
            ? `<div><span class="label">${safeText(t.service)}:</span> ${safeText(
                serviceDisplay,
              )}</div>`
            : ''
        }
      </div>
    </div>

    <div class="section-title">${safeText(t.summary)}</div>
    <div class="box">
      ${
        (ctx as any).subject
          ? `<div><span class="label">${safeText(t.subject)}:</span> ${safeText(
              (ctx as any).subject,
            )}</div>`
          : ''
      }
      ${
        (ctx as any).message
          ? `<div class="text-block">${safeText((ctx as any).message)}</div>`
          : `<div class="muted">${safeText(t.noMessage)}</div>`
      }
    </div>

    <div class="section-title">${safeText(t.pricing)}</div>
    <div class="amounts">
      <table>
        <tbody>
          ${
            netStr
              ? `<tr><td class="label">${safeText(t.net)}:</td><td class="value">${safeText(
                  netStr,
                )}</td></tr>`
              : ''
          }
          ${
            vatStr
              ? `<tr><td class="label">${safeText(vatLabel)}:</td><td class="value">${safeText(
                  vatStr,
                )}</td></tr>`
              : ''
          }
          ${
            shippingStr
              ? `<tr><td class="label">${safeText(t.shipping)}:</td><td class="value">${safeText(
                  shippingStr,
                )}</td></tr>`
              : ''
          }
          ${
            grossStr
              ? `<tr class="total-row"><td class="label">${safeText(
                  t.total,
                )}:</td><td class="value">${safeText(grossStr)}</td></tr>`
              : ''
          }
          ${
            !netStr && !vatStr && !shippingStr && !grossStr
              ? `<tr><td colspan="2" class="muted">${safeText(t.pricingEmpty)}</td></tr>`
              : ''
          }
        </tbody>
      </table>
    </div>

    <div class="section-title">${safeText(t.notes)}</div>
    <div class="box">
      <div class="muted" style="font-size: 10px; line-height: 1.4;">
        ${safeText(t.notesLegal(validUntilStr, siteName))}
      </div>
      ${
        (ctx as any).admin_notes
          ? `<div class="text-block" style="margin-top: 8px; border-top: 1px dashed #d0d0d0; padding-top: 6px; font-size: 10px;">
              ${safeText((ctx as any).admin_notes)}
            </div>`
          : ''
      }
    </div>

    <div class="footer">
      <div>${safeText(t.footerLeft(siteName))}</div>
      <div>${safeText(t.footerRight)}</div>
    </div>
  </div>
</body>
</html>`;
}
