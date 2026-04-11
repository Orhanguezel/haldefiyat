// =============================================================
// FILE: src/modules/products/controller.ts
// =============================================================
import type { RouteHandler } from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { and, asc, desc, eq, like, ne, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

import { db } from '../../db/client';
import { products, productFaqs, productSpecs, product_reviews, productI18n } from './schema';
import { categories, categoryI18n } from '../categories/schema';
import { subCategories, subCategoryI18n } from '../subcategories/schema';
import { toBoolDefault, toInt } from '../_shared';
import { normalizeProduct, normalizeItemType, publicProductJson, type ItemType } from './helpers.shared';
import { productFaqPublicSubmitSchema, productReviewPublicSubmitSchema } from './validation';

/* ----------------- types ----------------- */
type ListProductsQuery = {
  category_id?: string;
  category_slug?: string;
  sub_category_id?: string;
  is_active?: string;
  is_featured?: string;
  exclude_id?: string;
  q?: string;
  limit?: string;
  offset?: string;
  sort?: 'price' | 'rating' | 'created_at' | 'order_num';
  order?: 'asc' | 'desc' | string;
  slug?: string;
  min_price?: string;
  max_price?: string;
  locale?: string;
  item_type?: ItemType;
  module_key?: string;
  tags?: string;
};

type DetailQuery = {
  locale?: string;
  item_type?: ItemType;
};

/* ----------------- helpers ----------------- */
const safeLimit = (v: unknown, def = 100, max = 500): number => {
  const n = toInt(v, def);
  return n > 0 ? Math.min(n, max) : def;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeLocaleFromString = (raw?: string | null, fallback = 'de') => {
  if (!raw) return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const [short] = trimmed.split('-');
  const norm = (short || fallback).toLowerCase();
  return norm || fallback;
};

/* ----------------- LIST / GET (PUBLIC) ----------------- */

/**
 * GET /products
 * ?category_id=&sub_category_id=&is_active=&q=&limit=&offset=&sort=&order=&slug=&locale=&item_type=
 *
 * ✅ default item_type=product
 */
export const listProducts: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as ListProductsQuery;

  const locale = normalizeLocaleFromString(q.locale, 'de');
  const itemType = normalizeItemType(q.item_type, 'product');

  // shortcut: by slug (+ locale + item_type)
  if (q.slug) {
    const conds: any[] = [
      eq(productI18n.slug, q.slug),
      eq(productI18n.locale, locale),
      eq(products.item_type, itemType as any), // ✅ FIX
      eq(products.is_active, 1 as any),
    ];

    const rows = await db
      .select({
        p: products,
        i: productI18n,
        c: {
          id: categories.id,
          module_key: categories.module_key,
          image_url: categories.image_url,
          storage_asset_id: categories.storage_asset_id,
          alt: categories.alt,
          icon: categories.icon,
          is_active: categories.is_active,
          is_featured: categories.is_featured,
          display_order: categories.display_order,
          name: categoryI18n.name,
          slug: categoryI18n.slug,
        },
        s: {
          id: subCategories.id,
          category_id: subCategories.category_id,
          image_url: subCategories.image_url,
          storage_asset_id: subCategories.storage_asset_id,
          alt: subCategories.alt,
          icon: subCategories.icon,
          is_active: subCategories.is_active,
          is_featured: subCategories.is_featured,
          display_order: subCategories.display_order,
          name: subCategoryI18n.name,
          slug: subCategoryI18n.slug,
        },
      })
      .from(products)
      .innerJoin(productI18n, eq(productI18n.product_id, products.id))
      .leftJoin(categories, eq(products.category_id, categories.id))
      .leftJoin(
        categoryI18n,
        and(eq(categoryI18n.category_id, categories.id), eq(categoryI18n.locale, locale)),
      )
      .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
      .leftJoin(
        subCategoryI18n,
        and(
          eq(subCategoryI18n.sub_category_id, subCategories.id),
          eq(subCategoryI18n.locale, locale),
        ),
      )
      .where(and(...conds))
      .limit(1);

    if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

    const r = rows[0];
    // ✅ FIX: base + i18n (i18n override)
    const merged = { ...r.p, ...r.i };

    return reply.send(
      publicProductJson({
        ...normalizeProduct(merged),
        category: r.c,
        sub_category: r.s,
      } as Record<string, unknown>),
    );
  }

  const conds: any[] = [
    eq(productI18n.locale, locale),
    eq(products.item_type, itemType as any), // ✅ FIX
  ];

  if (q.category_id) conds.push(eq(products.category_id, q.category_id));
  if (q.sub_category_id) conds.push(eq(products.sub_category_id, q.sub_category_id));

  // Filter by category slug (resolve via categoryI18n join)
  if (q.category_slug) {
    conds.push(eq(categoryI18n.slug, q.category_slug));
  }

  // Filter by is_featured
  if (q.is_featured !== undefined) {
    const fv = q.is_featured === '1' || q.is_featured === 'true' ? 1 : 0;
    conds.push(eq(products.is_featured, fv as any));
  }

  // Exclude a specific product (useful for sidebar "related" queries)
  if (q.exclude_id) conds.push(ne(products.id, q.exclude_id));

  // Filter by module_key on category
  if (q.module_key) {
    conds.push(eq(categories.module_key, q.module_key));
  }

  // Filter by tags — match products that share any of the given tags
  // Usage: ?tags=konut,rezidans (comma-separated)
  if (q.tags) {
    const tagList = q.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      // JSON_OVERLAPS checks if the two JSON arrays share at least one element
      const tagJson = JSON.stringify(tagList);
      conds.push(sql`JSON_OVERLAPS(${productI18n.tags}, ${tagJson})`);
    }
  }

  if (q.is_active !== undefined) {
    const v = q.is_active === '1' || q.is_active === 'true' ? 1 : 0;
    conds.push(eq(products.is_active, v as any));
  } else {
    // public list default: active
    conds.push(eq(products.is_active, 1 as any));
  }

  if (q.q) conds.push(like(productI18n.title, `%${q.q}%`));
  if (q.min_price) conds.push(sql`${products.price} >= ${q.min_price}`);
  if (q.max_price) conds.push(sql`${products.price} <= ${q.max_price}`);

  const whereExpr = and(...conds);

  const limit = q.limit ? Math.min(parseInt(q.limit, 10) || 50, 100) : 50;
  const offset = q.offset ? Math.max(parseInt(q.offset, 10) || 0, 0) : 0;

  const colMap = {
    price: products.price,
    rating: products.rating,
    created_at: products.created_at,
    order_num: products.order_num,
  } as const;

  let sortKey: keyof typeof colMap = 'created_at';
  let dir: 'asc' | 'desc' = 'desc';

  if (q.sort) {
    sortKey = q.sort;
    dir = q.order === 'asc' ? 'asc' : 'desc';
  } else if (q.order && q.order.includes('.')) {
    const [col, d] = String(q.order).split('.');
    sortKey = (['price', 'rating', 'created_at', 'order_num'] as const).includes(col as any)
      ? (col as keyof typeof colMap)
      : 'created_at';
    dir = d?.toLowerCase() === 'asc' ? 'asc' : 'desc';
  }
  const orderExpr = dir === 'asc' ? asc(colMap[sortKey]) : desc(colMap[sortKey]);

  // ✅ COUNT includes item_type + locale
  const countBase = db
    .select({ total: sql<number>`COUNT(*)` })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .where(whereExpr as any);

  const [{ total }] = await countBase;

  const dataBase = db
    .select({
      p: products,
      i: productI18n,
      c: {
        id: categories.id,
        module_key: categories.module_key,
        image_url: categories.image_url,
        storage_asset_id: categories.storage_asset_id,
        alt: categories.alt,
        icon: categories.icon,
        is_active: categories.is_active,
        is_featured: categories.is_featured,
        display_order: categories.display_order,
        name: categoryI18n.name,
        slug: categoryI18n.slug,
      },
      s: {
        id: subCategories.id,
        category_id: subCategories.category_id,
        image_url: subCategories.image_url,
        storage_asset_id: subCategories.storage_asset_id,
        alt: subCategories.alt,
        icon: subCategories.icon,
        is_active: subCategories.is_active,
        is_featured: subCategories.is_featured,
        display_order: subCategories.display_order,
        name: subCategoryI18n.name,
        slug: subCategoryI18n.slug,
      },
    })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(
      categoryI18n,
      and(eq(categoryI18n.category_id, categories.id), eq(categoryI18n.locale, locale)),
    )
    .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
    .leftJoin(
      subCategoryI18n,
      and(
        eq(subCategoryI18n.sub_category_id, subCategories.id),
        eq(subCategoryI18n.locale, locale),
      ),
    )
    .where(whereExpr as any);

  const rows = await dataBase.orderBy(orderExpr).limit(limit).offset(offset);

  const out = rows.map((r) => {
    // ✅ FIX: base + i18n (i18n override)
    const merged = { ...r.p, ...r.i };
    return publicProductJson({
      ...normalizeProduct(merged),
      category: r.c,
      sub_category: r.s,
    } as Record<string, unknown>);
  });

  reply.header('x-total-count', String(Number(total || 0)));
  reply.header('content-range', `*/${Number(total || 0)}`);
  reply.header('access-control-expose-headers', 'x-total-count, content-range');

  return reply.send(out);
};

