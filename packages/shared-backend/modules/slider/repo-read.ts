// src/modules/slider/repo-read.ts
import { db } from '../../db/client';
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';
import { slider, sliderI18n, type SliderRow } from './schema';
import { storageAssets } from '@agro/shared-backend/modules/storage/schema';
import type { AdminListQuery, PublicListQuery } from './validation';
import { publicUrlOf, getBases, type StorageBases } from './helpers/storage-url';

export type RowWithAsset = {
  sl: SliderRow;
  i18n: {
    locale: string;
    name: string;
    slug: string;
    description: string | null;
    alt: string | null;
    buttonText: string | null;
    buttonLink: string | null;
  };
  asset_url: string | null;
};

const ORDER_COLS = {
  display_order: slider.display_order,
  name: sql<string>`COALESCE(${sql.raw('si_req.name')}, ${sql.raw('si_def.name')})`,
  created_at: slider.created_at,
  updated_at: slider.updated_at,
} as const;

type SortKey = keyof typeof ORDER_COLS;

function orderExpr(sort: SortKey, dir: 'asc' | 'desc') {
  const col = ORDER_COLS[sort] ?? ORDER_COLS.display_order;
  return dir === 'asc' ? asc(col) : desc(col);
}

function toBoolNum(v: boolean): number {
  return v ? 1 : 0;
}

type RawRow = {
  sl: SliderRow;
  name_resolved: string | null;
  slug_resolved: string | null;
  description_resolved: string | null;
  alt_resolved: string | null;
  button_text_resolved: string | null;
  button_link_resolved: string | null;
  locale_resolved: string | null;
  asset_bucket: string | null;
  asset_path: string | null;
  asset_url0: string | null;
};

function mapRow(r: RawRow, bases: StorageBases): RowWithAsset {
  return {
    sl: r.sl,
    i18n: {
      locale: r.locale_resolved ?? '',
      name: r.name_resolved ?? '',
      slug: r.slug_resolved ?? '',
      description: r.description_resolved ?? null,
      alt: r.alt_resolved ?? null,
      buttonText: r.button_text_resolved ?? null,
      buttonLink: r.button_link_resolved ?? null,
    },
    asset_url:
      publicUrlOf(r.asset_bucket, r.asset_path, r.asset_url0, bases) ?? r.sl.image_url ?? null,
  };
}

type I18nAlias = ReturnType<typeof alias<typeof sliderI18n, string>>;

function resolvedSelect(iReq: I18nAlias, iDef: I18nAlias) {
  return {
    sl: slider,
    name_resolved: sql<string>`COALESCE(${iReq.name}, ${iDef.name})`,
    slug_resolved: sql<string>`COALESCE(${iReq.slug}, ${iDef.slug})`,
    description_resolved: sql<string>`COALESCE(${iReq.description}, ${iDef.description})`,
    alt_resolved: sql<string>`COALESCE(${iReq.alt}, ${iDef.alt})`,
    button_text_resolved: sql<string>`COALESCE(${iReq.buttonText}, ${iDef.buttonText})`,
    button_link_resolved: sql<string>`COALESCE(${iReq.buttonLink}, ${iDef.buttonLink})`,
    locale_resolved: sql<string>`CASE WHEN ${iReq.id} IS NOT NULL THEN ${iReq.locale} ELSE ${iDef.locale} END`,
    asset_bucket: storageAssets.bucket,
    asset_path: storageAssets.path,
    asset_url0: storageAssets.url,
  };
}

function isResolved(r: RawRow): boolean {
  return r.name_resolved != null && String(r.name_resolved).trim() !== '';
}

/* ===================== PUBLIC ===================== */

export async function repoListPublic(
  q: PublicListQuery & { locale: string; default_locale: string },
): Promise<RowWithAsset[]> {
  const bases = await getBases();
  const iReq = alias(sliderI18n, 'si_req');
  const iDef = alias(sliderI18n, 'si_def');

  const conds: SQL[] = [eq(slider.is_active, 1)];

  if (q.q?.trim()) {
    const s = `%${q.q.trim()}%`;
    conds.push(sql`( COALESCE(${iReq.name}, ${iDef.name}) LIKE ${s} )`);
  }

  const rows = await db
    .select(resolvedSelect(iReq, iDef))
    .from(slider)
    .leftJoin(iReq, and(eq(iReq.sliderId, slider.id), eq(iReq.locale, q.locale)))
    .leftJoin(iDef, and(eq(iDef.sliderId, slider.id), eq(iDef.locale, q.default_locale)))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(and(...conds))
    .orderBy(orderExpr(q.sort, q.order), desc(slider.featured), asc(slider.display_order), asc(slider.id))
    .limit(q.limit)
    .offset(q.offset);

  return (rows as RawRow[]).filter(isResolved).map((r) => mapRow(r, bases));
}

