// src/modules/library/admin.controller.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';

import { libraryListQuerySchema } from './validation';

import {
  listLibrary,
  getLibraryMergedById,
  getLibraryMergedBySlug,
  deleteLibraryParent,
} from './repository';

import {
  ensureLocalesLoadedFromSettings,
  LOCALES,
  normalizeLocale,
  isSupported,
  getRuntimeDefaultLocale,
} from '../../core/i18n';

/* ----------------------------- shared helpers ----------------------------- */

type LocaleCode = string;
type LocaleQueryLike = { locale?: string; default_locale?: string };

export const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === '1' || v === 'true';

export const to01 = (v: unknown): 0 | 1 | undefined => {
  if (v === true || v === 1 || v === '1' || v === 'true') return 1;
  if (v === false || v === 0 || v === '0' || v === 'false') return 0;
  return undefined;
};

export const toDateOrNull = (value: unknown): Date | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;
    const d = new Date(s);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  return null;
};

export const normalizeCoverPatch = (
  b: any,
  patch: Record<string, any>,
): { hasAny: boolean; coverUrl: string | null | undefined } => {
  const hasImageUrl = typeof b.image_url !== 'undefined';
  const hasFeaturedImage = typeof b.featured_image !== 'undefined';
  if (hasImageUrl) patch.image_url = b.image_url ?? null;
  if (hasFeaturedImage) patch.featured_image = b.featured_image ?? null;
  if (hasImageUrl && !hasFeaturedImage) patch.featured_image = b.image_url ?? null;
  if (!hasImageUrl && hasFeaturedImage) patch.image_url = b.featured_image ?? null;
  const hasAny = hasImageUrl || hasFeaturedImage;
  const coverUrl = hasImageUrl
    ? b.image_url ?? null
    : hasFeaturedImage
    ? b.featured_image ?? null
    : undefined;
  return { hasAny, coverUrl };
};

export async function resolveLocales(
  req: any,
  query?: LocaleQueryLike,
): Promise<{ locale: LocaleCode; def: LocaleCode }> {
  await ensureLocalesLoadedFromSettings();
  const pick = (raw?: unknown): string | null => {
    if (typeof raw !== 'string') return null;
    const n = normalizeLocale(raw);
    if (!n) return null;
    return isSupported(n) ? n : null;
  };
  const fallback = (LOCALES[0] as string) || (getRuntimeDefaultLocale() as string) || 'tr';
  const q = query ?? req?.query ?? {};
  const qLocale = pick(q.locale);
  const qDef = pick(q.default_locale);
  const reqLocale = pick(req?.locale);
  const runtimeDef = pick(getRuntimeDefaultLocale() as unknown as string);
  const locale = qLocale || reqLocale || runtimeDef || fallback;
  const def = qDef || runtimeDef || fallback;
  return { locale, def };
}

/* ----------------------------- list / get ----------------------------- */

export async function listLibraryAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = libraryListQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: { message: 'invalid_query', issues: parsed.error.issues },
      });
    }
    const q = parsed.data;
    const { locale, def } = await resolveLocales(req, {
      locale: q.locale,
      default_locale: q.default_locale,
    });
    const { items, total } = await listLibrary({
      locale,
      defaultLocale: def,
      orderParam: typeof q.order === 'string' ? q.order : undefined,
      sort: q.sort,
      order: q.orderDir,
      limit: q.limit,
      offset: q.offset,
      q: q.q,
      type: (q as any).type,
      category_id: q.category_id,
      sub_category_id: q.sub_category_id,
      featured: (q as any).featured,
      is_active: q.is_active,
    });
    reply.header('x-total-count', String(total ?? 0));
    return reply.send(items);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

export async function getLibraryAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { locale, def } = await resolveLocales(req);
    const row = await getLibraryMergedById(locale, def, id);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

export async function getLibraryBySlugAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { slug } = req.params as { slug: string };
    const { locale, def } = await resolveLocales(req);
    const row = await getLibraryMergedBySlug(locale, def, slug);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

/* ----------------------------- delete ----------------------------- */

export async function removeLibraryAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const affected = await deleteLibraryParent(id);
    if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.code(204).send();
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

/* ----------------------------- re-exports from helpers ----------------------------- */

export { createLibraryAdmin, updateLibraryAdmin } from './helpers/admin-crud';

export {
  listLibraryImagesAdmin,
  createLibraryImageAdmin,
  updateLibraryImageAdmin,
  removeLibraryImageAdmin,
  reorderLibraryAdmin,
} from './helpers/admin-images';

export {
  listLibraryFilesAdmin,
  createLibraryFileAdmin,
  updateLibraryFileAdmin,
  removeLibraryFileAdmin,
} from './helpers/admin-files';
