// src/modules/references/admin.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
  repoListReferences,
  repoGetReferenceMergedById,
  repoGetReferenceMergedBySlug,
  repoCreateReferenceParent,
  repoUpdateReferenceParent,
  repoDeleteReferenceParent,
  repoGetReferenceI18nRow,
  repoUpsertReferenceI18n,
  packContent,
} from './repository';
import {
  referencesListQuerySchema,
  upsertReferenceBodySchema,
  patchReferenceBodySchema,
  type ReferencesListQuery,
  type UpsertReferenceBody,
  type PatchReferenceBody,
  resolveLocaleOrUndefined,
} from './validation';
import { handleRouteError, setContentRange } from '../_shared';
import {
  LOCALES,
  ensureLocalesLoadedFromSettings,
  getRuntimeDefaultLocale,
  isSupported,
  normalizeLocale,
} from '../../core/i18n';

type Locale = string;
type LocaleQueryLike = { locale?: string; default_locale?: string };

export const toBool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

function uniqueLocalesInPriority(primary: Locale): Locale[] {
  const seen = new Set<string>();
  const out: Locale[] = [];
  const push = (l: string) => { if (l && !seen.has(l)) { seen.add(l); out.push(l as Locale); } };
  push(primary);
  for (const l of LOCALES) push(String(l));
  return out;
}

function resolveLocale(req: FastifyRequest, qLocale?: string): Locale {
  const runtimeDefault = getRuntimeDefaultLocale();
  return resolveLocaleOrUndefined(qLocale) ??
    ((req as any).locale as Locale | undefined) ??
    runtimeDefault;
}

export async function resolveLocales(
  req: FastifyRequest,
  query?: LocaleQueryLike,
): Promise<{ locale: Locale; def: Locale }> {
  await ensureLocalesLoadedFromSettings();
  const pick = (raw?: unknown): string | null => {
    if (typeof raw !== 'string') return null;
    const normalized = normalizeLocale(raw);
    if (!normalized) return null;
    return isSupported(normalized) ? normalized : null;
  };

  const runtimeDefault = pick(getRuntimeDefaultLocale()) || 'tr';
  const q = query ?? ((req.query ?? {}) as LocaleQueryLike);
  const locale = pick(q.locale) || pick((req as any).locale) || runtimeDefault;
  const def = pick(q.default_locale) || runtimeDefault || (LOCALES[0] as string) || 'tr';

  return { locale, def };
}

/** LIST (admin) */
export async function listReferencesAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const parsed = referencesListQuerySchema.safeParse(req.query ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_query', issues: parsed.error.flatten() } });
    }
    const q = parsed.data as ReferencesListQuery;
    const runtimeDefault = getRuntimeDefaultLocale();
    const locale = resolveLocale(req, q.locale as any);

    const { items, total } = await repoListReferences({
      orderParam: typeof q.order === 'string' ? q.order : undefined,
      sort: q.sort, order: q.orderDir, limit: q.limit, offset: q.offset,
      is_published: q.is_published, is_featured: q.is_featured,
      q: q.q, slug: q.slug, category_id: q.category_id,
      module_key: q.module_key, has_website: q.has_website,
      locale, defaultLocale: runtimeDefault,
    });

    const offset = q.offset ?? 0;
    const limit = q.limit ?? items.length ?? 0;
    setContentRange(reply, offset, limit, total);
    reply.header('x-total-count', String(total ?? 0));
    return reply.send(items);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}

/** GET BY ID (admin) */
export async function getReferenceAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const { id } = (req.params ?? {}) as { id: string };
    const q = (req.query ?? {}) as { locale?: string };
    const runtimeDefault = getRuntimeDefaultLocale();
    const locale = resolveLocale(req, q.locale);
    const row = await repoGetReferenceMergedById(locale, runtimeDefault, id);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}

/** GET BY SLUG (admin) */
export async function getReferenceBySlugAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const { slug } = (req.params ?? {}) as { slug: string };
    const q = (req.query ?? {}) as { locale?: string };
    const runtimeDefault = getRuntimeDefaultLocale();
    const locale = resolveLocale(req, q.locale);
    const row = await repoGetReferenceMergedBySlug(locale, runtimeDefault, slug);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}

// Write operations (create, update, delete) — split to helpers/admin-write.ts
export { createReferenceAdmin, updateReferenceAdmin, removeReferenceAdmin } from './helpers/admin-write';
export {
  createReferenceImageAdmin,
  listReferenceImagesAdmin,
  removeReferenceImageAdmin,
  updateReferenceImageAdmin,
} from './helpers/admin-images';
