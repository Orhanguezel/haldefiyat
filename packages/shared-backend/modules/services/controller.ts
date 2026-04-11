// =============================================================
// FILE: src/modules/services/controller.ts
// =============================================================
import type { RouteHandler } from 'fastify';
import { and, asc, desc, eq, like, sql } from 'drizzle-orm';

import { db } from '../../db/client';
import { services, servicesI18n } from './schema';

/* ----------------- types ----------------- */
type ListServicesQuery = {
  module_key?: string;
  is_active?: string;
  is_featured?: string;
  locale?: string;
  limit?: string;
  offset?: string;
  sort?: 'display_order' | 'created_at' | 'title';
  order?: 'asc' | 'desc' | string;
  q?: string;
};

type DetailQuery = {
  locale?: string;
};

/* ----------------- helpers ----------------- */
const normalizeLocaleFromString = (raw?: string | null, fallback = 'tr') => {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const [short] = trimmed.split('-');
  const norm = (short || fallback).toLowerCase();
  return norm || fallback;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/* ----------------- LIST (PUBLIC) ----------------- */

/**
 * GET /services
 * ?module_key=&is_active=&locale=&limit=&offset=&sort=&order=&q=&is_featured=
 */
export const listServices: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as ListServicesQuery;

  const locale = normalizeLocaleFromString(q.locale, 'tr');

  const conds: any[] = [eq(servicesI18n.locale, locale)];

  if (q.module_key) conds.push(eq(services.module_key, q.module_key));

  if (q.is_featured !== undefined) {
    const fv = q.is_featured === '1' || q.is_featured === 'true' ? 1 : 0;
    conds.push(eq(services.is_featured, fv as any));
  }

  if (q.is_active !== undefined) {
    const v = q.is_active === '1' || q.is_active === 'true' ? 1 : 0;
    conds.push(eq(services.is_active, v as any));
  } else {
    // public list default: active only
    conds.push(eq(services.is_active, 1 as any));
  }

  if (q.q) conds.push(like(servicesI18n.title, `%${q.q}%`));

  const whereExpr = and(...conds);

  const limit = q.limit ? Math.min(parseInt(q.limit, 10) || 50, 100) : 50;
  const offset = q.offset ? Math.max(parseInt(q.offset, 10) || 0, 0) : 0;

  const colMap = {
    display_order: services.display_order,
    created_at: services.created_at,
    title: servicesI18n.title,
  } as const;

  let sortKey: keyof typeof colMap = 'display_order';
  let dir: 'asc' | 'desc' = 'asc';

  if (q.sort && q.sort in colMap) {
    sortKey = q.sort;
    dir = q.order === 'desc' ? 'desc' : 'asc';
  } else if (q.order && q.order.includes('.')) {
    const [col, d] = String(q.order).split('.');
    sortKey = (['display_order', 'created_at', 'title'] as const).includes(col as any)
      ? (col as keyof typeof colMap)
      : 'display_order';
    dir = d?.toLowerCase() === 'desc' ? 'desc' : 'asc';
  }

  const orderExpr = dir === 'asc' ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  // COUNT
  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(services)
    .innerJoin(servicesI18n, eq(servicesI18n.service_id, services.id))
    .where(whereExpr as any);

  // DATA
  const rows = await db
    .select({
      base: services,
      i18n: servicesI18n,
    })
    .from(services)
    .innerJoin(servicesI18n, eq(servicesI18n.service_id, services.id))
    .where(whereExpr as any)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  const out = rows.map((r) => {
    const merged = { ...r.base, ...r.i18n };
    return merged;
  });

  reply.header('x-total-count', String(Number(total || 0)));
  reply.header('content-range', `*/${Number(total || 0)}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  return reply.send(out);
};

/* ----------------- GET BY SLUG (PUBLIC) ----------------- */

/**
 * GET /services/by-slug/:slug?locale=
 * Locale fallback chain: requested -> en -> tr -> any
 */
export const getServiceBySlug: RouteHandler<{
  Params: { slug: string };
  Querystring: { locale?: string };
}> = async (req, reply) => {
  const { slug } = req.params;
  const requestedLocale = normalizeLocaleFromString(req.query?.locale, 'tr');

  // 1) Resolve service_id by slug in ANY locale (active only)
  const baseHit = await db
    .select({ service_id: services.id })
    .from(services)
    .innerJoin(servicesI18n, eq(servicesI18n.service_id, services.id))
    .where(
      and(
        eq(servicesI18n.slug, slug),
        eq(services.is_active, 1 as any),
      ),
    )
    .limit(1);

  if (!baseHit.length) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  const serviceId = baseHit[0].service_id;

  // helper: fetch one locale detail
  const fetchLocale = async (loc: string) => {
    const rows = await db
      .select({
        base: services,
        i18n: servicesI18n,
      })
      .from(services)
      .innerJoin(
        servicesI18n,
        and(eq(servicesI18n.service_id, services.id), eq(servicesI18n.locale, loc)),
      )
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.is_active, 1 as any),
        ),
      )
      .limit(1);

    return rows.length ? rows[0] : null;
  };

  // 2) Locale selection chain: requested -> en -> tr -> any
  const candidates = Array.from(
    new Set([requestedLocale, 'en', 'tr'].filter(Boolean)),
  );

  let hit: any | null = null;
  let usedLocale = requestedLocale;

  for (const loc of candidates) {
    const r = await fetchLocale(loc);
    if (r) {
      hit = r;
      usedLocale = loc;
      break;
    }
  }

  // 3) If still not found, pick ANY locale row
  if (!hit) {
    const anyRow = await db
      .select({
        base: services,
        i18n: servicesI18n,
      })
      .from(services)
      .innerJoin(servicesI18n, eq(servicesI18n.service_id, services.id))
      .where(
        and(
          eq(services.id, serviceId),
          eq(services.is_active, 1 as any),
        ),
      )
      .orderBy(asc(servicesI18n.locale))
      .limit(1);

    if (!anyRow.length) {
      return reply.code(404).send({ error: { message: 'not_found' } });
    }

    const merged = { ...anyRow[0].base, ...anyRow[0].i18n };
    return reply.send({
      ...merged,
      locale: anyRow[0].i18n.locale,
    });
  }

  const merged = { ...hit.base, ...hit.i18n };

  return reply.send({
    ...merged,
    locale: usedLocale,
  });
};

/* ----------------- GET BY ID (PUBLIC) ----------------- */

/**
 * GET /services/:id?locale=
 */
export const getServiceById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { locale: localeParam } = (req.query || {}) as DetailQuery;

  const locale = normalizeLocaleFromString(localeParam, 'tr');

  const rows = await db
    .select({
      base: services,
      i18n: servicesI18n,
    })
    .from(services)
    .innerJoin(
      servicesI18n,
      and(eq(servicesI18n.service_id, services.id), eq(servicesI18n.locale, locale)),
    )
    .where(eq(services.id, id))
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

  const r = rows[0];
  const merged = { ...r.base, ...r.i18n };

  return reply.send(merged);
};