/**
 * GET /products/:idOrSlug?locale=&item_type=
 * ✅ default item_type=product
 */
export const getProductByIdOrSlug: RouteHandler = async (req, reply) => {
  const { idOrSlug } = req.params as { idOrSlug: string };
  const { locale: localeParam, item_type } = (req.query || {}) as DetailQuery;

  const locale = normalizeLocaleFromString(localeParam, 'de');
  const itemType = normalizeItemType(item_type, 'product');
  const isUuid = UUID_RE.test(idOrSlug);

  const conds: any[] = [
    eq(productI18n.locale, locale),
    eq(products.item_type, itemType as any), // ✅ FIX
  ];

  if (isUuid) {
    conds.push(eq(products.id, idOrSlug));
  } else {
    conds.push(eq(productI18n.slug, idOrSlug));
    conds.push(eq(products.is_active, 1 as any));
  }

  const rows = await db
    .select({
      p: products,
      i: productI18n,
      c: {
        id: categories.id,
        module_key: categories.module_key,
        image_url: categories.image_url,
        storage_asset_id: categories.storage_asset_id,
        alt: categories.alt,
        icon: categories.icon,
        is_active: categories.is_active,
        is_featured: categories.is_featured,
        display_order: categories.display_order,
        name: categoryI18n.name,
        slug: categoryI18n.slug,
      },
      s: {
        id: subCategories.id,
        category_id: subCategories.category_id,
        image_url: subCategories.image_url,
        storage_asset_id: subCategories.storage_asset_id,
        alt: subCategories.alt,
        icon: subCategories.icon,
        is_active: subCategories.is_active,
        is_featured: subCategories.is_featured,
        display_order: subCategories.display_order,
        name: subCategoryI18n.name,
        slug: subCategoryI18n.slug,
      },
    })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(
      categoryI18n,
      and(eq(categoryI18n.category_id, categories.id), eq(categoryI18n.locale, locale)),
    )
    .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
    .leftJoin(
      subCategoryI18n,
      and(
        eq(subCategoryI18n.sub_category_id, subCategories.id),
        eq(subCategoryI18n.locale, locale),
      ),
    )
    .where(and(...conds))
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

  const r = rows[0];
  // ✅ FIX: base + i18n
  const merged = { ...r.p, ...r.i };

  return reply.send(
    publicProductJson({
      ...normalizeProduct(merged),
      category: r.c,
      sub_category: r.s,
    } as Record<string, unknown>),
  );
};

