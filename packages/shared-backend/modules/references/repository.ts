// src/modules/references/repository.ts
import { db } from '../../db/client';
import { and, asc, desc, eq, like, or, sql, type SQL } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { referencesTable, referencesI18n, type NewReferenceRow, type NewReferenceI18nRow } from './schema';
import { categories } from '../categories/schema';
type Locale = string;

// Re-export from split helpers
export { repoListReferenceImages, type ReferenceImageMerged } from './helpers/images-repository';
export {
  repoCreateReferenceParent,
  repoUpdateReferenceParent,
  repoDeleteReferenceParent,
  repoGetReferenceI18nRow,
  repoUpsertReferenceI18n,
} from './helpers/write-repository';

type Sortable = 'created_at' | 'updated_at' | 'display_order';

export type ListParams = {
  orderParam?: string;
  sort?: Sortable;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  is_published?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  is_featured?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  q?: string;
  slug?: string;
  category_id?: string;
  module_key?: string;
  has_website?: boolean | 0 | 1 | '0' | '1' | 'true' | 'false';
  locale: Locale;
  defaultLocale: Locale;
};

export type ReferenceMerged = {
  id: string;
  is_published: 0 | 1;
  is_featured: 0 | 1;
  display_order: number;
  featured_image: string | null;
  featured_image_asset_id: string | null;
  website_url: string | null;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  title: string | null;
  slug: string | null;
  summary: string | null;
  content: string | null;
  featured_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  locale_resolved: string | null;
};

/* ---- helpers ---- */

const to01 = (v: ListParams['is_published']): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
};

const toBool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** HTML string → JSON-string {"html": "..."} */
export const packContent = (htmlOrJson: string): string => {
  try {
    const parsed = JSON.parse(htmlOrJson) as unknown;
    if (isRec(parsed) && typeof parsed.html === 'string') return JSON.stringify({ html: parsed.html });
  } catch { /* plain HTML */ }
  return JSON.stringify({ html: htmlOrJson });
};

const parseOrder = (orderParam?: string, sort?: Sortable, ord?: 'asc' | 'desc') => {
  if (orderParam) {
    const m = orderParam.match(/^([a-zA-Z0-9_]+)\.(asc|desc)$/);
    const col = m?.[1] as Sortable | undefined;
    const dir = m?.[2] as 'asc' | 'desc' | undefined;
    if (col && dir && ['created_at', 'updated_at', 'display_order'].includes(col)) return { col, dir };
  }
  if (sort && ord) return { col: sort, dir: ord };
  return null;
};

const baseSelect = {
  id: referencesTable.id,
  is_published: referencesTable.is_published,
  is_featured: referencesTable.is_featured,
  display_order: referencesTable.display_order,
  featured_image: referencesTable.featured_image,
  featured_image_asset_id: referencesTable.featured_image_asset_id,
  website_url: referencesTable.website_url,
  category_id: referencesTable.category_id,
  category_name: sql<string | null>`NULL`.as('category_name'),
  category_slug: sql<string | null>`NULL`.as('category_slug'),
  title: referencesI18n.title,
  slug: referencesI18n.slug,
  summary: referencesI18n.summary,
  content: referencesI18n.content,
  featured_image_alt: referencesI18n.featured_image_alt,
  meta_title: referencesI18n.meta_title,
  meta_description: referencesI18n.meta_description,
  locale_resolved: referencesI18n.locale,
};

/* ---- LIST ---- */

export async function repoListReferences(params: ListParams): Promise<{ items: ReferenceMerged[]; total: number }> {
  const conds: (SQL | undefined)[] = [];

  const pub = to01(params.is_published);
  if (pub !== undefined) conds.push(eq(referencesTable.is_published, pub));
  const feat = to01(params.is_featured);
  if (feat !== undefined) conds.push(eq(referencesTable.is_featured, feat));
  conds.push(eq(referencesI18n.locale, params.locale));

  if (params.slug?.trim()) conds.push(eq(referencesI18n.slug, params.slug.trim()));
  if (params.q?.trim()) {
    const s = `%${params.q.trim()}%`;
    const sc = or(like(referencesI18n.title, s), like(referencesI18n.slug, s), like(referencesI18n.summary, s));
    if (sc) conds.push(sc);
  }
  if (params.category_id) conds.push(eq(referencesTable.category_id, params.category_id));
  if (params.module_key) conds.push(eq(categories.module_key, params.module_key));
  if (typeof params.has_website !== 'undefined') {
    if (toBool(params.has_website)) {
      conds.push(sql`${referencesTable.website_url} IS NOT NULL AND ${referencesTable.website_url} <> ''`);
    } else {
      conds.push(sql`(${referencesTable.website_url} IS NULL OR ${referencesTable.website_url} = '')`);
    }
  }

  const ord = parseOrder(params.orderParam, params.sort, params.order);
  const sortCol = ord?.col === 'created_at' ? referencesTable.created_at
    : ord?.col === 'updated_at' ? referencesTable.updated_at
    : referencesTable.display_order;
  const orderExpr = (!ord || ord.dir === 'asc') ? asc(sortCol) : desc(sortCol);

  const take = params.limit && params.limit > 0 ? params.limit : 50;
  const skip = params.offset && params.offset >= 0 ? params.offset : 0;
  const whereCond = conds.length > 0 ? (and(...conds.filter(Boolean) as SQL[]) as SQL) : undefined;

  const baseQuery = db.select(baseSelect).from(referencesTable)
    .innerJoin(referencesI18n, eq(referencesI18n.reference_id, referencesTable.id))
    .leftJoin(categories, eq(categories.id, referencesTable.category_id));

  const rowsQuery = whereCond ? baseQuery.where(whereCond as SQL) : baseQuery;
  const rows = await rowsQuery.orderBy(orderExpr, asc(referencesTable.created_at)).limit(take).offset(skip);

  const countBase = db.select({ c: sql<number>`COUNT(*)` }).from(referencesTable)
    .innerJoin(referencesI18n, eq(referencesI18n.reference_id, referencesTable.id))
    .leftJoin(categories, eq(categories.id, referencesTable.category_id));
  const countQuery = whereCond ? countBase.where(whereCond as SQL) : countBase;
  const cnt = await countQuery;

  return { items: rows as unknown as ReferenceMerged[], total: cnt[0]?.c ?? 0 };
}

/* ---- GET by id / slug ---- */

export async function repoGetReferenceMergedById(locale: Locale, _defaultLocale: Locale, id: string) {
  const rows = await db.select(baseSelect).from(referencesTable)
    .innerJoin(referencesI18n, and(eq(referencesI18n.reference_id, referencesTable.id), eq(referencesI18n.locale, locale)))
    .leftJoin(categories, eq(categories.id, referencesTable.category_id))
    .where(eq(referencesTable.id, id)).limit(1);
  return (rows[0] as ReferenceMerged) ?? null;
}

export async function repoGetReferenceMergedBySlug(locale: Locale, _defaultLocale: Locale, slugStr: string) {
  const rows = await db.select(baseSelect).from(referencesTable)
    .innerJoin(referencesI18n, and(eq(referencesI18n.reference_id, referencesTable.id), eq(referencesI18n.locale, locale)))
    .leftJoin(categories, eq(categories.id, referencesTable.category_id))
    .where(eq(referencesI18n.slug, slugStr)).limit(1);
  return (rows[0] as ReferenceMerged) ?? null;
}
