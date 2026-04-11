// src/modules/library/helpers/admin-images.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { handleRouteError } from '../../_shared';

import {
  upsertLibraryImageBodySchema,
  patchLibraryImageBodySchema,
} from '../validation';

import {
  listLibraryImages,
  createLibraryImage,
  upsertLibraryImageI18n,
  upsertLibraryImageI18nAllLocales,
  updateLibraryImage,
  deleteLibraryImage,
  reorderLibrary,
} from '../repository';

import { resolveLocales, toBool } from '../admin.controller';

/* ----------------------------- images (gallery) ----------------------------- */

export async function listLibraryImagesAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { locale, def } = await resolveLocales(req);
    const rows = await listLibraryImages({ libraryId: id, locale, defaultLocale: def });
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

export async function createLibraryImageAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const parsed = upsertLibraryImageBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }
    const b = parsed.data;

    const imgId = randomUUID();
    const now = new Date();

    await createLibraryImage({
      id: imgId,
      library_id: id,
      image_asset_id:
        typeof (b as any).image_asset_id !== 'undefined' ? (b as any).image_asset_id ?? null : null,
      image_url: typeof (b as any).image_url !== 'undefined' ? (b as any).image_url ?? null : null,
      is_active: toBool((b as any).is_active) ? 1 : 0,
      display_order: typeof (b as any).display_order === 'number' ? (b as any).display_order : 0,
      created_at: now as any,
      updated_at: now as any,
    } as any);

    const { locale: loc, def } = await resolveLocales(req, { locale: (b as any).locale });

    const hasI18nFields =
      typeof (b as any).title !== 'undefined' ||
      typeof (b as any).alt !== 'undefined' ||
      typeof (b as any).caption !== 'undefined';

    if (hasI18nFields) {
      const payload: any = {};
      if (typeof (b as any).title !== 'undefined') payload.title = (b as any).title ?? null;
      if (typeof (b as any).alt !== 'undefined') payload.alt = (b as any).alt ?? null;
      if (typeof (b as any).caption !== 'undefined') payload.caption = (b as any).caption ?? null;

      const replicateAll = (b as any).replicate_all_locales ?? true;
      if (replicateAll) {
        await upsertLibraryImageI18nAllLocales(imgId, payload);
      } else {
        await upsertLibraryImageI18n(imgId, loc, payload);
      }
    }

    const rows = await listLibraryImages({
      libraryId: id,
      locale: loc,
      defaultLocale: def,
    });
    return reply.code(201).send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

export async function updateLibraryImageAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, imageId } = req.params as { id: string; imageId: string };
    const parsed = patchLibraryImageBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }
    const b = parsed.data;

    const patch: any = {};
    if (typeof (b as any).image_asset_id !== 'undefined')
      patch.image_asset_id = (b as any).image_asset_id ?? null;
    if (typeof (b as any).image_url !== 'undefined') patch.image_url = (b as any).image_url ?? null;
    if (typeof (b as any).is_active !== 'undefined')
      patch.is_active = toBool((b as any).is_active) ? 1 : 0;
    if (typeof (b as any).display_order !== 'undefined')
      patch.display_order = (b as any).display_order;

    if (Object.keys(patch).length) {
      await updateLibraryImage(imageId, patch);
    }

    const hasI18nFields =
      typeof (b as any).title !== 'undefined' ||
      typeof (b as any).alt !== 'undefined' ||
      typeof (b as any).caption !== 'undefined';

    const { locale: loc, def } = await resolveLocales(req, { locale: (b as any).locale });

    if (hasI18nFields) {
      const payload: any = {};
      if (typeof (b as any).title !== 'undefined') payload.title = (b as any).title ?? null;
      if (typeof (b as any).alt !== 'undefined') payload.alt = (b as any).alt ?? null;
      if (typeof (b as any).caption !== 'undefined') payload.caption = (b as any).caption ?? null;

      if ((b as any).apply_all_locales) {
        await upsertLibraryImageI18nAllLocales(imageId, payload);
      } else {
        await upsertLibraryImageI18n(imageId, loc, payload);
      }
    }

    const rows = await listLibraryImages({
      libraryId: id,
      locale: loc,
      defaultLocale: def,
    });
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

export async function removeLibraryImageAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, imageId } = req.params as { id: string; imageId: string };
    const affected = await deleteLibraryImage(imageId);
    if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });

    const { locale, def } = await resolveLocales(req);
    const rows = await listLibraryImages({ libraryId: id, locale, defaultLocale: def });
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

/* ----------------------------- reorder ----------------------------- */

export async function reorderLibraryAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = (req.body ?? {}) as { items?: { id: string; display_order: number }[] };
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', details: 'items bos olamaz' } });
    }

    await reorderLibrary(items);
    return reply.code(204).send();
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}
