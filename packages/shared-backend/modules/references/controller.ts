// src/modules/references/controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import {
  publicReferencesListQuerySchema,
  referenceBySlugParamsSchema,
  referenceBySlugQuerySchema,
  type PublicReferencesListQuery,
  type ReferenceBySlugQuery,
  resolveLocaleOrUndefined,
} from './validation';
import {
  repoListReferences,
  repoGetReferenceMergedById,
  repoGetReferenceMergedBySlug,
  repoListReferenceImages,
} from './repository';
import { ensureLocalesLoadedFromSettings, getRuntimeDefaultLocale } from '../../core/i18n';
import { handleRouteError, sendNotFound } from '../_shared';

type Locale = string;

/** LIST (public) */
export async function listReferencesPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const parsed = publicReferencesListQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const q = parsed.data as PublicReferencesListQuery;
    const runtimeDefault = getRuntimeDefaultLocale();
    const locale: Locale =
      resolveLocaleOrUndefined(q.locale as any) ??
      ((req as any).locale as Locale | undefined) ??
      runtimeDefault;

    const { items, total } = await repoListReferences({
      orderParam: typeof q.order === 'string' ? q.order : undefined,
      sort: q.sort,
      order: q.orderDir,
      limit: q.limit,
      offset: q.offset,
      is_published: true,
      is_featured: q.is_featured,
      q: q.q,
      slug: q.slug,
      category_id: q.category_id,
      module_key: q.module_key,
      has_website: q.has_website,
      locale,
      defaultLocale: runtimeDefault,
    });

    reply.header('x-total-count', String(total ?? 0));
    return reply.send(items);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_PUBLIC');
  }
}

/** GET BY ID (public) */
export async function getReferencePublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const { id } = (req.params ?? {}) as { id: string };
    const q = (req.query ?? {}) as { locale?: string };
    const runtimeDefault = getRuntimeDefaultLocale();
    const locale: Locale =
      resolveLocaleOrUndefined(q.locale) ??
      ((req as any).locale as Locale | undefined) ??
      runtimeDefault;

    const row = await repoGetReferenceMergedById(locale, runtimeDefault, id);
    if (!row || !row.is_published) return sendNotFound(reply);

    const gallery = await repoListReferenceImages(row.id, locale, runtimeDefault);
    return reply.send({ ...row, gallery });
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_PUBLIC');
  }
}

/** GET BY SLUG (public) */
export async function getReferenceBySlugPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const { slug } = referenceBySlugParamsSchema.parse(req.params ?? {});
    const q = referenceBySlugQuerySchema.parse(req.query ?? {}) as ReferenceBySlugQuery;
    const runtimeDefault = getRuntimeDefaultLocale();
    const locale: Locale =
      resolveLocaleOrUndefined(q.locale as any) ??
      ((req as any).locale as Locale | undefined) ??
      runtimeDefault;

    const row = await repoGetReferenceMergedBySlug(locale, runtimeDefault, slug);
    if (!row || !row.is_published) return sendNotFound(reply);

    const gallery = await repoListReferenceImages(row.id, locale, runtimeDefault);
    return reply.send({ ...row, gallery });
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_PUBLIC');
  }
}
