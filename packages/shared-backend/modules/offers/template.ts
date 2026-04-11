import type { OfferRow } from "./schema";

type LabelLocale = "tr" | "en";

const LABELS: Record<
  LabelLocale,
  {
    title: string;
    subtitle: string;
    offerNo: string;
    createdAt: string;
    validUntil: string;
    status: string;
    customerInfo: string;
    customerName: string;
    companyName: string;
    email: string;
    phone: string;
    country: string;
    locale: string;
    subject: string;
    message: string;
    noMessage: string;
    pricing: string;
    netTotal: string;
    vatRate: string;
    vatTotal: string;
    shippingTotal: string;
    grossTotal: string;
    pricingEmpty: string;
    formData: string;
    noFormData: string;
    notes: string;
    footerLeft: string;
    footerRight: string;
  }
> = {
  tr: {
    title: "VistaSeed",
    subtitle: "Resmi Teklif Dokumani",
    offerNo: "Teklif No",
    createdAt: "Tarih",
    validUntil: "Gecerlilik",
    status: "Durum",
    customerInfo: "Musteri Bilgileri",
    customerName: "Ad Soyad",
    companyName: "Firma",
    email: "E-posta",
    phone: "Telefon",
    country: "Ulke / Bolge",
    locale: "Form Dili",
    subject: "Konu",
    message: "Talep Ozeti",
    noMessage: "Musteri tarafindan ek bir aciklama paylasilmadi.",
    pricing: "Fiyatlandirma",
    netTotal: "Net Tutar",
    vatRate: "KDV Orani",
    vatTotal: "KDV Tutari",
    shippingTotal: "Lojistik / Nakliye",
    grossTotal: "Genel Toplam",
    pricingEmpty: "Bu kayitta fiyatlandirma bilgisi henuz tamamlanmamistir.",
    formData: "Talep Formu Detaylari",
    noFormData: "Ek form verisi bulunmuyor.",
    notes: "Notlar",
    footerLeft: "VistaSeed Kurumsal Teklif Sistemi",
    footerRight: "Bu belge sistem tarafindan otomatik uretilmistir.",
  },
  en: {
    title: "VistaSeed",
    subtitle: "Official Offer Document",
    offerNo: "Offer No",
    createdAt: "Date",
    validUntil: "Valid Until",
    status: "Status",
    customerInfo: "Customer Information",
    customerName: "Name",
    companyName: "Company",
    email: "Email",
    phone: "Phone",
    country: "Country / Region",
    locale: "Form Locale",
    subject: "Subject",
    message: "Request Summary",
    noMessage: "No additional customer note has been provided.",
    pricing: "Pricing",
    netTotal: "Net Amount",
    vatRate: "VAT Rate",
    vatTotal: "VAT Amount",
    shippingTotal: "Shipping / Logistics",
    grossTotal: "Grand Total",
    pricingEmpty: "Pricing has not been completed for this record yet.",
    formData: "Request Form Details",
    noFormData: "No extra form data is available.",
    notes: "Notes",
    footerLeft: "VistaSeed Corporate Offer System",
    footerRight: "This document has been generated automatically by the system.",
  },
};

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pickLocale(rawLocale: string | null | undefined): LabelLocale {
  return String(rawLocale || "").toLowerCase().startsWith("en") ? "en" : "tr";
}

