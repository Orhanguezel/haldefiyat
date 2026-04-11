import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { services, servicesI18n, serviceImages, serviceImagesI18n } from './schema';

const normalizeLocale = (raw?: string | null) => {
  if (!raw) return 'tr';
  const s = raw.trim().toLowerCase().split('-')[0];
  return s || 'tr';
};

export const adminListServices: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as Record<string, string | undefined>;
  const locale = normalizeLocale(q.locale);
  const limit = Math.min(parseInt(q.limit || '200', 10) || 200, 500);
  const offset = Math.max(parseInt(q.offset || '0', 10) || 0, 0);

  const conds: any[] = [eq(servicesI18n.locale, locale)];
  if (q.q) conds.push(like(servicesI18n.title, `%${q.q}%`));

  const whereExpr = and(...conds);

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(services)
    .innerJoin(servicesI18n, eq(servicesI18n.service_id, services.id))
    .where(whereExpr as any);

  const rows = await db
    .select({ base: services, i18n: servicesI18n })
    .from(services)
    .innerJoin(servicesI18n, eq(servicesI18n.service_id, services.id))
    .where(whereExpr as any)
    .orderBy(asc(services.display_order))
    .limit(limit)
    .offset(offset);

  reply.header('x-total-count', String(Number(total || 0)));
  return reply.send(rows.map((r) => ({ ...r.base, ...r.i18n })));
};

export const adminGetService: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const locale = normalizeLocale((req.query as any)?.locale);

  const rows = await db
    .select({ base: services, i18n: servicesI18n })
    .from(services)
    .innerJoin(servicesI18n, and(eq(servicesI18n.service_id, services.id), eq(servicesI18n.locale, locale)))
    .where(eq(services.id, id))
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send({ ...rows[0].base, ...rows[0].i18n });
};

export const adminCreateService: RouteHandler = async (req, reply) => {
  const body = (req.body || {}) as any;
  const id = randomUUID();
  const locale = normalizeLocale(body.locale);

  await db.insert(services).values({
    id,
    module_key: body.module_key || 'bereketfide',
    category_id: body.category_id || null,
    is_active: body.is_active ?? true,
    is_featured: body.is_featured ?? false,
    display_order: body.display_order ?? 0,
    image_url: body.image_url || null,
    storage_asset_id: body.storage_asset_id || null,
  });

  await db.insert(servicesI18n).values({
    service_id: id,
    locale,
    title: body.title || '',
    slug: body.slug || '',
    description: body.description || null,
    content: body.content || null,
    alt: body.alt || null,
    meta_title: body.meta_title || null,
    meta_description: body.meta_description || null,
  });

  return reply.code(201).send({ id, locale });
};

export const adminUpdateService: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body || {}) as any;
  const locale = normalizeLocale(body.locale);

  const baseFields: any = {};
  if ('is_active' in body) baseFields.is_active = body.is_active;
  if ('is_featured' in body) baseFields.is_featured = body.is_featured;
  if ('display_order' in body) baseFields.display_order = body.display_order;
  if ('image_url' in body) baseFields.image_url = body.image_url;
  if ('storage_asset_id' in body) baseFields.storage_asset_id = body.storage_asset_id;
  if ('category_id' in body) baseFields.category_id = body.category_id;

  if (Object.keys(baseFields).length) {
    await db.update(services).set(baseFields).where(eq(services.id, id));
  }

  const i18nFields: any = {};
  if ('title' in body) i18nFields.title = body.title;
  if ('slug' in body) i18nFields.slug = body.slug;
  if ('description' in body) i18nFields.description = body.description;
  if ('content' in body) i18nFields.content = body.content;
  if ('alt' in body) i18nFields.alt = body.alt;
  if ('meta_title' in body) i18nFields.meta_title = body.meta_title;
  if ('meta_description' in body) i18nFields.meta_description = body.meta_description;

  if (Object.keys(i18nFields).length) {
    await db
      .insert(servicesI18n)
      .values({ service_id: id, locale, ...i18nFields, title: i18nFields.title || '', slug: i18nFields.slug || '' })
      .onDuplicateKeyUpdate({ set: i18nFields });
  }

  return reply.send({ ok: true });
};

