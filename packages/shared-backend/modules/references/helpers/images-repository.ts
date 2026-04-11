// src/modules/references/helpers/images-repository.ts
// Gallery image read helpers for references
import { db } from '../../../db/client';
import { and, asc, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { referenceImages, referenceImagesI18n } from '../schema';
type Locale = string;

export type ReferenceImageMerged = {
  id: string;
  reference_id: string;
  storage_asset_id: string | null;
  image_url: string | null;
  display_order: number;
  is_published: 0 | 1;
  is_featured: 0 | 1;
  alt: string | null;
  title: string | null;
  locale_resolved: string | null;
};

export async function repoListReferenceImages(
  referenceId: string,
  locale: Locale,
  defaultLocale: Locale,
): Promise<ReferenceImageMerged[]> {
  const i18nReq = alias(referenceImagesI18n, 'imgi_req');
  const i18nDef = alias(referenceImagesI18n, 'imgi_def');

  const rows = await db
    .select({
      id: referenceImages.id,
      reference_id: referenceImages.reference_id,
      storage_asset_id: referenceImages.storage_asset_id,
      image_url: referenceImages.image_url,
      display_order: referenceImages.display_order,
      is_published: referenceImages.is_published,
      is_featured: referenceImages.is_featured,
      alt: sql<string>`COALESCE(${i18nReq.alt}, ${i18nDef.alt})`.as('alt'),
      title: sql<string>`COALESCE(${i18nReq.title}, ${i18nDef.title})`.as('title'),
      locale_resolved: sql<string>`
        CASE WHEN ${i18nReq.id} IS NOT NULL THEN ${i18nReq.locale} ELSE ${i18nDef.locale} END
      `.as('locale_resolved'),
    })
    .from(referenceImages)
    .leftJoin(i18nReq, and(eq(i18nReq.image_id, referenceImages.id), eq(i18nReq.locale, locale)))
    .leftJoin(i18nDef, and(eq(i18nDef.image_id, referenceImages.id), eq(i18nDef.locale, defaultLocale)))
    .where(eq(referenceImages.reference_id, referenceId))
    .orderBy(asc(referenceImages.display_order), asc(referenceImages.created_at));

  return rows as ReferenceImageMerged[];
}