function formatDate(value: Date | string | null | undefined, locale: LabelLocale): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const tag = locale === "tr" ? "tr-TR" : "en-US";
  return date.toLocaleDateString(tag, { year: "numeric", month: "2-digit", day: "2-digit" });
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function formatMoney(value: unknown, currency: string | null | undefined, locale: LabelLocale): string {
  const num = toNumber(value);
  if (num == null) return "-";
  const tag = locale === "tr" ? "tr-TR" : "en-US";
  const safeCurrency = (currency || "EUR").toUpperCase();

  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${num.toFixed(2)} ${safeCurrency}`;
  }
}

function stringifyValue(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function renderOfferDocumentHtml(offer: OfferRow & { form_data_parsed?: Record<string, unknown> | null }) {
  const locale = pickLocale(offer.locale);
  const t = LABELS[locale];
  const formData = offer.form_data_parsed || {};
  const hasPricing =
    offer.net_total != null || offer.vat_total != null || offer.shipping_total != null || offer.gross_total != null;
  const pricingRows = [
    [t.netTotal, formatMoney(offer.net_total, offer.currency, locale)],
    [t.vatRate, offer.vat_rate != null ? `${esc(offer.vat_rate)}%` : "-"],
    [t.vatTotal, formatMoney(offer.vat_total, offer.currency, locale)],
    [t.shippingTotal, formatMoney(offer.shipping_total, offer.currency, locale)],
    [t.grossTotal, formatMoney(offer.gross_total, offer.currency, locale)],
  ];

  const formRows = Object.entries(formData)
    .map(
      ([key, value]) => `
        <tr>
          <td class="form-key">${esc(key)}</td>
          <td class="form-value">${esc(stringifyValue(value))}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <title>${esc(t.title)} ${esc(offer.offer_no || offer.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Arial", "Helvetica Neue", sans-serif;
      color: #173025;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.5;
    }
    .page {
      border: 1px solid #dbe5de;
      border-radius: 18px;
      overflow: hidden;
      background: #fff;
    }
    .hero {
      padding: 28px 32px 24px;
      background: linear-gradient(135deg, #f6fbf7 0%, #ebf5ee 55%, #dceee2 100%);
      border-bottom: 1px solid #d7e6da;
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }
    .brand {
      max-width: 60%;
    }
    .brand-mark {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 999px;
      background: #1f6b45;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .brand-title {
      margin: 0;
      font-size: 30px;
      line-height: 1.1;
      font-weight: 800;
      color: #143524;
    }
    .brand-subtitle {
      margin: 8px 0 0;
      font-size: 14px;
      color: #456758;
    }
    .offer-badge {
      min-width: 240px;
      padding: 16px 18px;
      border-radius: 16px;
      background: rgba(255,255,255,0.8);
      border: 1px solid #d3e3d7;
    }
    .offer-badge-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 8px;
    }
    .offer-badge-row:first-child { margin-top: 0; }
    .offer-badge-label {
      color: #5d7869;
      font-weight: 600;
    }
    .offer-badge-value {
      color: #173025;
      font-weight: 700;
      text-align: right;
    }
    .body {
      padding: 28px 32px 32px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 20px;
      align-items: start;
    }
    .card {
      border: 1px solid #dbe5de;
      border-radius: 16px;
      padding: 18px 18px 16px;
      background: #fff;
    }
    .section-title {
      margin: 0 0 14px;
      font-size: 13px;
      letter-spacing: 0.08em;
      font-weight: 800;
      color: #24593d;
      text-transform: uppercase;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 16px;
    }
    .info-item-label {
      font-size: 11px;
      color: #678171;
      margin-bottom: 4px;
    }
    .info-item-value {
      font-size: 13px;
      font-weight: 600;
      color: #173025;
      word-break: break-word;
    }
    .summary-box {
      margin-top: 18px;
      padding: 16px;
      border-radius: 14px;
      background: #f7faf8;
      border: 1px solid #e2ebe4;
      white-space: pre-wrap;
    }
    .pricing-table, .form-table {
      width: 100%;
      border-collapse: collapse;
    }
    .pricing-table tr + tr td,
    .form-table tr + tr td {
      border-top: 1px solid #e7eeea;
    }
    .pricing-label, .form-key {
      padding: 10px 0;
      color: #56705f;
      font-weight: 600;
      width: 44%;
      vertical-align: top;
    }
    .pricing-value, .form-value {
      padding: 10px 0;
      text-align: right;
      color: #173025;
      font-weight: 700;
      vertical-align: top;
    }
    .pricing-total td {
      padding-top: 14px;
      font-size: 14px;
      color: #0f2a1d;
      border-top: 2px solid #cddccf !important;
    }
    .empty {
      color: #708878;
      font-style: italic;
    }
    .notes {
      margin-top: 20px;
      padding: 18px;
      border-radius: 16px;
      background: #f7f9f8;
      border: 1px solid #e3ebe5;
      white-space: pre-wrap;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid #dbe5de;
      color: #6e8577;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <div class="hero-top">
        <div class="brand">
          <div class="brand-mark">${esc(t.subtitle)}</div>
          <h1 class="brand-title">${esc(t.title)}</h1>
          <p class="brand-subtitle">${esc(offer.subject || t.subtitle)}</p>
        </div>
        <div class="offer-badge">
          <div class="offer-badge-row">
            <div class="offer-badge-label">${esc(t.offerNo)}</div>
            <div class="offer-badge-value">${esc(offer.offer_no || offer.id)}</div>
          </div>
          <div class="offer-badge-row">
            <div class="offer-badge-label">${esc(t.createdAt)}</div>
            <div class="offer-badge-value">${esc(formatDate(offer.created_at, locale))}</div>
          </div>
          <div class="offer-badge-row">
            <div class="offer-badge-label">${esc(t.validUntil)}</div>
            <div class="offer-badge-value">${esc(formatDate(offer.valid_until, locale))}</div>
          </div>
          <div class="offer-badge-row">
            <div class="offer-badge-label">${esc(t.status)}</div>
            <div class="offer-badge-value">${esc(offer.status)}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="body">
      <div class="grid">
        <div>
          <div class="card">
            <h2 class="section-title">${esc(t.customerInfo)}</h2>
            <div class="info-grid">
              <div>
                <div class="info-item-label">${esc(t.customerName)}</div>
                <div class="info-item-value">${esc(offer.customer_name || "-")}</div>
              </div>
              <div>
                <div class="info-item-label">${esc(t.companyName)}</div>
                <div class="info-item-value">${esc(offer.company_name || "-")}</div>
              </div>
              <div>
                <div class="info-item-label">${esc(t.email)}</div>
                <div class="info-item-value">${esc(offer.email || "-")}</div>
              </div>
              <div>
                <div class="info-item-label">${esc(t.phone)}</div>
                <div class="info-item-value">${esc(offer.phone || "-")}</div>
              </div>
              <div>
                <div class="info-item-label">${esc(t.country)}</div>
                <div class="info-item-value">${esc(offer.country_code || "-")}</div>
              </div>
              <div>
                <div class="info-item-label">${esc(t.locale)}</div>
                <div class="info-item-value">${esc(offer.locale || "-")}</div>
              </div>
            </div>

            <div class="summary-box">
              <strong>${esc(t.subject)}:</strong> ${esc(offer.subject || "-")}

              <br /><br />
              <strong>${esc(t.message)}:</strong>
              <br />
              ${esc(offer.message || t.noMessage)}
            </div>
          </div>

          <div class="card" style="margin-top: 20px;">
            <h2 class="section-title">${esc(t.formData)}</h2>
            ${
              formRows
                ? `<table class="form-table">${formRows}</table>`
                : `<div class="empty">${esc(t.noFormData)}</div>`
            }
          </div>
        </div>

        <div>
          <div class="card">
            <h2 class="section-title">${esc(t.pricing)}</h2>
            ${
              hasPricing
                ? `<table class="pricing-table">
                    ${pricingRows
                      .map(
                        ([label, value], index) => `
                      <tr class="${index === pricingRows.length - 1 ? "pricing-total" : ""}">
                        <td class="pricing-label">${esc(label)}</td>
                        <td class="pricing-value">${esc(value)}</td>
                      </tr>`,
                      )
                      .join("")}
                  </table>`
                : `<div class="empty">${esc(t.pricingEmpty)}</div>`
            }
          </div>

          <div class="notes">
            <strong>${esc(t.notes)}</strong>
            <br /><br />
            ${esc(offer.admin_notes || "-")}
          </div>
        </div>
      </div>

      <div class="footer">
        <div>${esc(t.footerLeft)}</div>
        <div>${esc(t.footerRight)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
