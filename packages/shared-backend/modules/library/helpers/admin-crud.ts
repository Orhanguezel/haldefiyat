// src/modules/library/helpers/admin-crud.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { handleRouteError } from '../../_shared';

import {
  upsertLibraryBodySchema,
  patchLibraryBodySchema,
} from '../validation';

import {
  createLibraryParent,
  getLibraryMergedById,
  upsertLibraryI18n,
  upsertLibraryI18nAllLocales,
  updateLibraryParent,
} from '../repository';

import { resolveLocales, to01, toDateOrNull, normalizeCoverPatch } from '../admin.controller';

/* ----------------------------- create ----------------------------- */

export async function createLibraryAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = upsertLibraryBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }
    const b = parsed.data;
    const id = randomUUID();
    const now = new Date();
    const featured01 = to01((b as any).featured) ?? 0;
    const active01 = to01((b as any).is_active) ?? 1;
    const published01 = to01((b as any).is_published) ?? 0;
    const publishedAt =
      typeof (b as any).published_at !== 'undefined'
        ? toDateOrNull((b as any).published_at)
        : null;
    const coverUrl =
      typeof (b as any).image_url !== 'undefined'
        ? (b as any).image_url ?? null
        : typeof (b as any).featured_image !== 'undefined'
        ? (b as any).featured_image ?? null
        : null;

    await createLibraryParent({
      id,
      type: typeof (b as any).type === 'string' ? (b as any).type : 'other',
      category_id: typeof b.category_id !== 'undefined' ? b.category_id ?? null : null,
      sub_category_id: typeof b.sub_category_id !== 'undefined' ? b.sub_category_id ?? null : null,
      featured: featured01,
      is_published: published01,
      is_active: active01,
      display_order: typeof b.display_order === 'number' ? b.display_order : 0,
      featured_image: coverUrl,
      image_url: coverUrl,
      image_asset_id:
        typeof (b as any).image_asset_id !== 'undefined'
          ? (b as any).image_asset_id ?? null
          : null,
      published_at: publishedAt as any,
      created_at: now as any,
      updated_at: now as any,
    } as any);

    const hasI18nFields =
      typeof (b as any).name !== 'undefined' ||
      typeof (b as any).slug !== 'undefined' ||
      typeof (b as any).description !== 'undefined' ||
      typeof (b as any).image_alt !== 'undefined' ||
      typeof (b as any).tags !== 'undefined' ||
      typeof (b as any).meta_title !== 'undefined' ||
      typeof (b as any).meta_description !== 'undefined' ||
      typeof (b as any).meta_keywords !== 'undefined';

    const { locale: reqLocale, def } = await resolveLocales(req, { locale: (b as any).locale });

    if (hasI18nFields) {
      if (!((b as any).name && (b as any).slug)) {
        return reply.code(400).send({ error: { message: 'missing_required_translation_fields' } });
      }
      const payload = {
        name: String((b as any).name).trim(),
        slug: String((b as any).slug).trim(),
        description:
          typeof (b as any).description !== 'undefined' ? (b as any).description : undefined,
        image_alt:
          typeof (b as any).image_alt !== 'undefined' ? (b as any).image_alt : undefined,
        tags: typeof (b as any).tags !== 'undefined' ? (b as any).tags : undefined,
        meta_title:
          typeof (b as any).meta_title !== 'undefined' ? (b as any).meta_title : undefined,
        meta_description:
          typeof (b as any).meta_description !== 'undefined'
            ? (b as any).meta_description
            : undefined,
        meta_keywords:
          typeof (b as any).meta_keywords !== 'undefined' ? (b as any).meta_keywords : undefined,
      };
      const replicateAll = (b as any).replicate_all_locales ?? true;
      if (replicateAll) {
        await upsertLibraryI18nAllLocales(id, payload as any);
      } else {
        await upsertLibraryI18n(id, reqLocale, payload as any);
      }
    }

    const row = await getLibraryMergedById(reqLocale, def, id);
    return reply.code(201).send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

/* ----------------------------- update ----------------------------- */

export async function updateLibraryAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const parsed = patchLibraryBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }
    const b = parsed.data;

    const parentPatch: any = {};
    if (typeof (b as any).type !== 'undefined') parentPatch.type = (b as any).type;
    if (typeof b.category_id !== 'undefined') parentPatch.category_id = b.category_id ?? null;
    if (typeof b.sub_category_id !== 'undefined')
      parentPatch.sub_category_id = b.sub_category_id ?? null;
    if (typeof (b as any).featured !== 'undefined')
      parentPatch.featured = to01((b as any).featured) ?? 0;
    if (typeof (b as any).is_published !== 'undefined')
      parentPatch.is_published = to01((b as any).is_published) ?? 0;
    if (typeof (b as any).is_active !== 'undefined')
      parentPatch.is_active = to01((b as any).is_active) ?? 1;
    if (typeof b.display_order !== 'undefined') parentPatch.display_order = b.display_order;

    normalizeCoverPatch(b as any, parentPatch);

    if (typeof b.image_asset_id !== 'undefined')
      parentPatch.image_asset_id = b.image_asset_id ?? null;
    if (typeof (b as any).published_at !== 'undefined') {
      parentPatch.published_at = toDateOrNull((b as any).published_at);
    }

    if (Object.keys(parentPatch).length) {
      await updateLibraryParent(id, parentPatch);
    }

    const hasI18n =
      typeof (b as any).name !== 'undefined' ||
      typeof (b as any).slug !== 'undefined' ||
      typeof (b as any).description !== 'undefined' ||
      typeof (b as any).image_alt !== 'undefined' ||
      typeof (b as any).tags !== 'undefined' ||
      typeof (b as any).meta_title !== 'undefined' ||
      typeof (b as any).meta_description !== 'undefined' ||
      typeof (b as any).meta_keywords !== 'undefined';

    if (hasI18n) {
      const { locale: loc } = await resolveLocales(req, { locale: (b as any).locale });
      const payload: any = {};
      if (typeof (b as any).name !== 'undefined')
        payload.name = (b as any).name?.trim?.() ?? (b as any).name;
      if (typeof (b as any).slug !== 'undefined')
        payload.slug = (b as any).slug?.trim?.() ?? (b as any).slug;
      if (typeof (b as any).description !== 'undefined')
        payload.description = (b as any).description;
      if (typeof (b as any).image_alt !== 'undefined') payload.image_alt = (b as any).image_alt;
      if (typeof (b as any).tags !== 'undefined') payload.tags = (b as any).tags;
      if (typeof (b as any).meta_title !== 'undefined') payload.meta_title = (b as any).meta_title;
      if (typeof (b as any).meta_description !== 'undefined')
        payload.meta_description = (b as any).meta_description;
      if (typeof (b as any).meta_keywords !== 'undefined')
        payload.meta_keywords = (b as any).meta_keywords;

      if ((b as any).apply_all_locales) {
        await upsertLibraryI18nAllLocales(id, payload);
      } else {
        await upsertLibraryI18n(id, loc, payload);
      }
    }

    const { locale, def } = await resolveLocales(req, { locale: (b as any).locale });
    const row = await getLibraryMergedById(locale, def, id);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}