/**
 * GET /products/id/:id?locale=&item_type=
 * ✅ default item_type=product
 */
export const getProductById: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const { locale: localeParam, item_type } = (req.query || {}) as DetailQuery;

  const locale = normalizeLocaleFromString(localeParam, 'de');
  const itemType = normalizeItemType(item_type, 'product');

  const rows = await db
    .select({
      p: products,
      i: productI18n,
      c: {
        id: categories.id,
        module_key: categories.module_key,
        image_url: categories.image_url,
        storage_asset_id: categories.storage_asset_id,
        alt: categories.alt,
        icon: categories.icon,
        is_active: categories.is_active,
        is_featured: categories.is_featured,
        display_order: categories.display_order,
        name: categoryI18n.name,
        slug: categoryI18n.slug,
      },
      s: {
        id: subCategories.id,
        category_id: subCategories.category_id,
        image_url: subCategories.image_url,
        storage_asset_id: subCategories.storage_asset_id,
        alt: subCategories.alt,
        icon: subCategories.icon,
        is_active: subCategories.is_active,
        is_featured: subCategories.is_featured,
        display_order: subCategories.display_order,
        name: subCategoryI18n.name,
        slug: subCategoryI18n.slug,
      },
    })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .leftJoin(categories, eq(products.category_id, categories.id))
    .leftJoin(
      categoryI18n,
      and(eq(categoryI18n.category_id, categories.id), eq(categoryI18n.locale, locale)),
    )
    .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
    .leftJoin(
      subCategoryI18n,
      and(
        eq(subCategoryI18n.sub_category_id, subCategories.id),
        eq(subCategoryI18n.locale, locale),
      ),
    )
    .where(
      and(
        eq(products.id, id),
        eq(productI18n.locale, locale),
        eq(products.item_type, itemType as any), // ✅ FIX
      ),
    )
    .limit(1);

  if (!rows.length) return reply.code(404).send({ error: { message: 'not_found' } });

  const r = rows[0];
  const merged = { ...r.p, ...r.i }; // ✅ FIX
  return reply.send(
    publicProductJson({
      ...normalizeProduct(merged),
      category: r.c,
      sub_category: r.s,
    } as Record<string, unknown>),
  );
};

