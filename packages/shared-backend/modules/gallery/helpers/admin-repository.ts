// src/modules/gallery/helpers/admin-repository.ts
// DB write operations for admin gallery CRUD
import { and, eq } from 'drizzle-orm';
import { db } from '../../../db/client';
import { randomUUID } from 'crypto';
import { galleries, galleryI18n, galleryImages, galleryImageI18n } from '../schema';
import { toBool } from '../../_shared';
import type { GalleryCreateInput, GalleryImageCreateInput, GalleryBulkImagesInput } from '../validation';

/* ---- gallery CRUD ---- */

export async function repoCreateGallery(body: GalleryCreateInput, locale: string) {
  const id = body.id || randomUUID();
  await db.insert(galleries).values({
    id,
    module_key: body.module_key,
    source_id: body.source_id ?? null,
    source_type: body.source_type,
    is_active: toBool(body.is_active) as any,
    is_featured: toBool(body.is_featured) as any,
    display_order: body.display_order ?? 0,
  });
  await db.insert(galleryI18n).values({
    gallery_id: id,
    locale,
    title: body.title,
    slug: body.slug,
    description: body.description ?? null,
    meta_title: body.meta_title ?? null,
    meta_description: body.meta_description ?? null,
  });
  return id;
}

export async function repoUpdateGallery(id: string, body: Record<string, any>, locale: string) {
  const baseFields: Record<string, any> = {};
  if (body.module_key !== undefined) baseFields.module_key = body.module_key;
  if (body.source_id !== undefined) baseFields.source_id = body.source_id;
  if (body.source_type !== undefined) baseFields.source_type = body.source_type || 'standalone';
  if (body.is_active !== undefined) baseFields.is_active = toBool(body.is_active);
  if (body.is_featured !== undefined) baseFields.is_featured = toBool(body.is_featured);
  if (body.display_order !== undefined) baseFields.display_order = body.display_order;

  if (Object.keys(baseFields).length) {
    await db.update(galleries).set(baseFields).where(eq(galleries.id, id));
  }

  const i18nFields: Record<string, any> = {};
  if (body.title !== undefined) i18nFields.title = body.title;
  if (body.slug !== undefined) i18nFields.slug = body.slug;
  if (body.description !== undefined) i18nFields.description = body.description;
  if (body.meta_title !== undefined) i18nFields.meta_title = body.meta_title;
  if (body.meta_description !== undefined) i18nFields.meta_description = body.meta_description;

  if (Object.keys(i18nFields).length) {
    const [existing] = await db
      .select({ gallery_id: galleryI18n.gallery_id })
      .from(galleryI18n)
      .where(and(eq(galleryI18n.gallery_id, id), eq(galleryI18n.locale, locale)))
      .limit(1);

    if (existing) {
      await db.update(galleryI18n).set(i18nFields)
        .where(and(eq(galleryI18n.gallery_id, id), eq(galleryI18n.locale, locale)));
    } else {
      await db.insert(galleryI18n).values({
        gallery_id: id,
        locale,
        title: body.title || '',
        slug: body.slug || '',
        ...i18nFields,
      });
    }
  }
}

export async function repoDeleteGallery(id: string) {
  await db.delete(galleries).where(eq(galleries.id, id));
}

export async function repoReorderGalleries(items: { id: string; display_order: number }[]) {
  for (const item of items) {
    await db.update(galleries).set({ display_order: item.display_order }).where(eq(galleries.id, item.id));
  }
}

/* ---- gallery images CRUD ---- */

export async function repoAddGalleryImage(galleryId: string, body: GalleryImageCreateInput, locale: string) {
  const imageId = body.id || randomUUID();
  await db.insert(galleryImages).values({
    id: imageId,
    gallery_id: galleryId,
    storage_asset_id: body.storage_asset_id ?? null,
    image_url: body.image_url ?? null,
    display_order: body.display_order ?? 0,
    is_cover: toBool(body.is_cover) as any,
  });
  if (body.alt || body.caption) {
    await db.insert(galleryImageI18n).values({
      image_id: imageId,
      locale,
      alt: body.alt ?? null,
      caption: body.caption ?? null,
    });
  }
  return imageId;
}

export async function repoBulkAddGalleryImages(galleryId: string, images: GalleryBulkImagesInput['images']) {
  const ids: string[] = [];
  for (const img of images) {
    const imageId = randomUUID();
    ids.push(imageId);
    await db.insert(galleryImages).values({
      id: imageId,
      gallery_id: galleryId,
      storage_asset_id: img.storage_asset_id ?? null,
      image_url: img.image_url ?? null,
      display_order: img.display_order ?? 0,
      is_cover: toBool(img.is_cover) as any,
    });
  }
  return ids;
}

export async function repoUpdateGalleryImage(imageId: string, body: Record<string, any>, locale: string) {
  const baseFields: Record<string, any> = {};
  if (body.storage_asset_id !== undefined) baseFields.storage_asset_id = body.storage_asset_id;
  if (body.image_url !== undefined) baseFields.image_url = body.image_url;
  if (body.display_order !== undefined) baseFields.display_order = body.display_order;
  if (body.is_cover !== undefined) baseFields.is_cover = toBool(body.is_cover);

  if (Object.keys(baseFields).length) {
    await db.update(galleryImages).set(baseFields).where(eq(galleryImages.id, imageId));
  }

  const i18nFields: Record<string, any> = {};
  if (body.alt !== undefined) i18nFields.alt = body.alt;
  if (body.caption !== undefined) i18nFields.caption = body.caption;

  if (Object.keys(i18nFields).length) {
    const [existing] = await db
      .select({ image_id: galleryImageI18n.image_id })
      .from(galleryImageI18n)
      .where(and(eq(galleryImageI18n.image_id, imageId), eq(galleryImageI18n.locale, locale)))
      .limit(1);

    if (existing) {
      await db.update(galleryImageI18n).set(i18nFields)
        .where(and(eq(galleryImageI18n.image_id, imageId), eq(galleryImageI18n.locale, locale)));
    } else {
      await db.insert(galleryImageI18n).values({
        image_id: imageId,
        locale,
        alt: body.alt ?? null,
        caption: body.caption ?? null,
        ...i18nFields,
      });
    }
  }
}

export async function repoDeleteGalleryImage(imageId: string) {
  await db.delete(galleryImages).where(eq(galleryImages.id, imageId));
}

export async function repoReorderGalleryImages(items: { id: string; display_order: number }[]) {
  for (const item of items) {
    await db.update(galleryImages).set({ display_order: item.display_order }).where(eq(galleryImages.id, item.id));
  }
}
