// =============================================================
// FILE: src/modules/offer/admin.controller.ts
// Bereket Fide – Offer Module Admin Controller
//   - LIST / GET / CREATE / UPDATE / DELETE
//   - SEND: PDF üret + mail + notification (service.ts hook)
// =============================================================

import type { RouteHandler } from 'fastify';
import {
  offerListQuerySchema,
  upsertOfferAdminBodySchema,
  patchOfferAdminBodySchema,
  type OfferListQuery,
  type UpsertOfferAdminBody,
  type PatchOfferAdminBody,
  offerIdParamsSchema,
  type OfferIdParams,
} from '@agro/shared-backend/modules/offer';
import {
  listOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  packFormData,
} from './repository';
import {
  generateAndAttachOfferPdf,
  sendOfferEmailsAndNotifications,
  sendOfferEmailOnly,
  triggerNewOfferNotifications,
} from './service';
import { setContentRange } from '../_shared';

/* -------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------- */

const toDecimalStrOrNull = (v: number | string | null | undefined): string | null => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v.toFixed(2);
  if (typeof v === 'string' && v.trim() !== '') return v;
  return null;
};

const readForceFlag = (req: any): boolean => {
  const qForce = req?.query?.force;
  const bForce = req?.body?.force;

  return (
    qForce === '1' ||
    qForce === 1 ||
    qForce === true ||
    qForce === 'true' ||
    bForce === '1' ||
    bForce === 1 ||
    bForce === true ||
    bForce === 'true'
  );
};

/* -------------------------------------------------------------
 * LIST (admin)
 * ------------------------------------------------------------- */

export const listOffersAdmin: RouteHandler = async (req, reply) => {
  const parsed = offerListQuerySchema.safeParse(req.query ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_query', issues: parsed.error.flatten() },
    });
  }

  const q = parsed.data as OfferListQuery;

  const { items, total } = await listOffers({
    orderParam: typeof q.order === 'string' ? q.order : undefined,
    sort: q.sort,
    order: q.orderDir,
    limit: q.limit,
    offset: q.offset,
    status: q.status,
    source: q.source,
    locale: q.locale,
    country_code: q.country_code, // ✅ repository LIKE ile arıyor
    q: q.q,
    email: q.email,
    product_id: q.product_id,
    service_id: q.service_id,
    created_from: q.created_from,
    created_to: q.created_to,
  });

  const offset = q.offset ?? 0;
  const limit = q.limit ?? items.length ?? 0;

  setContentRange(reply, offset, limit, total);
  reply.header('x-total-count', String(total ?? 0));
  return reply.send(items);
};

/* -------------------------------------------------------------
 * GET BY ID (admin)
 * ------------------------------------------------------------- */

export const getOfferAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {}) as OfferIdParams;

  const row = await getOfferById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(row);
};

/* -------------------------------------------------------------
 * CREATE (admin)
 * ------------------------------------------------------------- */

