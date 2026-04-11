// =============================================================
// FILE: src/modules/products/admin.specs.controller.ts
// =============================================================
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { and, asc, eq } from 'drizzle-orm';

import { db } from '../../db/client';
import { products, productSpecs } from './schema';
import { productSpecCreateSchema, productSpecUpdateSchema } from './validation';

// ✅ single source
import { getEffectiveLocale, normalizeLocale } from './i18n';

const now = () => new Date();

/* ---------- LIST ---------- */
export const adminListProductSpecs: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const locale = getEffectiveLocale(req);

  const rows = await db
    .select()
    .from(productSpecs)
    .where(and(eq(productSpecs.product_id, id), eq(productSpecs.locale, locale)))
    .orderBy(asc(productSpecs.order_num));

  return reply.send(rows);
};

/* ---------- CREATE ---------- */
export const adminCreateProductSpec: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const locale = getEffectiveLocale(req);

  try {
    const [p] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!p) return reply.code(404).send({ error: { message: 'product_not_found' } });

    const parsed = productSpecCreateSchema.parse({ ...(req.body || {}), product_id: id, locale });

    const row = {
      ...parsed,
      id: parsed.id ?? randomUUID(),
      locale: normalizeLocale(parsed.locale) || locale,
      created_at: now(),
      updated_at: now(),
    } as any;

    await db.insert(productSpecs).values(row);
    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

/* ---------- UPDATE ---------- */
export const adminUpdateProductSpec: RouteHandler = async (req, reply) => {
  const { id, specId } = req.params as { id: string; specId: string };

  try {
    const parsed = productSpecUpdateSchema.parse({ ...(req.body || {}), product_id: id });

    const upd: any = { ...parsed, updated_at: now() };
    if ((parsed as any).locale !== undefined) upd.locale = normalizeLocale((parsed as any).locale);

    await db
      .update(productSpecs)
      .set(upd)
      .where(and(eq(productSpecs.id, specId), eq(productSpecs.product_id, id)));

    const [row] = await db.select().from(productSpecs).where(eq(productSpecs.id, specId)).limit(1);
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

/* ---------- DELETE ---------- */
export const adminDeleteProductSpec: RouteHandler = async (req, reply) => {
  const { id, specId } = req.params as { id: string; specId: string };

  await db
    .delete(productSpecs)
    .where(and(eq(productSpecs.id, specId), eq(productSpecs.product_id, id)));

  return reply.send({ ok: true });
};

/* ---------- REPLACE (product + locale bazlı) ---------- */
export const adminReplaceSpecs: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const locale = getEffectiveLocale(req);

  try {
    const raw = (req.body as any) || {};
    const items: any[] = Array.isArray(raw.specs)
      ? raw.specs
      : Array.isArray(raw.items)
      ? raw.items
      : [];

    await db
      .delete(productSpecs)
      .where(and(eq(productSpecs.product_id, id), eq(productSpecs.locale, locale)));

    for (const it of items) {
      const v = productSpecCreateSchema.parse({ ...it, product_id: id, locale });

      await db.insert(productSpecs).values({
        ...v,
        id: v.id ?? randomUUID(),
        locale: normalizeLocale(v.locale) || locale,
        created_at: now(),
        updated_at: now(),
      } as any);
    }

    const rows = await db
      .select()
      .from(productSpecs)
      .where(and(eq(productSpecs.product_id, id), eq(productSpecs.locale, locale)))
      .orderBy(asc(productSpecs.order_num));

    return reply.send(rows);
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};
