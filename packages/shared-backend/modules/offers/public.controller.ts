import type { FastifyReply, FastifyRequest } from "fastify";
import { handleRouteError } from "@agro/shared-backend/modules/_shared";

import { createOffer, packFormData } from "./repository";
import { publicOfferCreateSchema } from "./validation";

const SUBJECT_PUBLIC_BULK = "Toplu satış / kooperatif talebi";

function marketingFlag(v: unknown): 0 | 1 {
  return v === true || v === 1 || v === "1" || v === "true" ? 1 : 0;
}

export async function createPublicOffer(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = publicOfferCreateSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: "invalid_body", issues: parsed.error.flatten() } });
    }
    const b = parsed.data;
    if (b.website && b.website.trim().length > 0) {
      return reply.send({ ok: true });
    }

    const form_data = {
      org_type: b.org_type ?? null,
      city: b.city ?? null,
      region: b.region ?? null,
      estimated_volume: b.estimated_volume ?? null,
      page: b.source,
    };

    const id = await createOffer({
      status: "new",
      source: b.source,
      locale: b.locale ?? null,
      country_code: b.country_code ?? null,
      customer_name: b.customer_name,
      company_name: b.company_name ?? null,
      email: b.email.toLowerCase().trim(),
      phone: b.phone ?? null,
      subject: SUBJECT_PUBLIC_BULK,
      message: b.message,
      product_id: null,
      service_id: null,
      form_data: packFormData(form_data),
      consent_marketing: marketingFlag(b.consent_marketing),
      consent_terms: 1,
      currency: "TRY",
      net_total: null,
      vat_rate: null,
      vat_total: null,
      shipping_total: null,
      gross_total: null,
      valid_until: null,
      admin_notes: null,
      pdf_url: null,
      pdf_asset_id: null,
      email_sent_at: null,
      offer_no: null,
    });

    return reply.code(201).send({ success: true, id });
  } catch (e) {
    return handleRouteError(reply, req, e, "public_offer_create_failed");
  }
}