export const createOfferAdmin: RouteHandler = async (req, reply) => {
  const parsed = upsertOfferAdminBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.flatten() },
    });
  }

  const b = parsed.data as UpsertOfferAdminBody;

  // ✅ country_code serbest metin: trim normalize
  const country_code =
    typeof b.country_code === 'string' && b.country_code.trim() ? b.country_code.trim() : null;

  try {
    const id = await createOffer({
      status: b.status ?? 'new',
      source: b.source ?? 'bereketfide',
      locale: b.locale ?? (req as any).locale ?? null,
      country_code,
      customer_name: b.customer_name.trim(),
      company_name:
        typeof b.company_name === 'string' ? b.company_name.trim() : b.company_name ?? null,
      email: b.email.toLowerCase(),
      phone: typeof b.phone === 'string' ? b.phone.trim() : b.phone ?? null,
      subject: typeof b.subject === 'string' ? b.subject.trim() : b.subject ?? null,
      message: typeof b.message === 'string' ? b.message.trim() : b.message ?? null,
      product_id: b.product_id ?? null,
      service_id: b.service_id ?? null,
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

      currency: b.currency ?? 'EUR',
      net_total: toDecimalStrOrNull(b.net_total ?? null),
      vat_rate: toDecimalStrOrNull(b.vat_rate ?? null),
      vat_total: toDecimalStrOrNull(b.vat_total ?? null),
      shipping_total: toDecimalStrOrNull(b.shipping_total ?? null),
      gross_total: toDecimalStrOrNull(b.gross_total ?? null),

      valid_until: typeof b.valid_until === 'string' ? (new Date(b.valid_until) as any) : null,

      admin_notes: typeof b.admin_notes === 'string' ? b.admin_notes : b.admin_notes ?? null,

      pdf_url: typeof b.pdf_url === 'string' ? b.pdf_url : b.pdf_url ?? null,
      pdf_asset_id: typeof b.pdf_asset_id === 'string' ? b.pdf_asset_id : b.pdf_asset_id ?? null,

      email_sent_at:
        typeof b.email_sent_at === 'string' ? (new Date(b.email_sent_at) as any) : null,

      offer_no: typeof b.offer_no === 'string' ? b.offer_no.trim() : undefined,
    });

    const row = await getOfferById(id);
    if (row) {
      try {
        await triggerNewOfferNotifications(row as any);
      } catch (err: any) {
        (req as any).log?.error({ err }, 'offer_admin_notification_failed');
      }
    }
    return reply.code(201).send(row);
  } catch (err: any) {
    (req as any).log?.error({ err }, 'offer_create_admin_failed');
    return reply.code(500).send({ error: { message: 'offer_create_admin_failed' } });
  }
};

/* -------------------------------------------------------------
 * UPDATE (admin)
 * ------------------------------------------------------------- */

export const updateOfferAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {}) as OfferIdParams;

  const parsed = patchOfferAdminBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.flatten() },
    });
  }

  const b = parsed.data as PatchOfferAdminBody;

  try {
    const patch: any = {};

    if (typeof b.status !== 'undefined') patch.status = b.status;
    if (typeof b.source !== 'undefined') patch.source = b.source;
    if (typeof b.locale !== 'undefined') patch.locale = b.locale ?? null;

    // ✅ country_code serbest metin: trim normalize
    if (typeof b.country_code !== 'undefined') {
      patch.country_code =
        typeof b.country_code === 'string' && b.country_code.trim() ? b.country_code.trim() : null;
    }

    if (typeof b.customer_name === 'string') patch.customer_name = b.customer_name.trim();
    if (typeof b.company_name !== 'undefined')
      patch.company_name =
        typeof b.company_name === 'string' ? b.company_name.trim() : b.company_name ?? null;

    if (typeof b.email === 'string') patch.email = b.email.toLowerCase();
    if (typeof b.phone !== 'undefined')
      patch.phone = typeof b.phone === 'string' ? b.phone.trim() : b.phone ?? null;

    if (typeof b.subject !== 'undefined')
      patch.subject = typeof b.subject === 'string' ? b.subject.trim() : b.subject ?? null;

    if (typeof b.message !== 'undefined')
      patch.message = typeof b.message === 'string' ? b.message.trim() : b.message ?? null;

    if (typeof b.product_id !== 'undefined') patch.product_id = b.product_id ?? null;
    if (typeof b.service_id !== 'undefined') patch.service_id = b.service_id ?? null;

    if (typeof b.form_data !== 'undefined') patch.form_data = packFormData(b.form_data);

    if (typeof b.consent_marketing !== 'undefined') {
      patch.consent_marketing =
        b.consent_marketing === true ||
        b.consent_marketing === 1 ||
        b.consent_marketing === '1' ||
        b.consent_marketing === 'true'
          ? (1 as any)
          : (0 as any);
    }

    if (typeof b.consent_terms !== 'undefined') {
      patch.consent_terms =
        b.consent_terms === true ||
        b.consent_terms === 1 ||
        b.consent_terms === '1' ||
        b.consent_terms === 'true'
          ? (1 as any)
          : (0 as any);
    }

    if (typeof b.currency !== 'undefined') patch.currency = b.currency ?? 'EUR';

    if (typeof b.net_total !== 'undefined')
      patch.net_total = toDecimalStrOrNull(b.net_total ?? null);
    if (typeof b.vat_rate !== 'undefined') patch.vat_rate = toDecimalStrOrNull(b.vat_rate ?? null);
    if (typeof b.vat_total !== 'undefined')
      patch.vat_total = toDecimalStrOrNull(b.vat_total ?? null);
    if (typeof b.shipping_total !== 'undefined')
      patch.shipping_total = toDecimalStrOrNull(b.shipping_total ?? null);
    if (typeof b.gross_total !== 'undefined')
      patch.gross_total = toDecimalStrOrNull(b.gross_total ?? null);

    if (typeof b.valid_until !== 'undefined') {
      patch.valid_until =
        typeof b.valid_until === 'string' ? (new Date(b.valid_until) as any) : null;
    }

    if (typeof b.admin_notes !== 'undefined') {
      patch.admin_notes = typeof b.admin_notes === 'string' ? b.admin_notes : b.admin_notes ?? null;
    }

    if (typeof b.pdf_url !== 'undefined')
      patch.pdf_url = typeof b.pdf_url === 'string' ? b.pdf_url : b.pdf_url ?? null;

    if (typeof b.pdf_asset_id !== 'undefined')
      patch.pdf_asset_id =
        typeof b.pdf_asset_id === 'string' ? b.pdf_asset_id : b.pdf_asset_id ?? null;

    if (typeof b.email_sent_at !== 'undefined') {
      patch.email_sent_at =
        typeof b.email_sent_at === 'string' ? (new Date(b.email_sent_at) as any) : null;
    }

    if (typeof b.offer_no !== 'undefined') {
      patch.offer_no = typeof b.offer_no === 'string' ? b.offer_no.trim() : b.offer_no ?? null;
    }

    await updateOffer(id, patch);

    const row = await getOfferById(id);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(row);
  } catch (err: any) {
    (req as any).log?.error({ err }, 'offer_update_admin_failed');
    return reply.code(500).send({ error: { message: 'offer_update_admin_failed' } });
  }
};

