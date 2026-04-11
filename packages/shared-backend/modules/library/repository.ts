// src/modules/library/repository.ts

import { db } from '../../db/client';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'crypto';

import {
  library,
  libraryI18n,
  libraryImages,
  libraryImagesI18n,
  libraryFiles,
  type NewLibraryRow,
  type NewLibraryI18nRow,
  type NewLibraryImageRow,
  type NewLibraryImageI18nRow,
  type NewLibraryFileRow,
} from './schema';

import { ensureLocalesLoadedFromSettings, LOCALES } from '../../core/i18n';

import { storageAssets } from '../storage/schema';
import { publicUrlOf } from '../storage/util';

// 🔗 Kategoriler (base + i18n) — module_key filtresi için kullanılır
import { categories, categoryI18n } from '../categories/schema';
import { subCategories, subCategoryI18n } from '../subcategories/schema';

/* ----------------------- types ----------------------- */

type Sortable =
  | 'created_at'
  | 'updated_at'
  | 'published_at'
  | 'display_order'
  | 'views'
  | 'download_count';

type BoolLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false' | undefined;

/**
 * Library modülünde Locale tipini statik union'a kilitleme.
 * DB’den yönetilecek (30+ dil) olduğu için string kullanıyoruz.
 */
export type LocaleCode = string;

export type LibraryMerged = {
  id: string;
  type: string;

  category_id: string | null;
  sub_category_id: string | null;

  featured: 0 | 1;
  is_published: 0 | 1;
  is_active: 0 | 1;
  display_order: number;

  featured_image: string | null;
  image_url: string | null;
  image_asset_id: string | null;

  views: number;
  download_count: number;

  published_at: Date | null;

  created_at: Date;
  updated_at: Date;

  // i18n coalesced
  slug: string | null;
  name: string | null;
  description: string | null;
  image_alt: string | null;

  tags: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;

  locale_resolved: string | null;
};

export type LibraryImageMerged = {
  id: string;
  library_id: string;
  image_asset_id: string | null;
  image_url: string | null;
  is_active: 0 | 1;
  display_order: number;
  created_at: Date;
  updated_at: Date;

  // i18n
  title: string | null;
  alt: string | null;
  caption: string | null;
  locale_resolved: string | null;
};

export type LibraryFileMerged = {
  id: string;
  library_id: string;

  asset_id: string | null;
  file_url: string | null;

  name: string;
  size_bytes: number | null;
  mime_type: string | null;

  // tags_json (db) => tags (dto)
  tags_json: string | null;

  is_active: 0 | 1;
  display_order: number;

  created_at: Date;
  updated_at: Date;

  // storage resolved
  file_bucket: string | null;
  file_path: string | null;
  file_public_url: string | null;
};

/* ----------------------- helpers ----------------------- */

const to01 = (v: unknown): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
};

const toDateOrNull = (v?: string): Date | null => {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
};

const parseOrder = (
  orderParam?: string,
  sort?: Sortable,
  ord?: 'asc' | 'desc',
): { col: Sortable; dir: 'asc' | 'desc' } | null => {
  const allowed: Sortable[] = [
    'created_at',
    'updated_at',
    'published_at',
    'display_order',
    'views',
    'download_count',
  ];

  if (orderParam) {
    const m = orderParam.match(/^([a-zA-Z0-9_]+)\.(asc|desc)$/);
    const col = m?.[1] as Sortable | undefined;
    const dir = m?.[2] as 'asc' | 'desc' | undefined;
    if (col && dir && allowed.includes(col)) return { col, dir };
  }

  if (sort && ord && allowed.includes(sort)) return { col: sort, dir: ord };
  return null;
};

async function getAppLocales(): Promise<string[]> {
  await ensureLocalesLoadedFromSettings();
  return [...LOCALES];
}

/**
 * READ-TIME select:
 * - featured_image <-> image_url legacy uyumu (COALESCE)
 * - i18n alanları request locale -> default locale fallback
 */
