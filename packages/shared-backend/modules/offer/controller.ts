// =============================================================
// FILE: src/modules/offer/controller.ts  (PUBLIC)
// Bereket Fide – Offer Module Public Controller
//   - POST /offers : yeni teklif talebi oluşturur
// =============================================================

import type { RouteHandler } from 'fastify';
import { offerRequestBodySchema, type OfferRequestBody } from '@agro/shared-backend/modules/offer';
import { createOffer, getOfferById, packFormData } from './repository';
import { triggerNewOfferNotifications } from './service';

/** POST /offers – Public offer request */
export const createOfferPublic: RouteHandler = async (req, reply) => {
  const parsed = offerRequestBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: {
        message: 'invalid_body',
        issues: parsed.error.flatten(),
      },
    });
  }

  const b = parsed.data as OfferRequestBody;

  // ✅ country_code serbest metin: trim normalize
  const country_code =
    typeof b.country_code === 'string' && b.country_code.trim() ? b.country_code.trim() : null;

  try {
    const id = await createOffer({
      customer_name: b.customer_name.trim(),
      company_name:
        typeof b.company_name === 'string' ? b.company_name.trim() : b.company_name ?? null,
      email: b.email.toLowerCase(),
      phone: typeof b.phone === 'string' ? b.phone.trim() : b.phone ?? null,
      subject: typeof b.subject === 'string' ? b.subject.trim() : b.subject ?? null,
      message: typeof b.message === 'string' ? b.message.trim() : b.message ?? null,
      source: b.source ?? 'bereketfide',
      locale: b.locale ?? (req as any).locale ?? null,
      country_code,
      product_id: b.product_id ?? null,
      form_data: packFormData(b.form_data),

      consent_marketing:
        b.consent_marketing === true ||
        b.consent_marketing === 1 ||
        b.consent_marketing === '1' ||
        b.consent_marketing === 'true'
          ? (1 as any)
          : (0 as any),
      consent_terms:
        b.consent_terms === true ||
        b.consent_terms === 1 ||
        b.consent_terms === '1' ||
        b.consent_terms === 'true'
          ? (1 as any)
          : (0 as any),

      currency: 'EUR',
      net_total: null,
      vat_total: null,
      gross_total: null,
      valid_until: null,
      admin_notes: null,
      pdf_url: null,
      pdf_asset_id: null,
      email_sent_at: null,
      status: 'new',
    });

    const row = await getOfferById(id);

    if (row) {
      try {
        await triggerNewOfferNotifications(row);
      } catch (err: any) {
        (req as any).log?.error({ err }, 'offer_public_notification_failed');
      }
    }

    return reply.code(201).send(row);
  } catch (err: any) {
    (req as any).log?.error({ err }, 'offer_create_public_failed');
    return reply.code(500).send({ error: { message: 'offer_create_public_failed' } });
  }
};