/* -------------------------------------------------------------
 * DELETE (admin)
 * ------------------------------------------------------------- */

export const removeOfferAdmin: RouteHandler = async (req, reply) => {
  const { id } = offerIdParamsSchema.parse(req.params ?? {}) as OfferIdParams;

  const affected = await deleteOffer(id);
  if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.code(204).send();
};

/* -------------------------------------------------------------
 * SEND (admin) – PDF üret + mail + notification
 * ------------------------------------------------------------- */

export const sendOfferAdmin: RouteHandler = async (req, reply) => {
  const parsedParams = offerIdParamsSchema.safeParse(req.params ?? {});
  if (!parsedParams.success) {
    return reply.code(400).send({
      error: { message: 'invalid_id', issues: parsedParams.error.flatten() },
    });
  }

  const { id } = parsedParams.data;

  const qForce = (req.query as any)?.force;
  const bForce = (req.body as any)?.force;
  const force =
    qForce === '1' ||
    qForce === 1 ||
    qForce === true ||
    qForce === 'true' ||
    bForce === '1' ||
    bForce === 1 ||
    bForce === true ||
    bForce === 'true';

  try {
    const rowBefore = await getOfferById(id);
    if (!rowBefore) return reply.code(404).send({ error: { message: 'not_found' } });

    if (rowBefore.email_sent_at && !force) {
      return reply.code(409).send({
        error: {
          message: 'offer_already_sent',
          detail: 'email_sent_at is already set. Use ?force=1 to resend.',
        },
      });
    }

    const pdfResult = await generateAndAttachOfferPdf(rowBefore);

    if (!pdfResult || !pdfResult.pdf_url) {
      (req as any).log?.error({ pdfResult }, 'generate_and_attach_offer_pdf_return_invalid');
      return reply.code(500).send({ error: { message: 'offer_pdf_generation_failed' } });
    }

    const { pdf_url, pdf_asset_id } = pdfResult;

    const updated = await getOfferById(id);
    if (!updated) return reply.code(404).send({ error: { message: 'not_found' } });

    const mailRes = await sendOfferEmailsAndNotifications(updated, { pdf_url, pdf_asset_id });

    if (!mailRes.customerSent) {
      return reply.code(502).send({
        error: {
          message: 'offer_mail_failed',
          detail: 'Customer mail was not sent (template missing / variables missing / SMTP error).',
        },
      });
    }

    const finalRow = await getOfferById(id);
    return reply.send(finalRow);
  } catch (err: any) {
    (req as any).log?.error({ err }, 'offer_send_admin_failed');
    return reply.code(500).send({
      error: { message: 'offer_send_admin_failed', detail: err?.message ?? 'unknown_error' },
    });
  }
};

