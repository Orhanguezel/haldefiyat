import type { RouteHandler } from "fastify";

import { setContentRange } from "@agro/shared-backend/modules/_shared";

import {
  createOffer,
  deleteOffer,
  getOfferById,
  listOffers,
  packFormData,
  updateOffer,
} from "./repository";
import { generateAndSendOffer, generateOfferDocument, sendOfferEmail } from "./service";
import {
  offerIdParamsSchema,
  offerListQuerySchema,
  patchOfferAdminBodySchema,
  upsertOfferAdminBodySchema,
} from "./validation";

const toDecimalStrOrNull = (v: number | string | null | undefined): string | null => {
  if (typeof v === "number" && !Number.isNaN(v)) return v.toFixed(2);
  if (typeof v === "string" && v.trim() !== "") return v;
  return null;
};

export const listOffersAdmin: RouteHandler = async (req, reply) => {
  const parsed = offerListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_query", issues: parsed.error.flatten() } });
  }

  const q = parsed.data;
  const { items, total } = await listOffers(q);
  const offset = q.offset ?? 0;
  const limit = q.limit ?? items.length ?? 0;
  setContentRange(reply, offset, limit, total);
  reply.header("x-total-count", String(total ?? 0));
  return reply.send(items);
};

export const getOfferAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {});
  const row = await getOfferById(id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

export const createOfferAdmin: RouteHandler = async (req, reply) => {
  const parsed = upsertOfferAdminBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }

  const b = parsed.data;
  const id = await createOffer({
    offer_no: typeof b.offer_no === "string" ? b.offer_no.trim() || null : null,
    status: b.status ?? "new",
    source: b.source ?? "vistaseed",
    locale: b.locale ?? null,
    country_code: b.country_code ?? null,
    customer_name: b.customer_name.trim(),
    company_name: b.company_name ?? null,
    email: b.email.toLowerCase(),
    phone: b.phone ?? null,
    subject: b.subject ?? null,
    message: b.message ?? null,
    product_id: b.product_id ?? null,
    service_id: b.service_id ?? null,
    form_data: packFormData(b.form_data),
    consent_marketing: b.consent_marketing === true || b.consent_marketing === 1 || b.consent_marketing === "1" || b.consent_marketing === "true" ? 1 : 0,
    consent_terms: b.consent_terms === true || b.consent_terms === 1 || b.consent_terms === "1" || b.consent_terms === "true" ? 1 : 0,
    currency: b.currency ?? "EUR",
    net_total: toDecimalStrOrNull(b.net_total),
    vat_rate: toDecimalStrOrNull(b.vat_rate),
    vat_total: toDecimalStrOrNull(b.vat_total),
    shipping_total: toDecimalStrOrNull(b.shipping_total),
    gross_total: toDecimalStrOrNull(b.gross_total),
    valid_until: typeof b.valid_until === "string" ? (new Date(b.valid_until) as never) : null,
    admin_notes: b.admin_notes ?? null,
    pdf_url: b.pdf_url ?? null,
    pdf_asset_id: b.pdf_asset_id ?? null,
    email_sent_at: typeof b.email_sent_at === "string" ? (new Date(b.email_sent_at) as never) : null,
  });

  const row = await getOfferById(id);
  return reply.code(201).send(row);
};

export const updateOfferAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {});
  const parsed = patchOfferAdminBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
  }

  const b = parsed.data;
  const patch: Record<string, unknown> = {};
  if (typeof b.offer_no !== "undefined") patch.offer_no = b.offer_no ?? null;
  if (typeof b.status !== "undefined") patch.status = b.status;
  if (typeof b.source !== "undefined") patch.source = b.source;
  if (typeof b.locale !== "undefined") patch.locale = b.locale ?? null;
  if (typeof b.country_code !== "undefined") patch.country_code = b.country_code ?? null;
  if (typeof b.customer_name === "string") patch.customer_name = b.customer_name.trim();
  if (typeof b.company_name !== "undefined") patch.company_name = b.company_name ?? null;
  if (typeof b.email === "string") patch.email = b.email.toLowerCase();
  if (typeof b.phone !== "undefined") patch.phone = b.phone ?? null;
  if (typeof b.subject !== "undefined") patch.subject = b.subject ?? null;
  if (typeof b.message !== "undefined") patch.message = b.message ?? null;
  if (typeof b.product_id !== "undefined") patch.product_id = b.product_id ?? null;
  if (typeof b.service_id !== "undefined") patch.service_id = b.service_id ?? null;
  if (typeof b.form_data !== "undefined") patch.form_data = packFormData(b.form_data);
  if (typeof b.consent_marketing !== "undefined") patch.consent_marketing = b.consent_marketing === true || b.consent_marketing === 1 || b.consent_marketing === "1" || b.consent_marketing === "true" ? 1 : 0;
  if (typeof b.consent_terms !== "undefined") patch.consent_terms = b.consent_terms === true || b.consent_terms === 1 || b.consent_terms === "1" || b.consent_terms === "true" ? 1 : 0;
  if (typeof b.currency !== "undefined") patch.currency = b.currency ?? "EUR";
  if (typeof b.net_total !== "undefined") patch.net_total = toDecimalStrOrNull(b.net_total);
  if (typeof b.vat_rate !== "undefined") patch.vat_rate = toDecimalStrOrNull(b.vat_rate);
  if (typeof b.vat_total !== "undefined") patch.vat_total = toDecimalStrOrNull(b.vat_total);
  if (typeof b.shipping_total !== "undefined") patch.shipping_total = toDecimalStrOrNull(b.shipping_total);
  if (typeof b.gross_total !== "undefined") patch.gross_total = toDecimalStrOrNull(b.gross_total);
  if (typeof b.valid_until !== "undefined") patch.valid_until = typeof b.valid_until === "string" ? (new Date(b.valid_until) as never) : null;
  if (typeof b.admin_notes !== "undefined") patch.admin_notes = b.admin_notes ?? null;
  if (typeof b.pdf_url !== "undefined") patch.pdf_url = b.pdf_url ?? null;
  if (typeof b.pdf_asset_id !== "undefined") patch.pdf_asset_id = b.pdf_asset_id ?? null;
  if (typeof b.email_sent_at !== "undefined") patch.email_sent_at = typeof b.email_sent_at === "string" ? (new Date(b.email_sent_at) as never) : null;

  await updateOffer(id, patch);
  const row = await getOfferById(id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

export const removeOfferAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {});
  const affected = await deleteOffer(id);
  if (!affected) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.code(204).send();
};

export const generateOfferPdfAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {});
  const row = await generateOfferDocument(id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

export const sendOfferEmailAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {});
  const row = await sendOfferEmail(id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};

export const sendOfferAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {});
  const row = await generateAndSendOffer(id);
  if (!row) return reply.code(404).send({ error: { message: "not_found" } });
  return reply.send(row);
};
