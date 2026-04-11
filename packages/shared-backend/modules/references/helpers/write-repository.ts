// src/modules/references/helpers/write-repository.ts
// Admin write DB operations for references
import { db } from '../../../db/client';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import {
  referenceImages,
  referenceImagesI18n,
  referencesTable,
  referencesI18n,
  type NewReferenceImageI18nRow,
  type NewReferenceImageRow,
  type NewReferenceRow,
  type NewReferenceI18nRow,
} from '../schema';
import { getAppLocales } from '../../siteSettings';
type Locale = string;

export async function repoCreateReferenceParent(values: NewReferenceRow) {
  await db.insert(referencesTable).values(values);
  return values.id;
}

export async function repoUpdateReferenceParent(id: string, patch: Partial<NewReferenceRow>) {
  await db.update(referencesTable)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(referencesTable.id, id));
}

export async function repoDeleteReferenceParent(id: string) {
  const res = await db.delete(referencesTable).where(eq(referencesTable.id, id)).execute();
  const affected = typeof (res as unknown as { affectedRows?: number }).affectedRows === 'number'
    ? (res as unknown as { affectedRows: number }).affectedRows
    : 0;
  return affected;
}

export async function repoGetReferenceI18nRow(referenceId: string, locale: Locale) {
  const rows = await db.select().from(referencesI18n)
    .where(and(eq(referencesI18n.reference_id, referenceId), eq(referencesI18n.locale, locale)))
    .limit(1);
  return rows[0] ?? null;
}

export async function repoUpsertReferenceI18n(
  referenceId: string,
  locale: Locale,
  data: Partial<Pick<NewReferenceI18nRow, 'title' | 'slug' | 'summary' | 'content' | 'featured_image_alt' | 'meta_title' | 'meta_description'>> & { id?: string },
) {
  const insertVals: NewReferenceI18nRow = {
    id: data.id ?? randomUUID(),
    reference_id: referenceId,
    locale,
    title: data.title ?? '',
    slug: data.slug ?? '',
    content: data.content != null ? data.content : JSON.stringify({ html: '' }),
    summary: typeof data.summary === 'undefined' ? (null as any) : data.summary ?? null,
    featured_image_alt: typeof data.featured_image_alt === 'undefined' ? (null as any) : data.featured_image_alt ?? null,
    meta_title: typeof data.meta_title === 'undefined' ? (null as any) : data.meta_title ?? null,
    meta_description: typeof data.meta_description === 'undefined' ? (null as any) : data.meta_description ?? null,
    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  if (typeof data.title !== 'undefined') setObj.title = data.title;
  if (typeof data.slug !== 'undefined') setObj.slug = data.slug;
  if (typeof data.content !== 'undefined') setObj.content = data.content;
  if (typeof data.summary !== 'undefined') setObj.summary = data.summary ?? null;
  if (typeof data.featured_image_alt !== 'undefined') setObj.featured_image_alt = data.featured_image_alt ?? null;
  if (typeof data.meta_title !== 'undefined') setObj.meta_title = data.meta_title ?? null;
  if (typeof data.meta_description !== 'undefined') setObj.meta_description = data.meta_description ?? null;
  setObj.updated_at = new Date();

  if (Object.keys(setObj).length === 1) return;

  await db.insert(referencesI18n).values(insertVals).onDuplicateKeyUpdate({ set: setObj });
}

export async function repoCreateReferenceImage(values: NewReferenceImageRow) {
  await db.insert(referenceImages).values(values);
  return values.id;
}

export async function repoUpdateReferenceImage(id: string, patch: Partial<NewReferenceImageRow>) {
  await db.update(referenceImages)
    .set({ ...patch, updated_at: new Date() as any })
    .where(eq(referenceImages.id, id));
}

export async function repoDeleteReferenceImage(id: string) {
  const res = await db.delete(referenceImages).where(eq(referenceImages.id, id)).execute();
  const affected = typeof (res as unknown as { affectedRows?: number }).affectedRows === 'number'
    ? (res as unknown as { affectedRows: number }).affectedRows
    : 0;
  return affected;
}

export async function repoUpsertReferenceImageI18n(
  imageId: string,
  locale: Locale,
  data: Partial<Pick<NewReferenceImageI18nRow, 'title' | 'alt'>> & { id?: string },
) {
  const insertVals: NewReferenceImageI18nRow = {
    id: data.id ?? randomUUID(),
    image_id: imageId,
    locale,
    title: typeof data.title === 'string' ? data.title : (null as any),
    alt: typeof data.alt === 'string' ? data.alt : (null as any),
    created_at: new Date() as any,
    updated_at: new Date() as any,
  };

  const setObj: Record<string, any> = {};
  if (typeof data.title !== 'undefined') setObj.title = data.title ?? null;
  if (typeof data.alt !== 'undefined') setObj.alt = data.alt ?? null;
  setObj.updated_at = new Date();

  if (Object.keys(setObj).length === 1) return;

  await db.insert(referenceImagesI18n).values(insertVals).onDuplicateKeyUpdate({ set: setObj });
}

export async function repoUpsertReferenceImageI18nAllLocales(
  imageId: string,
  data: Partial<Pick<NewReferenceImageI18nRow, 'title' | 'alt'>>,
) {
  const locales = await getAppLocales();
  for (const locale of locales) {
    await repoUpsertReferenceImageI18n(imageId, locale, data);
  }
}
