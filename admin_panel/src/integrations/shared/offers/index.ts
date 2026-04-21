export const OFFERS_ADMIN_BASE = "/admin/offers";
export const OFFER_STATUSES = ["new", "in_review", "quoted", "sent", "accepted", "rejected", "cancelled"] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export type OfferDto = {
  id: string;
  offer_no: string | null;
  status: OfferStatus;
  source?: string | null;
  locale: string | null;
  country_code: string | null;
  customer_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string | null;
  product_id: string | null;
  service_id: string | null;
  form_data?: Record<string, unknown> | null;
  form_data_parsed?: Record<string, unknown> | null;
  consent_marketing: boolean | number | null;
  consent_terms: boolean | number | null;
  currency: string | null;
  net_total: number | string | null;
  vat_rate: number | string | null;
  vat_total: number | string | null;
  shipping_total: number | string | null;
  gross_total: number | string | null;
  valid_until: string | null;
  admin_notes: string | null;
  pdf_url: string | null;
  pdf_asset_id: string | null;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OfferListQueryParams = {
  q?: string;
  status?: OfferStatus;
  source?: string;
  locale?: string;
  country_code?: string;
  email?: string;
  product_id?: string;
  created_from?: string;
  created_to?: string;
  sort?: "created_at" | "updated_at";
  orderDir?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export type OfferCreatePayload = {
  source?: string;
  locale?: string | null;
  country_code?: string | null;
  customer_name: string;
  company_name?: string | null;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message?: string | null;
  product_id?: string | null;
  service_id?: string | null;
  form_data?: Record<string, unknown>;
  consent_marketing?: boolean;
  consent_terms?: boolean;
  status?: OfferStatus;
  currency?: string;
  net_total?: number | null;
  vat_rate?: number | null;
  vat_total?: number | null;
  shipping_total?: number | null;
  gross_total?: number | null;
  offer_no?: string | null;
  valid_until?: string | null;
  admin_notes?: string | null;
  pdf_url?: string | null;
  pdf_asset_id?: string | null;
  email_sent_at?: string | null;
};

export type OfferUpdatePayload = Partial<OfferCreatePayload>;

export type OfferDetailTabKey = "customer" | "pricing" | "meta" | "json";

export type OfferDetailFormState = {
  source: string;
  locale: string;
  country_code: string;
  customer_name: string;
  company_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  product_id: string;
  service_id: string;
  form_data_text: string;
  consent_marketing: boolean;
  consent_terms: boolean;
  status: OfferStatus;
  currency: string;
  net_total: string;
  vat_rate: string;
  vat_total: string;
  shipping_total: string;
  gross_total: string;
  offer_no: string;
  valid_until: string;
  admin_notes: string;
  pdf_url: string;
  pdf_asset_id: string;
  email_sent_at: string;
};

function toStr(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function toNumberOrNull(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

export function buildOffersListQueryParams(opts: { q?: string; status?: OfferStatus | "" }): OfferListQueryParams {
  return {
    q: opts.q?.trim() || undefined,
    status: opts.status || undefined,
    sort: "created_at",
    orderDir: "desc",
    limit: 100,
    offset: 0,
  };
}

export function createEmptyOfferDetailForm(): OfferDetailFormState {
  return {
    source: "vistaseeds",
    locale: "tr",
    country_code: "",
    customer_name: "",
    company_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    product_id: "",
    service_id: "",
    form_data_text: "{}",
    consent_marketing: false,
    consent_terms: false,
    status: "new",
    currency: "EUR",
    net_total: "",
    vat_rate: "",
    vat_total: "",
    shipping_total: "",
    gross_total: "",
    offer_no: "",
    valid_until: "",
    admin_notes: "",
    pdf_url: "",
    pdf_asset_id: "",
    email_sent_at: "",
  };
}

export function mapOfferToDetailForm(dto: OfferDto): OfferDetailFormState {
  const formData = dto.form_data_parsed ?? dto.form_data ?? {};

  return {
    source: toStr(dto.source || "vistaseeds"),
    locale: toStr(dto.locale || "tr"),
    country_code: toStr(dto.country_code),
    customer_name: toStr(dto.customer_name),
    company_name: toStr(dto.company_name),
    email: toStr(dto.email),
    phone: toStr(dto.phone),
    subject: toStr(dto.subject),
    message: toStr(dto.message),
    product_id: toStr(dto.product_id),
    service_id: toStr(dto.service_id),
    form_data_text: JSON.stringify(formData, null, 2),
    consent_marketing: toBool(dto.consent_marketing),
    consent_terms: toBool(dto.consent_terms),
    status: dto.status || "new",
    currency: toStr(dto.currency || "EUR"),
    net_total: toStr(dto.net_total),
    vat_rate: toStr(dto.vat_rate),
    vat_total: toStr(dto.vat_total),
    shipping_total: toStr(dto.shipping_total),
    gross_total: toStr(dto.gross_total),
    offer_no: toStr(dto.offer_no),
    valid_until: toStr(dto.valid_until).slice(0, 10),
    admin_notes: toStr(dto.admin_notes),
    pdf_url: toStr(dto.pdf_url),
    pdf_asset_id: toStr(dto.pdf_asset_id),
    email_sent_at: toStr(dto.email_sent_at),
  };
}

export function buildOfferPayload(formData: OfferDetailFormState): OfferCreatePayload {
  let parsedFormData: Record<string, unknown> = {};

  try {
    const parsed = JSON.parse(formData.form_data_text || "{}");
    parsedFormData = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    parsedFormData = {};
  }

  return {
    source: formData.source.trim() || "vistaseeds",
    locale: formData.locale.trim() || null,
    country_code: formData.country_code.trim() || null,
    customer_name: formData.customer_name.trim(),
    company_name: formData.company_name.trim() || null,
    email: formData.email.trim(),
    phone: formData.phone.trim() || null,
    subject: formData.subject.trim() || null,
    message: formData.message.trim() || null,
    product_id: formData.product_id.trim() || null,
    service_id: formData.service_id.trim() || null,
    form_data: parsedFormData,
    consent_marketing: formData.consent_marketing,
    consent_terms: formData.consent_terms,
    status: formData.status,
    currency: formData.currency.trim() || "EUR",
    net_total: toNumberOrNull(formData.net_total),
    vat_rate: toNumberOrNull(formData.vat_rate),
    vat_total: toNumberOrNull(formData.vat_total),
    shipping_total: toNumberOrNull(formData.shipping_total),
    gross_total: toNumberOrNull(formData.gross_total),
    offer_no: formData.offer_no.trim() || null,
    valid_until: formData.valid_until.trim() || null,
    admin_notes: formData.admin_notes.trim() || null,
    pdf_url: formData.pdf_url.trim() || null,
    pdf_asset_id: formData.pdf_asset_id.trim() || null,
    email_sent_at: formData.email_sent_at.trim() || null,
  };
}
