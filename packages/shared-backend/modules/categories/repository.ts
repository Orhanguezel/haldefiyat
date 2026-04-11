// src/modules/categories/repository.ts

import { db } from '../../db/client';
import { eq, and, like, or, asc } from 'drizzle-orm';
import { categories, categoryI18n } from './schema';
import { randomUUID } from 'crypto';
import { toBool } from '../_shared';

type ListParams = {
  locale?: string;
  module_key?: string;
  search?: string;
  is_active?: unknown;
  is_featured?: unknown;
};

export async function repoListCategories(params: ListParams) {
  const locale = params.locale || 'tr';

  const conditions: ReturnType<typeof eq>[] = [eq(categoryI18n.locale, locale)];

  if (params.module_key) {
    conditions.push(eq(categories.module_key, params.module_key));
  }
  if (params.is_active !== undefined) {
    conditions.push(eq(categories.is_active, toBool(params.is_active) ? 1 : 0));
  }
  if (params.is_featured !== undefined) {
    conditions.push(eq(categories.is_featured, toBool(params.is_featured) ? 1 : 0));
  }
  if (params.search) {
    const s = `%${params.search}%`;
    conditions.push(or(like(categoryI18n.name, s), like(categoryI18n.slug, s))!);
  }

  const rows = await db
    .select({
      id: categories.id,
      module_key: categories.module_key,
      image_url: categories.image_url,
      storage_asset_id: categories.storage_asset_id,
      alt: categories.alt,
      icon: categories.icon,
      is_active: categories.is_active,
      is_featured: categories.is_featured,
      display_order: categories.display_order,
      created_at: categories.created_at,
      updated_at: categories.updated_at,
      name: categoryI18n.name,
      slug: categoryI18n.slug,
      description: categoryI18n.description,
      locale: categoryI18n.locale,
      meta_title: categoryI18n.meta_title,
      meta_description: categoryI18n.meta_description,
    })
    .from(categories)
    .innerJoin(categoryI18n, eq(categories.id, categoryI18n.category_id))
    .where(and(...conditions))
    .orderBy(asc(categories.display_order), asc(categoryI18n.name));

  return rows;
}

export async function repoGetCategoryById(id: string, locale?: string) {
  const loc = locale || 'tr';
  const [row] = await db
    .select({
      id: categories.id,
      module_key: categories.module_key,
      image_url: categories.image_url,
      storage_asset_id: categories.storage_asset_id,
      alt: categories.alt,
      icon: categories.icon,
      is_active: categories.is_active,
      is_featured: categories.is_featured,
      display_order: categories.display_order,
      created_at: categories.created_at,
      updated_at: categories.updated_at,
      name: categoryI18n.name,
      slug: categoryI18n.slug,
      description: categoryI18n.description,
      locale: categoryI18n.locale,
      meta_title: categoryI18n.meta_title,
      meta_description: categoryI18n.meta_description,
    })
    .from(categories)
    .innerJoin(categoryI18n, eq(categories.id, categoryI18n.category_id))
    .where(and(eq(categories.id, id), eq(categoryI18n.locale, loc)))
    .limit(1);

  return row ?? null;
}

type CreateParams = {
  module_key: string;
  icon?: string;
  is_active?: unknown;
  is_featured?: unknown;
  display_order?: number;
  locale: string;
  name: string;
  slug: string;
  description?: string;
  alt?: string;
  meta_title?: string;
  meta_description?: string;
};

export async function repoCreateCategory(data: CreateParams) {
  const id = randomUUID();

  await db.insert(categories).values({
    id,
    module_key: data.module_key,
    icon: data.icon ?? null,
    is_active: data.is_active !== undefined ? (toBool(data.is_active) ? 1 : 0) : 1,
    is_featured: data.is_featured !== undefined ? (toBool(data.is_featured) ? 1 : 0) : 0,
    display_order: data.display_order ?? 0,
  });

  await db.insert(categoryI18n).values({
    category_id: id,
    locale: data.locale,
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    alt: data.alt ?? null,
    meta_title: data.meta_title ?? null,
    meta_description: data.meta_description ?? null,
  });

  return { id };
}

type UpdateParams = Partial<CreateParams> & { id: string };

export async function repoUpdateCategory(data: UpdateParams) {
  const catUpdate: Record<string, unknown> = {};
  if (data.module_key !== undefined) catUpdate.module_key = data.module_key;
  if (data.icon !== undefined) catUpdate.icon = data.icon;
  if (data.is_active !== undefined) catUpdate.is_active = toBool(data.is_active) ? 1 : 0;
  if (data.is_featured !== undefined) catUpdate.is_featured = toBool(data.is_featured) ? 1 : 0;
  if (data.display_order !== undefined) catUpdate.display_order = data.display_order;

  if (Object.keys(catUpdate).length) {
    await db.update(categories).set(catUpdate).where(eq(categories.id, data.id));
  }

  const locale = data.locale || 'tr';
  const i18nUpdate: Record<string, unknown> = {};
  if (data.name !== undefined) i18nUpdate.name = data.name;
  if (data.slug !== undefined) i18nUpdate.slug = data.slug;
  if (data.description !== undefined) i18nUpdate.description = data.description;
  if (data.alt !== undefined) i18nUpdate.alt = data.alt;
  if (data.meta_title !== undefined) i18nUpdate.meta_title = data.meta_title;
  if (data.meta_description !== undefined) i18nUpdate.meta_description = data.meta_description;

  if (Object.keys(i18nUpdate).length) {
    await db
      .update(categoryI18n)
      .set(i18nUpdate)
      .where(and(eq(categoryI18n.category_id, data.id), eq(categoryI18n.locale, locale)));
  }
}

export async function repoDeleteCategory(id: string) {
  await db.delete(categories).where(eq(categories.id, id));
}

export async function repoToggleCategoryActive(id: string, is_active: boolean) {
  await db.update(categories).set({ is_active: is_active ? 1 : 0 }).where(eq(categories.id, id));
}

export async function repoToggleCategoryFeatured(id: string, is_featured: boolean) {
  await db.update(categories).set({ is_featured: is_featured ? 1 : 0 }).where(eq(categories.id, id));
}

export async function repoUpdateCategoryOrder(items: { id: string; display_order: number }[]) {
  for (const item of items) {
    await db.update(categories).set({ display_order: item.display_order }).where(eq(categories.id, item.id));
  }
}

export async function repoSetCategoryImage(id: string, assetId: string | null, alt: string | null) {
  await db
    .update(categories)
    .set({ storage_asset_id: assetId, alt })
    .where(eq(categories.id, id));
}