export async function repoGetBySlug(
  slugStr: string,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  const bases = await getBases();

  const selectFields = {
    sl: slider,
    name_resolved: sliderI18n.name,
    slug_resolved: sliderI18n.slug,
    description_resolved: sliderI18n.description,
    alt_resolved: sliderI18n.alt,
    button_text_resolved: sliderI18n.buttonText,
    button_link_resolved: sliderI18n.buttonLink,
    locale_resolved: sliderI18n.locale,
    asset_bucket: storageAssets.bucket,
    asset_path: storageAssets.path,
    asset_url0: storageAssets.url,
  };

  // 1) requested locale
  const rows1 = await db
    .select(selectFields)
    .from(sliderI18n)
    .innerJoin(slider, eq(sliderI18n.sliderId, slider.id))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(and(eq(sliderI18n.slug, slugStr), eq(sliderI18n.locale, locale), eq(slider.is_active, 1)))
    .limit(1);

  if (rows1.length) return mapRow(rows1[0] as RawRow, bases);

  // 2) default locale fallback
  const rows2 = await db
    .select(selectFields)
    .from(sliderI18n)
    .innerJoin(slider, eq(sliderI18n.sliderId, slider.id))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(and(eq(sliderI18n.slug, slugStr), eq(sliderI18n.locale, defaultLocale), eq(slider.is_active, 1)))
    .limit(1);

  if (!rows2.length) return null;
  return mapRow(rows2[0] as RawRow, bases);
}

/* ===================== ADMIN ===================== */

export async function repoListAdmin(
  q: AdminListQuery & { locale: string; default_locale: string },
): Promise<RowWithAsset[]> {
  const bases = await getBases();
  const iReq = alias(sliderI18n, 'si_req');
  const iDef = alias(sliderI18n, 'si_def');

  const conds: SQL[] = [];

  if (typeof q.is_active === 'boolean') {
    conds.push(eq(slider.is_active, toBoolNum(q.is_active)));
  }

  if (q.q?.trim()) {
    const s = `%${q.q.trim()}%`;
    conds.push(sql`( COALESCE(${iReq.name}, ${iDef.name}) LIKE ${s} )`);
  }

  const whereExpr: SQL = conds.length ? (and(...conds) as SQL) : sql`1=1`;

  const rows = await db
    .select(resolvedSelect(iReq, iDef))
    .from(slider)
    .leftJoin(iReq, and(eq(iReq.sliderId, slider.id), eq(iReq.locale, q.locale)))
    .leftJoin(iDef, and(eq(iDef.sliderId, slider.id), eq(iDef.locale, q.default_locale)))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(whereExpr)
    .orderBy(orderExpr(q.sort, q.order), desc(slider.featured), asc(slider.display_order), asc(slider.id))
    .limit(q.limit)
    .offset(q.offset);

  return (rows as RawRow[]).filter(isResolved).map((r) => mapRow(r, bases));
}

export async function repoGetById(
  id: number,
  locale: string,
  defaultLocale: string,
): Promise<RowWithAsset | null> {
  const bases = await getBases();
  const iReq = alias(sliderI18n, 'si_req');
  const iDef = alias(sliderI18n, 'si_def');

  const rows = await db
    .select(resolvedSelect(iReq, iDef))
    .from(slider)
    .leftJoin(iReq, and(eq(iReq.sliderId, slider.id), eq(iReq.locale, locale)))
    .leftJoin(iDef, and(eq(iDef.sliderId, slider.id), eq(iDef.locale, defaultLocale)))
    .leftJoin(storageAssets, eq(slider.image_asset_id, storageAssets.id))
    .where(eq(slider.id, id))
    .limit(1);

  if (!rows.length) return null;
  const r = rows[0] as RawRow;
  if (!r.name_resolved) return null;
  return mapRow(r, bases);
}
