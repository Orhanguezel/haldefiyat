import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, like, or } from 'drizzle-orm';
import { db } from '../../db/client';
import { normalizeLocaleStr, toBool } from '../_shared';
import { customPages, customPagesI18n } from './schema';
import type { CreateCustomPageInput, ListQueryInput, UpdateCustomPageInput } from './validation';

type PageRow = {
  id: string;
  module_key: string;
  is_published: number;
  display_order: number;
  featured_image: string | null;
  storage_asset_id: string | null;
  images: string[] | null;
  storage_image_ids: string[] | null;
  created_at: string | Date;
  updated_at: string | Date;
  locale: string;
  title: string;
  slug: string;
  content: string | null;
  summary: string | null;
  meta_title: string | null;
  meta_description: string | null;
};

function pickLocalizedRow<T extends PageRow>(rows: T[], locale: string): T | null {
  if (!rows.length) return null;
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === 'tr') ?? rows[0] ?? null;
}

function buildPageConditions(params: ListQueryInput) {
  const conditions = [] as ReturnType<typeof eq>[];
  if (params.module_key) conditions.push(eq(customPages.module_key, params.module_key));
  if (params.is_published !== undefined) conditions.push(eq(customPages.is_published, toBool(params.is_published) ? 1 : 0));
  if (params.search) {
    const needle = `%${params.search}%`;
    conditions.push(or(like(customPagesI18n.title, needle), like(customPagesI18n.slug, needle))!);
  }
  return conditions;
}

export async function repoListCustomPages(params: ListQueryInput) {
  const locale = normalizeLocaleStr(params.locale) || 'tr';
  const conditions = buildPageConditions(params);
  const rows = await db
    .select({
      id: customPages.id,
      module_key: customPages.module_key,
      is_published: customPages.is_published,
      display_order: customPages.display_order,
      featured_image: customPages.featured_image,
      storage_asset_id: customPages.storage_asset_id,
      images: customPages.images,
      storage_image_ids: customPages.storage_image_ids,
      created_at: customPages.created_at,
      updated_at: customPages.updated_at,
      locale: customPagesI18n.locale,
      title: customPagesI18n.title,
      slug: customPagesI18n.slug,
      content: customPagesI18n.content,
      summary: customPagesI18n.summary,
      meta_title: customPagesI18n.meta_title,
      meta_description: customPagesI18n.meta_description,
    })
    .from(customPages)
    .innerJoin(customPagesI18n, eq(customPages.id, customPagesI18n.page_id))
    .where(and(...conditions, inArray(customPagesI18n.locale, [locale, 'tr'])))
    .orderBy(asc(customPages.display_order), asc(customPagesI18n.title));

  const picked = new Map<string, PageRow>();
  for (const row of rows) {
    const current = picked.get(row.id);
    const next = pickLocalizedRow([...(current ? [current] : []), row], locale);
    if (next) picked.set(row.id, next);
  }

  return Array.from(picked.values()).slice(params.offset, params.offset + params.limit);
}

export async function repoGetCustomPageById(id: string, locale = 'tr') {
  const rows = await db
    .select({
      id: customPages.id,
      module_key: customPages.module_key,
      is_published: customPages.is_published,
      display_order: customPages.display_order,
      featured_image: customPages.featured_image,
      storage_asset_id: customPages.storage_asset_id,
      images: customPages.images,
      storage_image_ids: customPages.storage_image_ids,
      created_at: customPages.created_at,
      updated_at: customPages.updated_at,
      locale: customPagesI18n.locale,
      title: customPagesI18n.title,
      slug: customPagesI18n.slug,
      content: customPagesI18n.content,
      summary: customPagesI18n.summary,
      meta_title: customPagesI18n.meta_title,
      meta_description: customPagesI18n.meta_description,
    })
    .from(customPages)
    .innerJoin(customPagesI18n, eq(customPages.id, customPagesI18n.page_id))
    .where(and(eq(customPages.id, id), inArray(customPagesI18n.locale, [locale, 'tr'])))
    .orderBy(desc(customPagesI18n.locale));

  return pickLocalizedRow(rows, locale);
}

