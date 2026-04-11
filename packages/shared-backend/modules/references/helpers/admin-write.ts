// src/modules/references/helpers/admin-write.ts
// Admin write handlers (create, update, delete) — split from admin.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import {
  repoGetReferenceMergedById,
  repoCreateReferenceParent,
  repoUpdateReferenceParent,
  repoDeleteReferenceParent,
  repoGetReferenceI18nRow,
  repoUpsertReferenceI18n,
  packContent,
} from '../repository';
import {
  upsertReferenceBodySchema,
  patchReferenceBodySchema,
  type UpsertReferenceBody,
  type PatchReferenceBody,
  resolveLocaleOrUndefined,
} from '../validation';
import { handleRouteError } from '../../_shared';
import { LOCALES, ensureLocalesLoadedFromSettings, getRuntimeDefaultLocale } from '../../../core/i18n';

type Locale = string;

const toBool = (v: unknown): boolean => v === true || v === 1 || v === '1' || v === 'true';

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

function buildI18nPayload(b: UpsertReferenceBody | PatchReferenceBody) {
  return {
    title: typeof b.title === 'string' ? b.title.trim() : b.title,
    slug: typeof b.slug === 'string' ? b.slug.trim() : b.slug,
    content: typeof b.content === 'string' ? packContent(b.content) : b.content,
    summary: typeof b.summary === 'string' ? b.summary.trim() : b.summary ?? null,
    featured_image_alt: typeof b.featured_image_alt === 'string' ? b.featured_image_alt.trim() : b.featured_image_alt ?? null,
    meta_title: typeof b.meta_title === 'string' ? b.meta_title.trim() : b.meta_title ?? null,
    meta_description: typeof b.meta_description === 'string' ? b.meta_description.trim() : b.meta_description ?? null,
  };
}

/** CREATE (admin) */
export async function createReferenceAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const parsed = upsertReferenceBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
    }
    const b = parsed.data as UpsertReferenceBody;
    const runtimeDefault = getRuntimeDefaultLocale();
    const primaryLocale = resolveLocale(req, b.locale as any);

    const id = randomUUID();
    await repoCreateReferenceParent({
      id,
      is_published: toBool(b.is_published) ? 1 : 0,
      is_featured: toBool(b.is_featured) ? 1 : 0,
      display_order: b.display_order ?? 0,
      featured_image: b.featured_image ?? null,
      featured_image_asset_id: b.featured_image_asset_id ?? null,
      website_url: b.website_url ?? null,
      category_id: b.category_id ?? null,
      created_at: new Date() as any,
      updated_at: new Date() as any,
    });

    const payload = buildI18nPayload(b);
    const localesToCreate = uniqueLocalesInPriority(primaryLocale);
    for (const loc of localesToCreate) {
      await repoUpsertReferenceI18n(id, loc, payload as any);
    }

    const row = await repoGetReferenceMergedById(primaryLocale, runtimeDefault, id);
    return reply.code(201).send(row);
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'slug_already_exists' } });
    }
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}

/** UPDATE (admin, partial) */
export async function updateReferenceAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const { id } = (req.params ?? {}) as { id: string };
    const parsed = patchReferenceBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.flatten() } });
    }
    const b = parsed.data as PatchReferenceBody;
    const runtimeDefault = getRuntimeDefaultLocale();
    const locale = resolveLocale(req, b.locale as any);

    // parent fields
    const hasParent = ['is_published', 'is_featured', 'display_order', 'featured_image', 'featured_image_asset_id', 'category_id', 'website_url']
      .some(k => typeof (b as any)[k] !== 'undefined');

    if (hasParent) {
      await repoUpdateReferenceParent(id, {
        is_published: typeof b.is_published !== 'undefined' ? (toBool(b.is_published) ? 1 as any : 0 as any) : undefined,
        is_featured: typeof b.is_featured !== 'undefined' ? (toBool(b.is_featured) ? 1 as any : 0 as any) : undefined,
        display_order: typeof b.display_order !== 'undefined' ? b.display_order : undefined,
        featured_image: typeof b.featured_image !== 'undefined' ? b.featured_image ?? null : undefined,
        featured_image_asset_id: typeof b.featured_image_asset_id !== 'undefined' ? b.featured_image_asset_id ?? null : undefined,
        website_url: typeof b.website_url !== 'undefined' ? b.website_url ?? null : undefined,
        category_id: typeof b.category_id !== 'undefined' ? b.category_id ?? null : undefined,
      } as any);
    }

    // i18n fields
    const hasI18n = ['title', 'slug', 'summary', 'content', 'featured_image_alt', 'meta_title', 'meta_description']
      .some(k => typeof (b as any)[k] !== 'undefined');

    if (hasI18n) {
      const exists = await repoGetReferenceI18nRow(id, locale);
      if (!exists && (!b.title || !b.slug || !b.content)) {
        return reply.code(400).send({ error: { message: 'missing_required_translation_fields' } });
      }
      const payload = buildI18nPayload(b);
      await repoUpsertReferenceI18n(id, locale, payload as any);
    }

    const row = await repoGetReferenceMergedById(locale, runtimeDefault, id);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') {
      return reply.code(409).send({ error: { message: 'slug_already_exists' } });
    }
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}

/** DELETE (admin) */
export async function removeReferenceAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    await ensureLocalesLoadedFromSettings();
    const { id } = (req.params ?? {}) as { id: string };
    const affected = await repoDeleteReferenceParent(id);
    if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.code(204).send();
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}