/* -------------------------------------------------------------
 * ✅ PDF ONLY (admin) – POST /offers/:id/pdf
 * ------------------------------------------------------------- */
export const generateOfferPdfAdmin: RouteHandler = async (req, reply) => {
  const parsedParams = offerIdParamsSchema.safeParse(req.params ?? {});
  if (!parsedParams.success) {
    return reply.code(400).send({
      error: { message: 'invalid_id', issues: parsedParams.error.flatten() },
    });
  }

  const { id } = parsedParams.data as OfferIdParams;
  const force = readForceFlag(req);

  try {
    const rowBefore = await getOfferById(id);
    if (!rowBefore) return reply.code(404).send({ error: { message: 'not_found' } });

    if (rowBefore.pdf_url && !force) {
      return reply.send(rowBefore);
    }

    const pdfResult = await generateAndAttachOfferPdf(rowBefore);

    if (!pdfResult || !pdfResult.pdf_url) {
      (req as any).log?.error({ pdfResult }, 'offer_pdf_generation_return_invalid');
      return reply.code(500).send({ error: { message: 'offer_pdf_generation_failed' } });
    }

    const finalRow = await getOfferById(id);
    if (!finalRow) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(finalRow);
  } catch (err: any) {
    (req as any).log?.error({ err }, 'offer_pdf_only_admin_failed');
    return reply.code(500).send({
      error: { message: 'offer_pdf_only_admin_failed', detail: err?.message ?? 'unknown_error' },
    });
  }
};

/* -------------------------------------------------------------
 * ✅ EMAIL ONLY (admin) – POST /offers/:id/email
 * ------------------------------------------------------------- */
export const sendOfferEmailAdmin: RouteHandler = async (req, reply) => {
  const parsedParams = offerIdParamsSchema.safeParse(req.params ?? {});
  if (!parsedParams.success) {
    return reply.code(400).send({
      error: { message: 'invalid_id', issues: parsedParams.error.flatten() },
    });
  }

  const { id } = parsedParams.data as OfferIdParams;
  const force = readForceFlag(req);

  try {
    const rowBefore = await getOfferById(id);
    if (!rowBefore) return reply.code(404).send({ error: { message: 'not_found' } });

    if (!rowBefore.pdf_url) {
      return reply.code(400).send({
        error: {
          message: 'pdf_missing',
          detail: 'PDF is missing. Generate PDF first via POST /offers/:id/pdf',
        },
      });
    }

    if (rowBefore.email_sent_at && !force) {
      return reply.code(409).send({
        error: {
          message: 'offer_already_emailed',
          detail: 'email_sent_at is already set. Use ?force=1 to resend.',
        },
      });
    }

    const mailRes = await sendOfferEmailOnly(rowBefore);

    if (!mailRes.customerSent) {
      return reply.code(502).send({
        error: {
          message: 'offer_mail_failed',
          detail: 'Customer mail was not sent (template missing / variables missing / SMTP error).',
        },
      });
    }

    const finalRow = await getOfferById(id);
    if (!finalRow) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(finalRow);
  } catch (err: any) {
    (req as any).log?.error({ err }, 'offer_email_only_admin_failed');
    return reply.code(500).send({
      error: { message: 'offer_email_only_admin_failed', detail: err?.message ?? 'unknown_error' },
    });
  }
};