export async function repoGetCustomPageBySlug(slug: string, locale = 'tr') {
  const rows = await db
    .select({
      id: customPages.id,
      module_key: customPages.module_key,
      is_published: customPages.is_published,
      display_order: customPages.display_order,
      featured_image: customPages.featured_image,
      storage_asset_id: customPages.storage_asset_id,
      images: customPages.images,
      storage_image_ids: customPages.storage_image_ids,
      created_at: customPages.created_at,
      updated_at: customPages.updated_at,
      locale: customPagesI18n.locale,
      title: customPagesI18n.title,
      slug: customPagesI18n.slug,
      content: customPagesI18n.content,
      summary: customPagesI18n.summary,
      meta_title: customPagesI18n.meta_title,
      meta_description: customPagesI18n.meta_description,
    })
    .from(customPages)
    .innerJoin(customPagesI18n, eq(customPages.id, customPagesI18n.page_id))
    .where(and(eq(customPagesI18n.slug, slug), inArray(customPagesI18n.locale, [locale, 'tr'])))
    .orderBy(desc(customPagesI18n.locale));

  return pickLocalizedRow(rows, locale);
}

export async function repoCreateCustomPage(data: CreateCustomPageInput) {
  const id = randomUUID();
  await db.insert(customPages).values({
    id,
    module_key: data.module_key,
    is_published: data.is_published !== undefined ? (toBool(data.is_published) ? 1 : 0) : 0,
    display_order: data.display_order ?? 0,
    featured_image: data.featured_image ?? null,
    storage_asset_id: data.storage_asset_id ?? null,
    images: data.images ?? [],
    storage_image_ids: data.storage_image_ids ?? [],
  });
  await db.insert(customPagesI18n).values({
    page_id: id,
    locale: data.locale,
    title: data.title,
    slug: data.slug,
    content: data.content ?? null,
    summary: data.summary ?? null,
    meta_title: data.meta_title ?? null,
    meta_description: data.meta_description ?? null,
  });
  return { id };
}

export async function repoUpdateCustomPage(id: string, data: UpdateCustomPageInput) {
  const pagePatch: Record<string, unknown> = {};
  if (data.module_key !== undefined) pagePatch.module_key = data.module_key;
  if (data.is_published !== undefined) pagePatch.is_published = toBool(data.is_published) ? 1 : 0;
  if (data.display_order !== undefined) pagePatch.display_order = data.display_order;
  if (data.featured_image !== undefined) pagePatch.featured_image = data.featured_image;
  if (data.storage_asset_id !== undefined) pagePatch.storage_asset_id = data.storage_asset_id;
  if (data.images !== undefined) pagePatch.images = data.images;
  if (data.storage_image_ids !== undefined) pagePatch.storage_image_ids = data.storage_image_ids;
  if (Object.keys(pagePatch).length) await db.update(customPages).set(pagePatch).where(eq(customPages.id, id));

  const i18nPatch: Record<string, unknown> = {};
  if (data.title !== undefined) i18nPatch.title = data.title;
  if (data.slug !== undefined) i18nPatch.slug = data.slug;
  if (data.content !== undefined) i18nPatch.content = data.content;
  if (data.summary !== undefined) i18nPatch.summary = data.summary;
  if (data.meta_title !== undefined) i18nPatch.meta_title = data.meta_title;
  if (data.meta_description !== undefined) i18nPatch.meta_description = data.meta_description;
  if (Object.keys(i18nPatch).length) {
    await db.update(customPagesI18n).set(i18nPatch).where(and(eq(customPagesI18n.page_id, id), eq(customPagesI18n.locale, data.locale)));
  }
}

export async function repoDeleteCustomPage(id: string) {
  await db.delete(customPages).where(eq(customPages.id, id));
}

export async function repoReorderCustomPages(items: { id: string; display_order: number }[]) {
  for (const item of items) {
    await db.update(customPages).set({ display_order: item.display_order }).where(eq(customPages.id, item.id));
  }
}