/**
 * GET /products/by-slug/:slug?locale=&item_type=
 * ✅ default item_type=product
 * ✅ NEW: slug resolve ANY locale, then pick requested locale content (fallback en->tr->any)
 */
export const getProductBySlug: RouteHandler<{
  Params: { slug: string };
  Querystring: { locale?: string; item_type?: ItemType };
}> = async (req, reply) => {
  const { slug } = req.params;
  const requestedLocale = normalizeLocaleFromString(req.query?.locale, 'de');
  const itemType = normalizeItemType(req.query?.item_type, 'product');

  // 1) Resolve product_id by slug in ANY locale (active + item_type)
  const baseHit = await db
    .select({
      product_id: products.id,
    })
    .from(products)
    .innerJoin(productI18n, eq(productI18n.product_id, products.id))
    .where(
      and(
        eq(productI18n.slug, slug),
        eq(products.item_type, itemType as any),
        eq(products.is_active, 1 as any),
      ),
    )
    .limit(1);

  if (!baseHit.length) {
    return reply.code(404).send({ error: { message: 'not_found' } });
  }

  const productId = baseHit[0].product_id;

  // helper: fetch one locale detail (must exist in that locale)
  const fetchLocale = async (loc: string) => {
    const rows = await db
      .select({
        p: products,
        i: productI18n,
        c: {
          id: categories.id,
          module_key: categories.module_key,
          image_url: categories.image_url,
          storage_asset_id: categories.storage_asset_id,
          alt: categories.alt,
          icon: categories.icon,
          is_active: categories.is_active,
          is_featured: categories.is_featured,
          display_order: categories.display_order,
          name: categoryI18n.name,
          slug: categoryI18n.slug,
        },
        s: {
          id: subCategories.id,
          category_id: subCategories.category_id,
          image_url: subCategories.image_url,
          storage_asset_id: subCategories.storage_asset_id,
          alt: subCategories.alt,
          icon: subCategories.icon,
          is_active: subCategories.is_active,
          is_featured: subCategories.is_featured,
          display_order: subCategories.display_order,
          name: subCategoryI18n.name,
          slug: subCategoryI18n.slug,
        },
      })
      .from(products)
      // i18n MUST match locale for the payload language
      .innerJoin(
        productI18n,
        and(eq(productI18n.product_id, products.id), eq(productI18n.locale, loc)),
      )
      .leftJoin(categories, eq(products.category_id, categories.id))
      .leftJoin(
        categoryI18n,
        and(eq(categoryI18n.category_id, categories.id), eq(categoryI18n.locale, loc)),
      )
      .leftJoin(subCategories, eq(products.sub_category_id, subCategories.id))
      .leftJoin(
        subCategoryI18n,
        and(
          eq(subCategoryI18n.sub_category_id, subCategories.id),
          eq(subCategoryI18n.locale, loc),
        ),
      )
      .where(
        and(
          eq(products.id, productId),
          eq(products.item_type, itemType as any),
          eq(products.is_active, 1 as any),
        ),
      )
      .limit(1);

    return rows.length ? rows[0] : null;
  };

  // 2) Locale selection chain:
  //    requested -> en -> tr -> any existing locale
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

  // 3) If still not found, pick ANY locale row for that product (deterministic)
  if (!hit) {
    const anyRow = await db
      .select({
        p: products,
        i: productI18n,
      })
      .from(products)
      .innerJoin(productI18n, eq(productI18n.product_id, products.id))
      .where(
        and(
          eq(products.id, productId),
          eq(products.item_type, itemType as any),
          eq(products.is_active, 1 as any),
        ),
      )
      .orderBy(asc(productI18n.locale))
      .limit(1);

    if (!anyRow.length) {
      return reply.code(404).send({ error: { message: 'not_found' } });
    }

    // hit yoksa category/subcategory lokalizasyonu da en azından requestedLocale ile gelsin
    // (burada minimal tutuyoruz)
    const merged0 = { ...anyRow[0].p, ...anyRow[0].i };
    const normalized0 = normalizeProduct(merged0);
    return reply.send(
      publicProductJson({
        ...normalized0,
        locale: anyRow[0].i.locale, // gerçek dönen locale
        category: null,
        sub_category: null,
      } as Record<string, unknown>),
    );
  }

  // ✅ base + i18n (i18n override)
  const merged = { ...hit.p, ...hit.i };
  const normalized = normalizeProduct(merged);

  return reply.send(
    publicProductJson({
      ...normalized,
      // response locale: hangi locale içeriği döndüysek onu belirtmek daha doğru
      locale: usedLocale,
      category: hit.c,
      sub_category: hit.s,
    } as Record<string, unknown>),
  );
};


