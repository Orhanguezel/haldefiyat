// =============================================================
// FILE: src/modules/products/admin.faqs.controller.ts
// =============================================================
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { and, asc, eq, or, isNull } from 'drizzle-orm';

import { db } from '../../db/client';
import { products, productFaqs } from './schema';
import { productFaqCreateSchema, productFaqUpdateSchema } from './validation';

// ✅ single source
import { getEffectiveLocale, normalizeLocale } from './i18n';

const now = () => new Date();

function toBool(v: unknown): boolean {
  const s = String(v ?? '').toLowerCase();
  return s === '1' || s === 'true';
}

function andOrSingle<T>(conds: T[]) {
  // @ts-expect-error drizzle types
  return conds.length > 1 ? and(...conds) : conds[0];
}

/* ----------------- LIST ----------------- */
export const adminListProductFaqs: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const q = (req.query || {}) as { only_active?: string | number | boolean };

  const locale = getEffectiveLocale(req);

  const conds: any[] = [eq(productFaqs.product_id, id)];

  // Locale'e göre filtrele + eski NULL kayıtları da göster
  conds.push(or(eq(productFaqs.locale, locale), isNull(productFaqs.locale as any)));

  if (q.only_active !== undefined) {
    conds.push(eq(productFaqs.is_active, toBool(q.only_active) as any));
  }

  const rows = await db
    .select()
    .from(productFaqs)
    .where(andOrSingle(conds))
    .orderBy(asc(productFaqs.display_order));

  return reply.send(rows);
};

/* ----------------- CREATE ----------------- */
export const adminCreateProductFaq: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const locale = getEffectiveLocale(req);

  try {
    const [p] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!p) {
      return reply.code(404).send({ error: { message: 'product_not_found' } });
    }

    const bodyParsed = productFaqCreateSchema.parse({
      ...(req.body || {}),
      product_id: id,
      locale,
    });

    const row = {
      ...bodyParsed,
      locale: normalizeLocale(bodyParsed.locale) || locale,
      is_active: bodyParsed.is_active === undefined ? true : toBool(bodyParsed.is_active),
      id: bodyParsed.id ?? randomUUID(),
      created_at: now(),
      updated_at: now(),
    } as any;

    await db.insert(productFaqs).values(row);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

/* ----------------- UPDATE ----------------- */
export const adminUpdateProductFaq: RouteHandler = async (req, reply) => {
  const { id, faqId } = req.params as { id: string; faqId: string };

  try {
    const parsed = productFaqUpdateSchema.parse({ ...(req.body || {}), product_id: id });

    const patchClean: Record<string, unknown> = {};
    if (parsed.question !== undefined) patchClean.question = parsed.question;
    if (parsed.answer !== undefined) patchClean.answer = parsed.answer;
    if (parsed.display_order !== undefined) patchClean.display_order = parsed.display_order;
    if (parsed.is_active !== undefined) patchClean.is_active = toBool(parsed.is_active);
    if (parsed.locale !== undefined) patchClean.locale = normalizeLocale(parsed.locale);

    patchClean.updated_at = now();

    await db
      .update(productFaqs)
      .set(patchClean as any)
      .where(and(eq(productFaqs.id, faqId), eq(productFaqs.product_id, id)));

    const [row] = await db.select().from(productFaqs).where(eq(productFaqs.id, faqId)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(row);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

/* ----------------- TOGGLE ACTIVE ----------------- */
export const adminToggleFaqActive: RouteHandler = async (req, reply) => {
  const { id, faqId } = req.params as { id: string; faqId: string };
  const v = toBool((req.body as any)?.is_active);

  await db
    .update(productFaqs)
    .set({ is_active: v, updated_at: now() } as any)
    .where(and(eq(productFaqs.id, faqId), eq(productFaqs.product_id, id)));

  const [row] = await db.select().from(productFaqs).where(eq(productFaqs.id, faqId)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(row);
};

/* ----------------- DELETE ----------------- */
export const adminDeleteProductFaq: RouteHandler = async (req, reply) => {
  const { id, faqId } = req.params as { id: string; faqId: string };

  await db
    .delete(productFaqs)
    .where(and(eq(productFaqs.id, faqId), eq(productFaqs.product_id, id)));

  return reply.send({ ok: true });
};

/* ----------------- REPLACE (product + locale bazlı) ----------------- */
export const adminReplaceFaqs: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const locale = getEffectiveLocale(req);

  try {
    const raw = (req.body as any) || {};
    const items: any[] = Array.isArray(raw.faqs)
      ? raw.faqs
      : Array.isArray(raw.items)
      ? raw.items
      : [];

    await db
      .delete(productFaqs)
      .where(
        and(
          eq(productFaqs.product_id, id),
          or(eq(productFaqs.locale, locale), isNull(productFaqs.locale as any)),
        ),
      );

    for (const it of items) {
      const v = productFaqCreateSchema.parse({ ...it, product_id: id, locale });

      await db.insert(productFaqs).values({
        ...v,
        locale: normalizeLocale(v.locale) || locale,
        is_active: v.is_active === undefined ? true : toBool(v.is_active),
        id: v.id ?? randomUUID(),
        created_at: now(),
        updated_at: now(),
      } as any);
    }

    const rows = await db
      .select()
      .from(productFaqs)
      .where(and(eq(productFaqs.product_id, id), eq(productFaqs.locale, locale)))
      .orderBy(asc(productFaqs.display_order));

    return reply.send(rows);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};