function baseSelect(iReq: any, iDef: any) {
  return {
    id: library.id,
    type: library.type,

    category_id: library.category_id,
    sub_category_id: library.sub_category_id,

    featured: library.featured,
    is_published: library.is_published,
    is_active: library.is_active,
    display_order: library.display_order,

    // ✅ READ-TIME COALESCE (kapak uyumu) — nullable olmalı
    featured_image: sql<
      string | null
    >`COALESCE(${library.featured_image}, ${library.image_url})`.as('featured_image'),
    image_url: sql<string | null>`COALESCE(${library.image_url}, ${library.featured_image})`.as(
      'image_url',
    ),
    image_asset_id: library.image_asset_id,

    views: library.views,
    download_count: library.download_count,
    published_at: library.published_at,

    created_at: library.created_at,
    updated_at: library.updated_at,

    // i18n (schema: slug/name/description/image_alt/tags/meta_*)
    slug: sql<string | null>`COALESCE(${iReq.slug}, ${iDef.slug})`.as('slug'),
    name: sql<string | null>`COALESCE(${iReq.name}, ${iDef.name})`.as('name'),
    description: sql<string | null>`COALESCE(${iReq.description}, ${iDef.description})`.as(
      'description',
    ),
    image_alt: sql<string | null>`COALESCE(${iReq.image_alt}, ${iDef.image_alt})`.as('image_alt'),

    tags: sql<string | null>`COALESCE(${iReq.tags}, ${iDef.tags})`.as('tags'),
    meta_title: sql<string | null>`COALESCE(${iReq.meta_title}, ${iDef.meta_title})`.as(
      'meta_title',
    ),
    meta_description: sql<
      string | null
    >`COALESCE(${iReq.meta_description}, ${iDef.meta_description})`.as('meta_description'),
    meta_keywords: sql<string | null>`COALESCE(${iReq.meta_keywords}, ${iDef.meta_keywords})`.as(
      'meta_keywords',
    ),

    locale_resolved: sql<string | null>`
      CASE WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale} ELSE ${iDef.locale} END
    `.as('locale_resolved'),
  };
}

function imgSelect(iReq: any, iDef: any, sa: any) {
  return {
    id: libraryImages.id,
    library_id: libraryImages.library_id,
    image_asset_id: libraryImages.image_asset_id,
    image_url: libraryImages.image_url,
    is_active: libraryImages.is_active,
    display_order: libraryImages.display_order,
    created_at: libraryImages.created_at,
    updated_at: libraryImages.updated_at,

    title: sql<string | null>`COALESCE(${iReq.title}, ${iDef.title})`.as('title'),
    alt: sql<string | null>`COALESCE(${iReq.alt}, ${iDef.alt})`.as('alt'),
    caption: sql<string | null>`COALESCE(${iReq.caption}, ${iDef.caption})`.as('caption'),
    locale_resolved: sql<string | null>`
      CASE WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale} ELSE ${iDef.locale} END
    `.as('locale_resolved'),

    img_bucket: sa.bucket,
    img_path: sa.path,
    img_asset_url: sa.url,
  };
}

function fileSelect(sa: any) {
  return {
    id: libraryFiles.id,
    library_id: libraryFiles.library_id,

    asset_id: libraryFiles.asset_id,
    file_url: libraryFiles.file_url,

    name: libraryFiles.name,
    size_bytes: libraryFiles.size_bytes,
    mime_type: libraryFiles.mime_type,
    tags_json: libraryFiles.tags_json,

    is_active: libraryFiles.is_active,
    display_order: libraryFiles.display_order,

    created_at: libraryFiles.created_at,
    updated_at: libraryFiles.updated_at,

    file_bucket: sa.bucket,
    file_path: sa.path,
    file_asset_url: sa.url,
  };
}

/* ----------------------- list / get ----------------------- */