/* ===================== */
/* FAQ & SPECS & REVIEWS */
/* ===================== */

/** GET /product_faqs?product_id=&only_active=1&locale= */
export const listProductFaqs: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as {
    product_id?: string;
    only_active?: string;
    locale?: string;
  };

  const locale = normalizeLocaleFromString(q.locale, 'de');
  const conds: any[] = [eq(productFaqs.locale, locale)];

  if (q.product_id) conds.push(eq(productFaqs.product_id, q.product_id));
  if (q.only_active === '1' || q.only_active === 'true')
    conds.push(eq(productFaqs.is_active, 1 as any));

  const whereExpr = conds.length ? and(...conds) : undefined;

  const base = db.select().from(productFaqs);
  const rows = await (whereExpr ? base.where(whereExpr as any) : base).orderBy(
    productFaqs.display_order,
  );

  return reply.send(rows);
};

/** GET /product_specs?product_id=&locale= */
export const listProductSpecs: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as { product_id?: string; locale?: string };

  const locale = normalizeLocaleFromString(q.locale, 'de');
  const conds: any[] = [eq(productSpecs.locale, locale)];

  if (q.product_id) conds.push(eq(productSpecs.product_id, q.product_id));

  const whereExpr = and(...conds);

  const rows = await db
    .select()
    .from(productSpecs)
    .where(whereExpr as any)
    .orderBy(asc(productSpecs.order_num));

  return reply.send(rows);
};