export const adminDeleteService: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  // delete images first (cascade should handle, but be safe)
  const imgs = await db.select({ id: serviceImages.id }).from(serviceImages).where(eq(serviceImages.service_id, id));
  for (const img of imgs) {
    await db.delete(serviceImagesI18n).where(eq(serviceImagesI18n.image_id, img.id));
  }
  await db.delete(serviceImages).where(eq(serviceImages.service_id, id));
  await db.delete(servicesI18n).where(eq(servicesI18n.service_id, id));
  await db.delete(services).where(eq(services.id, id));
  return reply.code(204).send();
};

/* ================================================================
 * SERVICE IMAGES CRUD
 * ================================================================ */

export const adminListServiceImages: RouteHandler = async (req, reply) => {
  const { id: serviceId } = req.params as { id: string };

  const rows = await db
    .select()
    .from(serviceImages)
    .where(eq(serviceImages.service_id, serviceId))
    .orderBy(asc(serviceImages.display_order));

  return reply.send(rows.map((r) => ({
    ...r,
    is_active: r.is_active ? true : false,
  })));
};

export const adminCreateServiceImage: RouteHandler = async (req, reply) => {
  const { id: serviceId } = req.params as { id: string };
  const body = (req.body || {}) as any;
  const imgId = randomUUID();

  await db.insert(serviceImages).values({
    id: imgId,
    service_id: serviceId,
    image_url: body.image_url || null,
    storage_asset_id: body.image_asset_id || null,
    display_order: body.display_order ?? 0,
    is_active: body.is_active ?? true,
  });

  // i18n row (optional)
  if (body.alt || body.caption || body.title) {
    await db.insert(serviceImagesI18n).values({
      id: randomUUID(),
      image_id: imgId,
      locale: normalizeLocale(body.locale),
      title: body.title || null,
      alt: body.alt || null,
      caption: body.caption || null,
    });
  }

  // return updated list
  const rows = await db
    .select()
    .from(serviceImages)
    .where(eq(serviceImages.service_id, serviceId))
    .orderBy(asc(serviceImages.display_order));

  return reply.code(201).send(rows.map((r) => ({ ...r, is_active: r.is_active ? true : false })));
};

export const adminUpdateServiceImage: RouteHandler = async (req, reply) => {
  const { id: serviceId, imageId } = req.params as { id: string; imageId: string };
  const body = (req.body || {}) as any;

  const baseFields: any = {};
  if ('image_url' in body) baseFields.image_url = body.image_url;
  if ('storage_asset_id' in body) baseFields.storage_asset_id = body.storage_asset_id;
  if ('display_order' in body) baseFields.display_order = body.display_order;
  if ('is_active' in body) baseFields.is_active = body.is_active;

  if (Object.keys(baseFields).length) {
    await db.update(serviceImages).set(baseFields).where(eq(serviceImages.id, imageId));
  }

  // i18n upsert
  const i18nFields: any = {};
  if ('alt' in body) i18nFields.alt = body.alt;
  if ('caption' in body) i18nFields.caption = body.caption;
  if ('title' in body) i18nFields.title = body.title;

  if (Object.keys(i18nFields).length) {
    const locale = normalizeLocale(body.locale);
    await db
      .insert(serviceImagesI18n)
      .values({ id: randomUUID(), image_id: imageId, locale, ...i18nFields })
      .onDuplicateKeyUpdate({ set: i18nFields });
  }

  const rows = await db
    .select()
    .from(serviceImages)
    .where(eq(serviceImages.service_id, serviceId))
    .orderBy(asc(serviceImages.display_order));

  return reply.send(rows.map((r) => ({ ...r, is_active: r.is_active ? true : false })));
};

export const adminDeleteServiceImage: RouteHandler = async (req, reply) => {
  const { id: serviceId, imageId } = req.params as { id: string; imageId: string };

  await db.delete(serviceImagesI18n).where(eq(serviceImagesI18n.image_id, imageId));
  await db.delete(serviceImages).where(eq(serviceImages.id, imageId));

  const rows = await db
    .select()
    .from(serviceImages)
    .where(eq(serviceImages.service_id, serviceId))
    .orderBy(asc(serviceImages.display_order));

  return reply.send(rows.map((r) => ({ ...r, is_active: r.is_active ? true : false })));
};