export async function listLibrary(params: {
  locale: LocaleCode;
  defaultLocale: LocaleCode;
  orderParam?: string;
  sort?: Sortable;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;

  q?: string;
  type?: string;

  category_id?: string;
  sub_category_id?: string;

  module_key?: string;

  featured?: BoolLike;
  is_published?: BoolLike;
  is_active?: BoolLike;

  published_before?: string;
  published_after?: string;
}) {
  const iReq = alias(libraryI18n, 'li_req');
  const iDef = alias(libraryI18n, 'li_def');

  const c = alias(categories, 'c');
  const ciReq = alias(categoryI18n, 'ci_req');
  const ciDef = alias(categoryI18n, 'ci_def');

  const filters: SQL[] = [];

  const featured = to01(params.featured);
  const active = to01(params.is_active);
  const published = to01(params.is_published);

  if (featured !== undefined) filters.push(eq(library.featured, featured));
  if (active !== undefined) filters.push(eq(library.is_active, active));
  if (published !== undefined) filters.push(eq(library.is_published, published));

  if (params.type) filters.push(eq(library.type, params.type));
  if (params.category_id) filters.push(eq(library.category_id, params.category_id));
  if (params.sub_category_id) filters.push(eq(library.sub_category_id, params.sub_category_id));

  if (params.module_key) {
    // categories.module_key üzerinden filtre (category join şart)
    filters.push(eq(c.module_key, params.module_key));
  }

  // ✅ Date filterler: string -> Date normalize
  const before = toDateOrNull(params.published_before);
  if (before) {
    filters.push(sql`${library.published_at} IS NOT NULL AND ${library.published_at} < ${before}`);
  }

  const after = toDateOrNull(params.published_after);
  if (after) {
    filters.push(sql`${library.published_at} IS NOT NULL AND ${library.published_at} > ${after}`);
  }

  if (params.q && params.q.trim()) {
    const s = `%${params.q.trim()}%`;
    filters.push(sql`
      (
        COALESCE(${iReq.name}, ${iDef.name}) LIKE ${s}
        OR COALESCE(${iReq.slug}, ${iDef.slug}) LIKE ${s}
        OR COALESCE(${iReq.description}, ${iDef.description}) LIKE ${s}
        OR COALESCE(${iReq.tags}, ${iDef.tags}) LIKE ${s}
      )
    `);
  }

  const whereExpr: SQL = filters.length > 0 ? (and(...filters) as SQL) : sql`1=1`;

  const ord = parseOrder(params.orderParam, params.sort, params.order);
  const orderBy = ord
    ? ord.dir === 'asc'
      ? asc((library as any)[ord.col])
      : desc((library as any)[ord.col])
    : asc(library.display_order);

  const take = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;

  // category join: module_key filtresi için gerekli; aksi halde LEFT JOIN maliyetini artırmaz
  let qBase = db
    .select(baseSelect(iReq, iDef))
    .from(library)
    .leftJoin(iReq, and(eq(iReq.library_id, library.id), eq(iReq.locale, params.locale)))
    .leftJoin(iDef, and(eq(iDef.library_id, library.id), eq(iDef.locale, params.defaultLocale))) as any;

  if (params.module_key) {
    qBase = qBase
      .leftJoin(c, eq(c.id, library.category_id))
      .leftJoin(ciReq, and(eq(ciReq.category_id, c.id), eq(ciReq.locale, params.locale)))
      .leftJoin(ciDef, and(eq(ciDef.category_id, c.id), eq(ciDef.locale, params.defaultLocale)));
  }

  const rows = await qBase.where(whereExpr).orderBy(orderBy).limit(take).offset(skip);

  let cntBase = db
    .select({ c: sql<number>`COUNT(1)` })
    .from(library)
    .leftJoin(iReq, and(eq(iReq.library_id, library.id), eq(iReq.locale, params.locale)))
    .leftJoin(iDef, and(eq(iDef.library_id, library.id), eq(iDef.locale, params.defaultLocale))) as any;

  if (params.module_key) {
    cntBase = cntBase.leftJoin(c, eq(c.id, library.category_id));
  }

  const cnt = await cntBase.where(whereExpr);

  const total = cnt[0]?.c ?? 0;
  return { items: rows as unknown as LibraryMerged[], total };
}

export async function getLibraryMergedById(
  locale: LocaleCode,
  defaultLocale: LocaleCode,
  id: string,
) {
  const iReq = alias(libraryI18n, 'li_req');
  const iDef = alias(libraryI18n, 'li_def');

  const rows = await db
    .select(baseSelect(iReq, iDef))
    .from(library)
    .leftJoin(iReq, and(eq(iReq.library_id, library.id), eq(iReq.locale, locale)))
    .leftJoin(iDef, and(eq(iDef.library_id, library.id), eq(iDef.locale, defaultLocale)))
    .where(eq(library.id, id))
    .limit(1);

  return (rows[0] ?? null) as unknown as LibraryMerged | null;
}

export async function getLibraryMergedBySlug(
  locale: LocaleCode,
  defaultLocale: LocaleCode,
  slug: string,
) {
  const iReq = alias(libraryI18n, 'li_req');
  const iDef = alias(libraryI18n, 'li_def');

  const rows = await db
    .select(baseSelect(iReq, iDef))
    .from(library)
    .leftJoin(iReq, and(eq(iReq.library_id, library.id), eq(iReq.locale, locale)))
    .leftJoin(iDef, and(eq(iDef.library_id, library.id), eq(iDef.locale, defaultLocale)))
    .where(
      sql`( ${iReq.id} IS NOT NULL AND ${iReq.slug} = ${slug} )
           OR ( ${iReq.id} IS NULL AND ${iDef.slug} = ${slug} )`,
    )
    .limit(1);

  return (rows[0] ?? null) as unknown as LibraryMerged | null;
}

/* ----------------------- create/update/delete (parent + i18n) ----------------------- */

export async function createLibraryParent(values: NewLibraryRow) {
  await db.insert(library).values(values);
  return values.id;
}

