// src/modules/slider/repo-write.ts
import { db } from '../../db/client';
import { and, eq, sql } from 'drizzle-orm';
import { slider, sliderI18n, type NewSliderRow, type NewSliderI18nRow } from './schema';
import { storageAssets } from '@agro/shared-backend/modules/storage/schema';
import type { CreateBody, UpdateBody, SetImageBody } from './validation';
import { randomUUID } from 'crypto';
import { publicUrlOf, getBases } from './helpers/storage-url';
import { repoGetById, type RowWithAsset } from './repo-read';

/** Create: parent + requested locale i18n */
export async function repoCreate(b: CreateBody, locale: string): Promise<RowWithAsset> {
  const nowMaxOrder = await db
    .select({ maxOrder: sql<number>`COALESCE(MAX(${slider.display_order}), 0)` })
    .from(slider);

  const baseSlug = (
    b.slug ||
    b.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  ).slice(0, 255);

  const uuidVal = randomUUID();

  const parentValues: NewSliderRow = {
    uuid: uuidVal,
    image_url: b.image_url ?? null,
    image_asset_id: b.image_asset_id ?? null,
    featured: b.featured ? 1 : 0,
    is_active: b.is_active ? 1 : 0,
    display_order: b.display_order ?? (nowMaxOrder[0]?.maxOrder ?? 0) + 1,
  };

  await db.insert(slider).values(parentValues);

  const [baseRow] = await db.select().from(slider).where(eq(slider.uuid, uuidVal)).limit(1);
  if (!baseRow) throw new Error('slider_create_parent_failed');

  const i18nValues: NewSliderI18nRow = {
    sliderId: baseRow.id,
    locale,
    name: b.name,
    slug: baseSlug,
    description: b.description ?? null,
    alt: b.alt ?? null,
    buttonText: b.buttonText ?? null,
    buttonLink: b.buttonLink ?? null,
  };

  await db.insert(sliderI18n).values(i18nValues);

  const row = await repoGetById(baseRow.id, locale, locale);
  if (!row) throw new Error('create_failed');

  return {
    ...row,
    asset_url: row.asset_url ?? baseRow.image_url ?? null,
  };
}

/** Update: parent + i18n upsert for locale */
export async function repoUpdate(
  id: number,
  b: UpdateBody,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  const parentSet: Record<string, unknown> = {
    updated_at: sql`CURRENT_TIMESTAMP(3)`,
  };

  if (b.image_url !== undefined) parentSet.image_url = b.image_url ?? null;
  if (b.image_asset_id !== undefined) parentSet.image_asset_id = b.image_asset_id ?? null;
  if (b.featured !== undefined) parentSet.featured = b.featured ? 1 : 0;
  if (b.is_active !== undefined) parentSet.is_active = b.is_active ? 1 : 0;
  if (b.display_order !== undefined) parentSet.display_order = b.display_order;

  await db.update(slider).set(parentSet).where(eq(slider.id, id));

  // i18n upsert
  const hasI18n =
    b.name !== undefined ||
    b.slug !== undefined ||
    b.description !== undefined ||
    b.alt !== undefined ||
    b.buttonText !== undefined ||
    b.buttonLink !== undefined;

  if (hasI18n) {
    const [existing] = await db
      .select({ id: sliderI18n.id })
      .from(sliderI18n)
      .where(and(eq(sliderI18n.sliderId, id), eq(sliderI18n.locale, locale)))
      .limit(1);

    if (existing) {
      const i18nSet: Record<string, unknown> = {};
      if (b.name !== undefined) i18nSet.name = b.name;
      if (b.slug !== undefined) i18nSet.slug = b.slug;
      if (b.description !== undefined) i18nSet.description = b.description ?? null;
      if (b.alt !== undefined) i18nSet.alt = b.alt ?? null;
      if (b.buttonText !== undefined) i18nSet.buttonText = b.buttonText ?? null;
      if (b.buttonLink !== undefined) i18nSet.buttonLink = b.buttonLink ?? null;

      await db.update(sliderI18n).set(i18nSet).where(eq(sliderI18n.id, existing.id));
    } else {
      const name =
        typeof b.name === 'string' && b.name.trim() ? b.name.trim() : `Slide ${id}`;
      const slug = (
        b.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      ).slice(0, 255);

      const newI18n: NewSliderI18nRow = {
        sliderId: id,
        locale,
        name,
        slug: slug || `slider-${id}-${locale}`,
        description: b.description ?? null,
        alt: b.alt ?? null,
        buttonText: b.buttonText ?? null,
        buttonLink: b.buttonLink ?? null,
      };

      await db.insert(sliderI18n).values(newI18n);
    }
  }

  return repoGetById(id, locale, defaultLocale);
}

export async function repoDelete(id: number): Promise<void> {
  await db.delete(sliderI18n).where(eq(sliderI18n.sliderId, id));
  await db.delete(slider).where(eq(slider.id, id));
}

export async function repoReorder(ids: number[]): Promise<void> {
  for (let i = 0; i < ids.length; i++) {
    await db
      .update(slider)
      .set({ display_order: i + 1, updated_at: sql`CURRENT_TIMESTAMP(3)` })
      .where(eq(slider.id, ids[i]));
  }
}

export async function repoSetStatus(
  id: number,
  isActive: boolean,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  await db
    .update(slider)
    .set({ is_active: isActive ? 1 : 0, updated_at: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(slider.id, id));

  return repoGetById(id, locale, defaultLocale);
}

export async function repoSetImage(
  id: number,
  body: SetImageBody,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  const bases = await getBases();

  const pick =
    (Array.isArray(body.asset_ids) ? body.asset_ids.find((x) => !!x) : undefined) ||
    (body.asset_id ?? null);

  const assetId = pick || null;

  if (!assetId) {
    await db
      .update(slider)
      .set({ image_url: null, image_asset_id: null, updated_at: sql`CURRENT_TIMESTAMP(3)` })
      .where(eq(slider.id, id));

    return repoGetById(id, locale, defaultLocale);
  }

  const [asset] = await db
    .select({ bucket: storageAssets.bucket, path: storageAssets.path, url: storageAssets.url })
    .from(storageAssets)
    .where(eq(storageAssets.id, assetId))
    .limit(1);

  if (!asset) return null;

  const url = publicUrlOf(asset.bucket, asset.path, asset.url ?? null, bases);

  await db
    .update(slider)
    .set({ image_url: url, image_asset_id: assetId, updated_at: sql`CURRENT_TIMESTAMP(3)` })
    .where(eq(slider.id, id));

  return repoGetById(id, locale, defaultLocale);
}
