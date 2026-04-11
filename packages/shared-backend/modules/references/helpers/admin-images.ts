import { randomUUID } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { handleRouteError } from '../../_shared';

import {
  repoListReferenceImages,
} from '../repository';
import {
  repoCreateReferenceImage,
  repoDeleteReferenceImage,
  repoUpdateReferenceImage,
  repoUpsertReferenceImageI18n,
  repoUpsertReferenceImageI18nAllLocales,
} from './write-repository';
import {
  patchReferenceImageBodySchema,
  upsertReferenceImageBodySchema,
} from '../validation';
import { resolveLocales, toBool } from '../admin.controller';

export async function listReferenceImagesAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { locale, def } = await resolveLocales(req);
    const rows = await repoListReferenceImages(id, locale, def);
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}

export async function createReferenceImageAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const parsed = upsertReferenceImageBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }

    const body = parsed.data;
    const imageId = randomUUID();
    const now = new Date();

    await repoCreateReferenceImage({
      id: imageId,
      reference_id: id,
      image_url: typeof body.image_url !== 'undefined' ? body.image_url ?? null : null,
      storage_asset_id:
        typeof body.storage_asset_id !== 'undefined' ? body.storage_asset_id ?? null : null,
      is_featured: toBool(body.is_featured) ? 1 : 0,
      is_published: toBool(body.is_published ?? true) ? 1 : 0,
      display_order: typeof body.display_order === 'number' ? body.display_order : 0,
      created_at: now as any,
      updated_at: now as any,
    } as any);

    const { locale, def } = await resolveLocales(req, { locale: body.locale });
    const hasI18nFields =
      typeof body.title !== 'undefined' || typeof body.alt !== 'undefined';

    if (hasI18nFields) {
      const payload: { title?: string | null; alt?: string | null } = {};
      if (typeof body.title !== 'undefined') payload.title = body.title ?? null;
      if (typeof body.alt !== 'undefined') payload.alt = body.alt ?? null;

      if (toBool(body.replicate_all_locales ?? true)) {
        await repoUpsertReferenceImageI18nAllLocales(imageId, payload);
      } else {
        await repoUpsertReferenceImageI18n(imageId, locale, payload);
      }
    }

    const rows = await repoListReferenceImages(id, locale, def);
    return reply.code(201).send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}

export async function updateReferenceImageAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, imageId } = req.params as { id: string; imageId: string };
    const parsed = patchReferenceImageBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }

    const body = parsed.data;
    const patch: Record<string, unknown> = {};

    if (typeof body.image_url !== 'undefined') patch.image_url = body.image_url ?? null;
    if (typeof body.storage_asset_id !== 'undefined') {
      patch.storage_asset_id = body.storage_asset_id ?? null;
    }
    if (typeof body.is_featured !== 'undefined') patch.is_featured = toBool(body.is_featured) ? 1 : 0;
    if (typeof body.is_published !== 'undefined') patch.is_published = toBool(body.is_published) ? 1 : 0;
    if (typeof body.display_order !== 'undefined') patch.display_order = body.display_order;

    if (Object.keys(patch).length > 0) {
      await repoUpdateReferenceImage(imageId, patch as any);
    }

    const { locale, def } = await resolveLocales(req, { locale: body.locale });
    const hasI18nFields =
      typeof body.title !== 'undefined' || typeof body.alt !== 'undefined';

    if (hasI18nFields) {
      const payload: { title?: string | null; alt?: string | null } = {};
      if (typeof body.title !== 'undefined') payload.title = body.title ?? null;
      if (typeof body.alt !== 'undefined') payload.alt = body.alt ?? null;

      if (toBool(body.apply_all_locales)) {
        await repoUpsertReferenceImageI18nAllLocales(imageId, payload);
      } else {
        await repoUpsertReferenceImageI18n(imageId, locale, payload);
      }
    }

    const rows = await repoListReferenceImages(id, locale, def);
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}

export async function removeReferenceImageAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, imageId } = req.params as { id: string; imageId: string };
    const affected = await repoDeleteReferenceImage(imageId);
    if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });

    const { locale, def } = await resolveLocales(req);
    const rows = await repoListReferenceImages(id, locale, def);
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'REFERENCE_ADMIN');
  }
}
