// src/modules/library/controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { libraryListQuerySchema, type LibraryListQuery } from './validation';
import {
  listLibrary,
  getLibraryMergedById,
  getLibraryMergedBySlug,
  listLibraryImages,
  listLibraryFiles,
  repoTrackDownload,
} from './repository';
import { handleRouteError, sendNotFound } from '../_shared';
import { ensureLocalesLoadedFromSettings, LOCALES, normalizeLocale, isSupported, getRuntimeDefaultLocale } from '../../core/i18n';

type LocaleCode = string;
type LocaleQueryLike = { locale?: string; default_locale?: string };

async function resolveLocalesPublic(
  req: { locale?: string },
  q?: LocaleQueryLike,
): Promise<{ locale: LocaleCode; def: LocaleCode }> {
  await ensureLocalesLoadedFromSettings();
  const fallback = (LOCALES[0] as string) || (getRuntimeDefaultLocale() as string) || 'tr';
  const pick = (raw?: string | null): string | null => {
    const n = normalizeLocale(raw);
    return n && isSupported(n) ? n : null;
  };
  const locale = pick(q?.locale) || pick(req?.locale) || pick(getRuntimeDefaultLocale() as string) || fallback;
  const def = pick(q?.default_locale) || pick(getRuntimeDefaultLocale() as string) || fallback;
  return { locale, def };
}

/** GET /library */
export async function listLibraryPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = libraryListQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.issues } });
    }
    const q = parsed.data;
    const { locale, def } = await resolveLocalesPublic(req as any, { locale: q.locale, default_locale: q.default_locale });
    const isActive = typeof q.is_active === 'undefined' ? true : q.is_active;

    const { items, total } = await listLibrary({
      locale, defaultLocale: def,
      orderParam: typeof q.order === 'string' ? q.order : undefined,
      sort: q.sort, order: q.orderDir, limit: q.limit, offset: q.offset,
      q: q.q, type: q.type, module_key: q.module_key,
      category_id: q.category_id, sub_category_id: q.sub_category_id,
      featured: q.featured,
      is_published: typeof q.is_published === 'undefined' ? true : q.is_published,
      is_active: isActive,
    });
    reply.header('x-total-count', String(total ?? 0));
    return reply.send(items);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_PUBLIC');
  }
}

/** GET /library/:id */
export async function getLibraryPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { locale, def } = await resolveLocalesPublic(req as any, req.query as any);
    const { id } = req.params as { id: string };
    const row = await getLibraryMergedById(locale, def, id);
    if (!row || row.is_active !== 1) return sendNotFound(reply);
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_PUBLIC');
  }
}

/** GET /library/by-slug/:slug */
export async function getLibraryBySlugPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { locale, def } = await resolveLocalesPublic(req as any, req.query as any);
    const { slug } = req.params as { slug: string };
    const row = await getLibraryMergedBySlug(locale, def, slug);
    if (!row || row.is_active !== 1) return sendNotFound(reply);
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_PUBLIC');
  }
}

/** GET /library/:id/images */
export async function listLibraryImagesPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { locale, def } = await resolveLocalesPublic(req as any, req.query as any);
    const { id } = req.params as { id: string };
    const rows = await listLibraryImages({ libraryId: id, locale, defaultLocale: def, onlyActive: true });
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_PUBLIC');
  }
}

/** GET /library/:id/files */
export async function listLibraryFilesPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    await resolveLocalesPublic(req as any);
    const { id } = req.params as { id: string };
    const rows = await listLibraryFiles({ libraryId: id, onlyActive: true });
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_PUBLIC');
  }
}

/** POST /library/:id/track-download */
export async function trackLibraryDownload(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    await repoTrackDownload(id);
    return reply.send({ ok: true });
  } catch {
    return reply.send({ ok: false });
  }
}
