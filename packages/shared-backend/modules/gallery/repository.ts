// src/modules/gallery/repository.ts
import { and, asc, desc, eq, like, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { randomUUID } from 'crypto';
import {
  galleries,
  galleryI18n,
  galleryImages,
  galleryImageI18n,
} from './schema';
import { storageAssets } from '../storage/schema';
import { toBool } from '../_shared';

/* ---- types ---- */
export type GalleryListParams = {
  module_key?: string;
  source_type?: string;
  source_id?: string;
  locale?: string;
  is_active?: boolean;
  is_featured?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
  sort?: 'display_order' | 'created_at';
  order?: 'asc' | 'desc';
};

/* ---- list ---- */
export async function repoListGalleries(params: GalleryListParams) {
  const locale = params.locale || 'tr';
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const conds: any[] = [eq(galleryI18n.locale, locale)];
  if (params.module_key) conds.push(eq(galleries.module_key, params.module_key));
  if (params.source_type) conds.push(eq(galleries.source_type, params.source_type));
  if (params.source_id) conds.push(eq(galleries.source_id, params.source_id));
  if (params.is_active !== undefined) conds.push(eq(galleries.is_active, params.is_active));
  if (params.is_featured !== undefined) conds.push(eq(galleries.is_featured, params.is_featured));
  if (params.q) conds.push(like(galleryI18n.title, `%${params.q}%`));

  const sortCol = params.sort === 'created_at' ? galleries.created_at : galleries.display_order;
  const orderFn = params.order === 'desc' ? desc : asc;

  const countSub = db
    .select({
      gallery_id: galleryImages.gallery_id,
      image_count: sql<number>`COUNT(*)`.as('image_count'),
    })
    .from(galleryImages)
    .groupBy(galleryImages.gallery_id)
    .as('count_sub');

  const rows = await db
    .select({
      id: galleries.id,
      module_key: galleries.module_key,
      source_id: galleries.source_id,
      source_type: galleries.source_type,
      is_active: galleries.is_active,
      is_featured: galleries.is_featured,
      display_order: galleries.display_order,
      created_at: galleries.created_at,
      title: galleryI18n.title,
      slug: galleryI18n.slug,
      description: galleryI18n.description,
      meta_title: galleryI18n.meta_title,
      meta_description: galleryI18n.meta_description,
      cover_image_url: sql<string>`(
        SELECT COALESCE(sa.url, gi.image_url)
        FROM gallery_images gi
        LEFT JOIN storage_assets sa ON gi.storage_asset_id = sa.id
        WHERE gi.gallery_id = ${galleries.id}
        ORDER BY gi.is_cover DESC, gi.display_order ASC
        LIMIT 1
      )`.as('cover_image_url'),
      image_count: countSub.image_count,
    })
    .from(galleries)
    .innerJoin(galleryI18n, eq(galleries.id, galleryI18n.gallery_id))
    .leftJoin(countSub, eq(galleries.id, countSub.gallery_id))
    .where(and(...conds))
    .orderBy(orderFn(sortCol))
    .limit(limit)
    .offset(offset);

  const [countRow] = await db
    .select({ total: sql<number>`COUNT(*)` })
    .from(galleries)
    .innerJoin(galleryI18n, eq(galleries.id, galleryI18n.gallery_id))
    .where(and(...conds));

  return { items: rows, total: Number(countRow?.total ?? 0) };
}

/* ---- get by slug ---- */
export async function repoGetGalleryBySlug(slug: string, locale: string) {
  const [gallery] = await db
    .select({
      id: galleries.id,
      module_key: galleries.module_key,
      source_id: galleries.source_id,
      source_type: galleries.source_type,
      is_active: galleries.is_active,
      is_featured: galleries.is_featured,
      display_order: galleries.display_order,
      created_at: galleries.created_at,
      title: galleryI18n.title,
      slug: galleryI18n.slug,
      description: galleryI18n.description,
      meta_title: galleryI18n.meta_title,
      meta_description: galleryI18n.meta_description,
    })
    .from(galleries)
    .innerJoin(galleryI18n, eq(galleries.id, galleryI18n.gallery_id))
    .where(and(eq(galleryI18n.slug, slug), eq(galleryI18n.locale, locale), eq(galleries.is_active, true)))
    .limit(1);

  if (!gallery) return null;
  const images = await repoGetGalleryImages(gallery.id, locale);
  return { ...gallery, images };
}

/* ---- get by id ---- */
export async function repoGetGalleryById(id: string, locale: string) {
  const [gallery] = await db
    .select({
      id: galleries.id,
      module_key: galleries.module_key,
      source_id: galleries.source_id,
      source_type: galleries.source_type,
      is_active: galleries.is_active,
      is_featured: galleries.is_featured,
      display_order: galleries.display_order,
      created_at: galleries.created_at,
      title: galleryI18n.title,
      slug: galleryI18n.slug,
      description: galleryI18n.description,
      meta_title: galleryI18n.meta_title,
      meta_description: galleryI18n.meta_description,
    })
    .from(galleries)
    .leftJoin(galleryI18n, and(eq(galleries.id, galleryI18n.gallery_id), eq(galleryI18n.locale, locale)))
    .where(eq(galleries.id, id))
    .limit(1);

  if (!gallery) return null;
  const images = await repoGetGalleryImages(gallery.id, locale);
  return { ...gallery, images };
}

/* ---- gallery images ---- */
export async function repoGetGalleryImages(galleryId: string, locale: string) {
  return db
    .select({
      id: galleryImages.id,
      storage_asset_id: galleryImages.storage_asset_id,
      image_url: galleryImages.image_url,
      display_order: galleryImages.display_order,
      is_cover: galleryImages.is_cover,
      alt: galleryImageI18n.alt,
      caption: galleryImageI18n.caption,
      asset_url: storageAssets.url,
      asset_width: storageAssets.width,
      asset_height: storageAssets.height,
      asset_mime: storageAssets.mime,
    })
    .from(galleryImages)
    .leftJoin(galleryImageI18n, and(eq(galleryImages.id, galleryImageI18n.image_id), eq(galleryImageI18n.locale, locale)))
    .leftJoin(storageAssets, eq(galleryImages.storage_asset_id, storageAssets.id))
    .where(eq(galleryImages.gallery_id, galleryId))
    .orderBy(asc(galleryImages.display_order));
}
