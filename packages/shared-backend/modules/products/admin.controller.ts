// =============================================================
// FILE: src/modules/products/admin.controller.ts
// =============================================================
import type { RouteHandler } from 'fastify';
import { db } from '../../db/client';
import { z } from 'zod';
import { and, asc, desc, eq, inArray, like, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { products, productI18n, productImages } from './schema';
import { categories, categoryI18n } from '../categories/schema';
import { storageAssets } from '../storage/schema';
import {
  productCreateSchema,
  productUpdateSchema,
  productSetImagesSchema,
  type ProductSetImagesInput,
} from './validation';
import { buildPublicUrl } from '../storage/util';
import { normalizeProduct, normalizeItemType, type ItemType } from './helpers.shared';

// ✅ single source locale helpers
import { getEffectiveLocale, getLocalesForCreate, normalizeLocale } from './i18n';

/* ----------------- types ----------------- */
type AdminListQuery = {
  q?: string;
  category_id?: string;
  sub_category_id?: string;
  locale?: string;
  is_active?: string | number | boolean;
  item_type?: ItemType;
  limit?: string | number;
  offset?: string | number;
  sort?: 'order_num' | 'price' | 'rating' | 'created_at';
  order?: 'asc' | 'desc';
};

async function urlsForAssets(ids: string[]) {
  if (!ids.length) return {};
  const rows = await db
    .select({
      id: storageAssets.id,
      bucket: storageAssets.bucket,
      path: storageAssets.path,
      url: storageAssets.url,
    })
    .from(storageAssets)
    .where(inArray(storageAssets.id, ids));

  const map: Record<string, string> = {};
  for (const a of rows) {
    map[a.id] = buildPublicUrl(a.bucket, a.path, a.url ?? null);
  }
  return map;
}

/* ----------------- LIST / GET ----------------- */

/**
 * GET /admin/products
 *  ?q=&category_id=&sub_category_id=&locale=&is_active=&item_type=&limit=&offset=&sort=&order=
 */
export const adminListProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as AdminListQuery;

  const locale = getEffectiveLocale(req);
  const itemType = normalizeItemType(q.item_type, 'product'); // ✅ default product

  const conds: any[] = [eq(productI18n.locale, locale), eq(products.item_type, itemType as any)];

  if (q.q) conds.push(like(productI18n.title, `%${q.q}%`));
  if (q.category_id) conds.push(eq(products.category_id, q.category_id));
  if (q.sub_category_id) conds.push(eq(products.sub_category_id, q.sub_category_id));

  if (q.is_active !== undefined) {
    const v = String(q.is_active).toLowerCase();
    conds.push(eq(products.is_active, (v === '1' || v === 'true') as any));
  }

  const whereExpr = and(...conds);

  const limit = Math.min(Number(q.limit ?? 50) || 50, 100);
  const offset = Math.max(Number(q.offset ?? 0) || 0, 0);

  const colMap = {
    order_num: products.order_num,
    price: products.price,
    rating: products.rating,
    created_at: products.created_at,
  } as const;

  const sortKey = (q.sort && q.sort in colMap ? q.sort : 'order_num') as keyof typeof colMap;
  const dir = q.order === 'asc' ? 'asc' : 'desc';
  const orderExpr = dir === 'asc' ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  const [{ total }] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .where(whereExpr as any);

  const rows = await db
    .select({
      p: products,
      i: productI18n,
      category_name: categoryI18n.name,
    })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .leftJoin(
      categoryI18n,
      and(eq(categoryI18n.category_id, products.category_id), eq(categoryI18n.locale, locale)),
    )
    .where(whereExpr as any)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  reply.header('x-total-count', String(Number(total || 0)));
  reply.header('content-range', `*/${Number(total || 0)}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  const out = rows.map(({ p, i, category_name }) =>
    normalizeProduct({ ...p, ...(i ?? {}), category_name }),
  );
  return reply.send(out);
};

/**
 * GET /admin/products/:id?locale=&item_type=
 */
export const adminGetProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const q = (req.query || {}) as { item_type?: ItemType };

  const locale = getEffectiveLocale(req);
  const itemType = normalizeItemType(q.item_type, 'product');

  const rows = await db
    .select({ p: products, i: productI18n, category_name: categoryI18n.name })
    .from(products)
    .leftJoin(
      productI18n,
      and(eq(productI18n.product_id, products.id), eq(productI18n.locale, locale)),
    )
    .leftJoin(
      categoryI18n,
      and(eq(categoryI18n.category_id, products.category_id), eq(categoryI18n.locale, locale)),
    )
    .where(and(eq(products.id, id), eq(products.item_type, itemType as any)))
    .limit(1);

  if (!rows.length || !rows[0].p) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  const { p, i, category_name } = rows[0];
  return reply.send(normalizeProduct({ ...p, ...(i ?? {}), category_name }));
};

/* ----------------- CREATE / UPDATE / DELETE ----------------- */

export const adminCreateProduct: RouteHandler = async (req, reply) => {
  try {
    const input = productCreateSchema.parse(req.body ?? {}) as any;

    const baseLocale = normalizeLocale(input.locale) ?? getEffectiveLocale(req);
    const targetLocales = getLocalesForCreate(req, baseLocale);

    const productId: string = input.id ?? randomUUID();
    const itemType: ItemType = normalizeItemType(input.item_type, 'product');

    const coverId = input.storage_asset_id ?? null;
    const galleryIds: string[] = input.storage_image_ids ?? [];
    const urlMap = await urlsForAssets([...(coverId ? [coverId] : []), ...galleryIds]);

    const image_url = coverId
      ? urlMap[coverId] ?? input.image_url ?? null
      : input.image_url ?? null;
    const images = galleryIds.length > 0
      ? galleryIds.map((aid) => urlMap[aid]).filter(Boolean) as string[]
      : Array.isArray(input.images) ? input.images : [];

    const now = new Date();

    const baseRow: any = {
      id: productId,
      item_type: itemType,
      category_id: input.category_id,
      sub_category_id: input.sub_category_id ?? null,
      price: input.price,

      image_url,
      storage_asset_id: coverId,
      images,
      storage_image_ids: galleryIds,

      is_active:
        input.is_active === undefined
          ? true
          : !!(
              input.is_active === true ||
              input.is_active === 1 ||
              input.is_active === '1' ||
              input.is_active === 'true'
            ),

      is_featured:
        input.is_featured === undefined
          ? false
          : !!(
              input.is_featured === true ||
              input.is_featured === 1 ||
              input.is_featured === '1' ||
              input.is_featured === 'true'
            ),

      order_num: input.order_num ?? 0,
      product_code: input.product_code ?? null,
      stock_quantity: input.stock_quantity ?? 0,
      rating: input.rating ?? 5,
      review_count: input.review_count ?? 0,

      botanical_name: input.botanical_name ?? null,
      planting_seasons: Array.isArray(input.planting_seasons) ? input.planting_seasons : [],
      harvest_days: input.harvest_days ?? null,
      climate_zones: Array.isArray(input.climate_zones) ? input.climate_zones : [],
      soil_types: Array.isArray(input.soil_types) ? input.soil_types : [],
      water_need: input.water_need ?? null,
      sun_exposure: input.sun_exposure ?? null,
      min_temp: input.min_temp != null ? String(input.min_temp) : null,
      max_temp: input.max_temp != null ? String(input.max_temp) : null,
      germination_days: input.germination_days ?? null,
      seed_depth_cm: input.seed_depth_cm != null ? String(input.seed_depth_cm) : null,
      row_spacing_cm: input.row_spacing_cm ?? null,
      plant_spacing_cm: input.plant_spacing_cm ?? null,
      yield_per_sqm: input.yield_per_sqm ?? null,

      created_at: now,
      updated_at: now,
    };

    await db.insert(products).values(baseRow);

    const i18nRows = targetLocales.map((loc) => ({
      product_id: productId,
      locale: loc,
      title: input.title,
      slug: input.slug,
      description: input.description ?? null,
      alt: input.alt ?? null,
      tags: input.tags ?? [],
      specifications: input.specifications ?? null,
      meta_title: input.meta_title ?? null,
      meta_description: input.meta_description ?? null,
      created_at: now,
      updated_at: now,
    }));

    await db.insert(productI18n).values(i18nRows as any);

    const [row] = await db
      .select({ p: products, i: productI18n })
      .from(products)
      .leftJoin(
        productI18n,
        and(eq(productI18n.product_id, products.id), eq(productI18n.locale, baseLocale)),
      )
      .where(eq(products.id, productId))
      .limit(1);

    return reply.code(201).send(normalizeProduct({ ...(row?.p ?? {}), ...(row?.i ?? {}) }));
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const adminUpdateProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  try {
    const patch = productUpdateSchema.parse(req.body ?? {}) as any;

    const baseLocale =
      normalizeLocale(patch.locale) ??
      normalizeLocale((req.query as any)?.locale) ??
      getEffectiveLocale(req);

    const [curRow] = await db
      .select({ p: products, i: productI18n })
      .from(products)
      .leftJoin(
        productI18n,
        and(eq(productI18n.product_id, products.id), eq(productI18n.locale, baseLocale)),
      )
      .where(eq(products.id, id))
      .limit(1);

    if (!curRow || !curRow.p) {
      return reply.code(404).send({ error: { message: 'not_found' } });
    }

    const curMerged = normalizeProduct({ ...curRow.p, ...(curRow.i ?? {}) });

    const {
      id: _ignoreId,
      locale: _ignoreLocale,
      item_type,
      title,
      slug,
      description,
      alt,
      tags,
      specifications,
      meta_title,
      meta_description,
      ...basePatch
    } = patch;

    // image_url: patch'te varsa onu kullan, yoksa mevcut
    const image_url = patch.image_url !== undefined
      ? (patch.image_url || null)
      : curMerged.image_url;

    // images: patch'te varsa onu kullan, yoksa mevcut
    const images = patch.images !== undefined
      ? patch.images
      : (curMerged.images as string[]);

    // storage_asset_id: patch'te varsa onu kullan, yoksa mevcut
    const coverId = patch.storage_asset_id !== undefined
      ? patch.storage_asset_id
      : (curMerged.storage_asset_id ?? null);
    const galleryIds = patch.storage_image_ids !== undefined
      ? patch.storage_image_ids
      : ((curMerged.storage_image_ids as string[]) ?? []);

    const now = new Date();

    const baseUpdate: any = {
      ...basePatch,
      storage_asset_id: coverId,
      image_url,
      storage_image_ids: galleryIds,
      images,
      updated_at: now,
    };

    if (item_type !== undefined) {
      baseUpdate.item_type = normalizeItemType(item_type, curMerged.item_type ?? 'product');
    }

    for (const k of ['min_temp', 'max_temp', 'seed_depth_cm'] as const) {
      const v = baseUpdate[k];
      if (v !== undefined && v !== null && typeof v === 'number') {
        baseUpdate[k] = String(v);
      }
    }

    await db.update(products).set(baseUpdate).where(eq(products.id, id));

    const i18nPatch: any = { updated_at: now };
    if (title !== undefined) i18nPatch.title = title;
    if (slug !== undefined) i18nPatch.slug = slug;
    if (description !== undefined) i18nPatch.description = description;
    if (alt !== undefined) i18nPatch.alt = alt;
    if (tags !== undefined) i18nPatch.tags = tags;
    if (specifications !== undefined) i18nPatch.specifications = specifications;
    if (meta_title !== undefined) i18nPatch.meta_title = meta_title;
    if (meta_description !== undefined) i18nPatch.meta_description = meta_description;

    if (Object.keys(i18nPatch).length > 1) {
      const updated = await db
        .update(productI18n)
        .set(i18nPatch)
        .where(and(eq(productI18n.product_id, id), eq(productI18n.locale, baseLocale)));

      if ((updated as any).rowsAffected === 0) {
        await db.insert(productI18n).values({
          product_id: id,
          locale: baseLocale,
          title: title ?? curRow.i?.title ?? '',
          slug: slug ?? curRow.i?.slug ?? '',
          description: description ?? curRow.i?.description ?? null,
          alt: alt ?? curRow.i?.alt ?? null,
          tags: tags ?? curRow.i?.tags ?? [],
          specifications: specifications ?? curRow.i?.specifications ?? null,
          meta_title: meta_title ?? curRow.i?.meta_title ?? null,
          meta_description: meta_description ?? curRow.i?.meta_description ?? null,
          created_at: now,
          updated_at: now,
        } as any);
      }
    }

    const [row] = await db
      .select({ p: products, i: productI18n })
      .from(products)
      .leftJoin(
        productI18n,
        and(eq(productI18n.product_id, products.id), eq(productI18n.locale, baseLocale)),
      )
      .where(eq(products.id, id))
      .limit(1);

    return reply.send(normalizeProduct({ ...(row?.p ?? {}), ...(row?.i ?? {}) }));
  } catch (e: any) {
    if (e?.name === 'ZodError') {
      return reply.code(422).send({ error: { message: 'validation_error', details: e.issues } });
    }
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'internal_error' } });
  }
};

export const adminDeleteProduct: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(products).where(eq(products.id, id));
  return reply.code(204).send();
};

/* ----------------- IMAGES: REPLACE (products table fields) ----------------- */
/**
 * PUT /admin/products/:id/images/replace
 * - products.image_url + products.images + storage_* alanlarını replace eder
 */
export const adminSetProductImages: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  const parsed = productSetImagesSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.flatten() },
    });
  }

  const body: ProductSetImagesInput = parsed.data;
  const galleryIds = body.image_ids ?? [];
  const coverId = body.cover_id ?? null;

  const urlMap = await urlsForAssets([...(coverId ? [coverId] : []), ...galleryIds]);

  const coverUrl = coverId ? urlMap[coverId] ?? null : null;
  const images = galleryIds.map((aid) => urlMap[aid]).filter(Boolean) as string[];

  const patch: Record<string, unknown> = {
    storage_asset_id: coverId,
    image_url: coverUrl,
    storage_image_ids: galleryIds,
    images,
    updated_at: new Date(),
  };

  if (body.alt !== undefined) {
    patch.alt = body.alt as string | null;
  }

  await db
    .update(products)
    .set(patch as any)
    .where(eq(products.id, id));

  const locale = getEffectiveLocale(req);

  const [row] = await db
    .select({ p: products, i: productI18n })
    .from(products)
    .leftJoin(
      productI18n,
      and(eq(productI18n.product_id, products.id), eq(productI18n.locale, locale)),
    )
    .where(eq(products.id, id))
    .limit(1);

  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  return reply.send(normalizeProduct({ ...row.p, ...(row.i ?? {}) }));
};

/* ----------------- IMAGES POOL (product_images) ----------------- */

const productImageCreateSchema = z.object({
  image_url: z.string().min(1),
  image_asset_id: z.string().nullable().optional(),
  is_active: z.union([z.boolean(), z.number(), z.string()]).optional(),
  display_order: z.union([z.number(), z.string()]).nullable().optional(),

  title: z.string().nullable().optional(),
  alt: z.string().nullable().optional(),
  caption: z.string().nullable().optional(),

  locale: z.string().optional(),
  replicate_all_locales: z.union([z.boolean(), z.number(), z.string()]).optional(),
});

const boolish = (v: any, fallback = true) => {
  if (v === undefined || v === null) return fallback;
  const s = String(v).toLowerCase();
  return s === '1' || s === 'true' || v === true || v === 1;
};
/**
 * GET /admin/products/:id/images?locale=
 * - locale verilirse o locale listelenir
 * - verilmezse effective locale kullanılır
 * - sadece aktifler (is_active=1)
 */
export const adminListProductImages: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  const locale = normalizeLocale((req.query as any)?.locale) ?? getEffectiveLocale(req);

  const rows = await db
    .select()
    .from(productImages)
    .where(
      and(
        eq(productImages.product_id, id),
        eq(productImages.locale, locale),
        eq(productImages.is_active, true as any), // ✅ only active
      ),
    )
    .orderBy(asc(productImages.display_order), asc(productImages.created_at));

  return reply.send(rows);
};


/**
 * POST /admin/products/:id/images
 * body: { image_url, ... , locale, replicate_all_locales }
 */
export const adminCreateProductImage: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };

  const parsed = productImageCreateSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.flatten() },
    });
  }

  const input = parsed.data;

  const baseLocale =
    normalizeLocale(input.locale) ??
    normalizeLocale((req.query as any)?.locale) ??
    getEffectiveLocale(req);

  const replicate = boolish(input.replicate_all_locales, true);
  const targetLocales = replicate ? getLocalesForCreate(req, baseLocale) : [baseLocale];

  const now = new Date();

  for (const loc of targetLocales) {
    const exists = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(
        and(
          eq(productImages.product_id, id),
          eq(productImages.locale, loc),
          eq(productImages.image_url, input.image_url),
        ),
      )
      .limit(1);

    if (exists.length) continue;

    await db.insert(productImages).values({
      id: randomUUID(),
      product_id: id,
      locale: loc,

      image_url: input.image_url,
      image_asset_id: input.image_asset_id ?? null,

      title: input.title ?? null,
      alt: input.alt ?? null,
      caption: input.caption ?? null,

      display_order:
        input.display_order === null || input.display_order === undefined
          ? 0
          : Number(input.display_order) || 0,

      is_active: boolish(input.is_active, true),

      created_at: now,
      updated_at: now,
    } as any);
  }

  const rows = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.product_id, id), eq(productImages.locale, baseLocale)))
    .orderBy(asc(productImages.display_order), asc(productImages.created_at));

  return reply.code(201).send(rows);
};

/**
 * DELETE /admin/products/:id/images/:imageId
 * - ✅ locale'e bağlı olmadan siler (id + product_id)
 * - ✅ silinmediyse 404 döner
 * - ✅ response: current locale listesi (fe için)
 */
export const adminDeleteProductImage: RouteHandler = async (req, reply) => {
  const { id, imageId } = req.params as { id: string; imageId: string };

  // LIST için locale: query varsa onu kullan, yoksa effective
  const locale = normalizeLocale((req.query as any)?.locale) ?? getEffectiveLocale(req);

  const result = await db
    .delete(productImages)
    .where(and(eq(productImages.id, imageId), eq(productImages.product_id, id)));

  // ✅ Drizzle driver'a göre farklı alan adları olabiliyor
  const affected =
    (result as any)?.[0]?.affectedRows ??
    (result as any)?.affectedRows ??
    (result as any)?.rowsAffected ??
    (result as any)?.rowCount ??
    0;

  if (!affected) {
    return reply.code(404).send({ ok: false, error: { message: 'not_found' } });
  }

  const rows = await db
    .select()
    .from(productImages)
    .where(
      and(
        eq(productImages.product_id, id),
        eq(productImages.locale, locale),
        eq(productImages.is_active, true as any),
      ),
    )
    .orderBy(asc(productImages.display_order), asc(productImages.created_at));

  return reply.send(rows);
};


/* ----------------- REORDER ----------------- */

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), order_num: z.number().int().min(0) })).min(1),
});

export const adminReorderProducts: RouteHandler = async (req, reply) => {
  const parsed = reorderSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return reply.code(400).send({
      error: { message: 'invalid_body', issues: parsed.error.flatten() },
    });
  }

  const { items } = parsed.data;

  await db.transaction(async (tx) => {
    for (const { id, order_num } of items) {
      await tx
        .update(products)
        .set({ order_num, updated_at: new Date() } as any)
        .where(eq(products.id, id));
    }
  });

  return reply.send({ ok: true });
};