/** GET /product_reviews?product_id=&only_active=&limit=&offset= */
export async function listProductReviews(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = req.query as {
      product_id?: string;
      only_active?: string | number | boolean;
      limit?: string | number;
      offset?: string | number;
    };

    if (!q.product_id) {
      return reply.code(400).send({ error: 'product_id zorunludur' });
    }

    const filters = [eq(product_reviews.product_id, q.product_id)];
    if (toBoolDefault(q.only_active, true)) {
      // @ts-expect-error drizzle tinyint boolean union
      filters.push(eq(product_reviews.is_active, 1));
    }

    const rows = await db
      .select()
      .from(product_reviews)
      .where(and(...filters))
      .orderBy(desc(product_reviews.review_date), desc(product_reviews.created_at))
      .limit(safeLimit(q.limit))
      .offset(Math.max(0, toInt(q.offset, 0)));

    return reply.send(rows);
  } catch (err) {
    req.log.error({ err }, 'listProductReviews failed');
    return reply.code(500).send({ error: 'İç sunucu hatası' });
  }
}

/**
 * POST /product_faqs/submit  (PUBLIC)
 * Müşteri soru gönderimi — answer boş, is_active=0 → admin onaylar
 */
export async function submitPublicFaq(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = productFaqPublicSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { product_id, locale, question } = parsed.data;

    // Ürün var mı kontrol et
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, product_id), eq(products.is_active, 1 as any)))
      .limit(1);

    if (!product) {
      return reply.code(404).send({ error: 'Ürün bulunamadı' });
    }

    const id = randomUUID();
    await db.insert(productFaqs).values({
      id,
      product_id,
      locale: locale || 'tr',
      question,
      answer: '',
      display_order: 0,
      is_active: 0 as any,
    });

    return reply.code(201).send({ id, message: 'Sorunuz alındı, en kısa sürede cevaplanacaktır.' });
  } catch (err) {
    req.log.error({ err }, 'submitPublicFaq failed');
    return reply.code(500).send({ error: 'İç sunucu hatası' });
  }
}

/**
 * POST /product_reviews/submit  (PUBLIC)
 * Müşteri değerlendirme gönderimi — is_active=0 → admin onaylar
 */
export async function submitPublicReview(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = productReviewPublicSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { product_id, rating, comment, customer_name } = parsed.data;

    // Ürün var mı kontrol et
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, product_id), eq(products.is_active, 1 as any)))
      .limit(1);

    if (!product) {
      return reply.code(404).send({ error: 'Ürün bulunamadı' });
    }

    const id = randomUUID();
    await db.insert(product_reviews).values({
      id,
      product_id,
      user_id: null,
      rating,
      comment,
      customer_name,
      is_active: 0 as any,
      review_date: new Date(),
    });

    return reply.code(201).send({ id, message: 'Değerlendirmeniz alındı, incelendikten sonra yayınlanacaktır.' });
  } catch (err) {
    req.log.error({ err }, 'submitPublicReview failed');
    return reply.code(500).send({ error: 'İç sunucu hatası' });
  }
}