export async function upsertLibraryI18n(
  libraryId: string,
  locale: LocaleCode,
  data: Partial<
    Omit<NewLibraryI18nRow, 'id' | 'library_id' | 'locale' | 'created_at' | 'updated_at'>
  > & { id?: string },
) {
  const insertVals: NewLibraryI18nRow = {
    id: data.id ?? randomUUID(),
    library_id: libraryId,
    locale,

    // NOT NULL kolonlar: slug/name — burada boş string fallback veriyoruz
    slug: typeof data.slug === 'string' ? data.slug : '',
    name: typeof data.name === 'string' ? data.name : '',

    description: typeof data.description === 'string' ? data.description : null,
    image_alt: typeof data.image_alt === 'string' ? data.image_alt : null,

    tags: typeof data.tags === 'string' ? data.tags : null,
    meta_title: typeof data.meta_title === 'string' ? data.meta_title : null,
    meta_description: typeof data.meta_description === 'string' ? data.meta_description : null,
    meta_keywords: typeof data.meta_keywords === 'string' ? data.meta_keywords : null,

    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  for (const k of [
    'slug',
    'name',
    'description',
    'image_alt',
    'tags',
    'meta_title',
    'meta_description',
    'meta_keywords',
  ] as const) {
    if (typeof (data as any)[k] !== 'undefined') (setObj as any)[k] = (data as any)[k];
  }
  setObj.updated_at = new Date();

  // sadece updated_at set edilecekse boşuna upsert yapma
  if (Object.keys(setObj).length === 1) return;

  await db.insert(libraryI18n).values(insertVals).onDuplicateKeyUpdate({ set: setObj });
}

/**
 * ✅ Tüm dillere kopyalama artık LOCALES sabiti “runtime load” ile güncel.
 */
export async function upsertLibraryI18nAllLocales(
  libraryId: string,
  data: Partial<
    Omit<NewLibraryI18nRow, 'id' | 'library_id' | 'locale' | 'created_at' | 'updated_at'>
  >,
) {
  const locales = await getAppLocales();
  for (const L of locales) {
    await upsertLibraryI18n(libraryId, L, data);
  }
}

export async function updateLibraryParent(id: string, patch: Partial<NewLibraryRow>) {
  await db
    .update(library)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(library.id, id));
}

export async function deleteLibraryParent(id: string) {
  const res = await db.delete(library).where(eq(library.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === 'number'
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}

/* ----------------------- images ----------------------- */

export async function listLibraryImages(params: {
  libraryId: string;
  locale: LocaleCode;
  defaultLocale: LocaleCode;
  onlyActive?: boolean;
}) {
  const iReq = alias(libraryImagesI18n, 'limg_req');
  const iDef = alias(libraryImagesI18n, 'limg_def');
  const saImg = alias(storageAssets, 'sa_img');

  const where =
    params.onlyActive === true
      ? and(eq(libraryImages.library_id, params.libraryId), eq(libraryImages.is_active, 1))
      : and(eq(libraryImages.library_id, params.libraryId), sql`1=1`);

  const rows = await db
    .select(imgSelect(iReq, iDef, saImg))
    .from(libraryImages)
    .leftJoin(iReq, and(eq(iReq.image_id, libraryImages.id), eq(iReq.locale, params.locale)))
    .leftJoin(iDef, and(eq(iDef.image_id, libraryImages.id), eq(iDef.locale, params.defaultLocale)))
    .leftJoin(saImg, eq(saImg.id, libraryImages.image_asset_id))
    .where(where)
    .orderBy(asc(libraryImages.display_order), asc(libraryImages.created_at));

  return (rows as any[]).map(
    (r): LibraryImageMerged => ({
      id: r.id,
      library_id: r.library_id,
      image_asset_id: r.image_asset_id ?? null,
      image_url:
        r.image_url ||
        (r.img_bucket && r.img_path
          ? publicUrlOf(
              r.img_bucket as string,
              r.img_path as string,
              r.img_asset_url as string | null,
            )
          : null),
      is_active: r.is_active,
      display_order: r.display_order,
      created_at: r.created_at,
      updated_at: r.updated_at,
      title: r.title ?? null,
      alt: r.alt ?? null,
      caption: r.caption ?? null,
      locale_resolved: r.locale_resolved ?? null,
    }),
  );
}

export async function createLibraryImage(values: NewLibraryImageRow) {
  await db.insert(libraryImages).values(values);
  return values.id;
}

export async function upsertLibraryImageI18n(
  imageId: string,
  locale: LocaleCode,
  data: Partial<
    Omit<NewLibraryImageI18nRow, 'id' | 'image_id' | 'locale' | 'created_at' | 'updated_at'>
  > & { id?: string },
) {
  const insertVals: NewLibraryImageI18nRow = {
    id: data.id ?? randomUUID(),
    image_id: imageId,
    locale,
    title: typeof data.title === 'string' ? data.title : (null as any),
    alt: typeof data.alt === 'string' ? data.alt : (null as any),
    caption: typeof data.caption === 'string' ? data.caption : (null as any),
    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  for (const k of ['title', 'alt', 'caption'] as const) {
    if (typeof (data as any)[k] !== 'undefined') (setObj as any)[k] = (data as any)[k];
  }
  setObj.updated_at = new Date();

  if (Object.keys(setObj).length === 1) return;

  await db.insert(libraryImagesI18n).values(insertVals).onDuplicateKeyUpdate({ set: setObj });
}

export async function upsertLibraryImageI18nAllLocales(
  imageId: string,
  data: Partial<
    Omit<NewLibraryImageI18nRow, 'id' | 'image_id' | 'locale' | 'created_at' | 'updated_at'>
  >,
) {
  const locales = await getAppLocales();
  for (const L of locales) {
    await upsertLibraryImageI18n(imageId, L, data);
  }
}

export async function updateLibraryImage(id: string, patch: Partial<NewLibraryImageRow>) {
  await db
    .update(libraryImages)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(libraryImages.id, id));
}

export async function deleteLibraryImage(id: string) {
  const res = await db.delete(libraryImages).where(eq(libraryImages.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === 'number'
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}

/* ----------------------- files ----------------------- */

export async function listLibraryFiles(params: { libraryId: string; onlyActive?: boolean }) {
  const saFile = alias(storageAssets, 'sa_file');

  const where =
    params.onlyActive === true
      ? and(eq(libraryFiles.library_id, params.libraryId), eq(libraryFiles.is_active, 1))
      : and(eq(libraryFiles.library_id, params.libraryId), sql`1=1`);

  const rows = await db
    .select(fileSelect(saFile))
    .from(libraryFiles)
    .leftJoin(saFile, eq(saFile.id, libraryFiles.asset_id))
    .where(where)
    .orderBy(asc(libraryFiles.display_order), asc(libraryFiles.created_at));

  return (rows as any[]).map((r): LibraryFileMerged => {
    const resolved =
      r.file_url ||
      (r.file_bucket && r.file_path
        ? publicUrlOf(
            r.file_bucket as string,
            r.file_path as string,
            r.file_asset_url as string | null,
          )
        : null);

    return {
      id: r.id,
      library_id: r.library_id,

      asset_id: r.asset_id ?? null,
      file_url: resolved,

      name: r.name,
      size_bytes: typeof r.size_bytes === 'number' ? r.size_bytes : r.size_bytes ?? null,
      mime_type: r.mime_type ?? null,

      tags_json: r.tags_json ?? null,

      is_active: r.is_active,
      display_order: r.display_order,

      created_at: r.created_at,
      updated_at: r.updated_at,

      file_bucket: r.file_bucket ?? null,
      file_path: r.file_path ?? null,
      file_public_url: resolved,
    };
  });
}

export async function createLibraryFile(values: NewLibraryFileRow) {
  await db.insert(libraryFiles).values(values);
  return values.id;
}

export async function updateLibraryFile(id: string, patch: Partial<NewLibraryFileRow>) {
  await db
    .update(libraryFiles)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(libraryFiles.id, id));
}

export async function deleteLibraryFile(id: string) {
  const res = await db.delete(libraryFiles).where(eq(libraryFiles.id, id)).execute();
  const affected =
    typeof (res as unknown as { affectedRows?: number }).affectedRows === 'number'
      ? (res as unknown as { affectedRows: number }).affectedRows
      : 0;
  return affected;
}

/* ----------------------- reorder ----------------------- */

export async function reorderLibrary(items: { id: string; display_order: number }[]) {
  if (!items || !items.length) return;

  const now = new Date() as any;

  await db.transaction(async (tx) => {
    for (const it of items) {
      if (!it.id || typeof it.display_order !== 'number') continue;

      await tx
        .update(library)
        .set({ display_order: it.display_order, updated_at: now })
        .where(eq(library.id, it.id));
    }
  });
}

/* ----------------------- download tracking ----------------------- */

export async function repoTrackDownload(id: string) {
  await db
    .update(library)
    .set({ download_count: sql`${library.download_count} + 1` })
    .where(eq(library.id, id));
}
