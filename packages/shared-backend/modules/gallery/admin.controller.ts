// src/modules/gallery/admin.controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { repoListGalleries, repoGetGalleryById, repoGetGalleryImages, type GalleryListParams } from './repository';
import {
  repoCreateGallery,
  repoUpdateGallery,
  repoDeleteGallery,
  repoReorderGalleries,
  repoAddGalleryImage,
  repoBulkAddGalleryImages,
  repoUpdateGalleryImage,
  repoDeleteGalleryImage,
  repoReorderGalleryImages,
} from './helpers/admin-repository';
import {
  galleryCreateSchema,
  galleryUpdateSchema,
  galleryImageCreateSchema,
  galleryBulkImagesSchema,
} from './validation';
import { handleRouteError, sendNotFound } from '../_shared';

/* ---- Gallery CRUD ---- */

/** GET /admin/galleries */
export async function adminListGalleries(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = (req.query || {}) as Record<string, string | undefined>;
    const params: GalleryListParams = {
      module_key: q.module_key,
      source_type: q.source_type,
      source_id: q.source_id,
      locale: q.locale || 'tr',
      is_active: q.is_active !== undefined ? (q.is_active === '1' || q.is_active === 'true') : undefined,
      is_featured: q.is_featured !== undefined ? (q.is_featured === '1' || q.is_featured === 'true') : undefined,
      q: q.q,
      limit: q.limit ? Math.min(Number(q.limit) || 50, 100) : 50,
      offset: q.offset ? Math.max(Number(q.offset) || 0, 0) : 0,
      sort: q.sort === 'created_at' ? 'created_at' : 'display_order',
      order: q.order === 'desc' ? 'desc' : 'asc',
    };
    const result = await repoListGalleries(params);
    reply.header('x-total-count', String(result.total));
    reply.header('content-range', `*/${result.total}`);
    reply.header('access-control-expose-headers', 'x-total-count, content-range');
    return reply.send(result.items);
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** GET /admin/galleries/:id */
export async function adminGetGallery(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { locale } = (req.query || {}) as { locale?: string };
    const gallery = await repoGetGalleryById(id, locale || 'tr');
    if (!gallery) return sendNotFound(reply);
    return reply.send(gallery);
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** POST /admin/galleries */
export async function adminCreateGallery(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = galleryCreateSchema.parse(req.body);
    const locale = body.locale || 'tr';
    const id = await repoCreateGallery(body, locale);
    const created = await repoGetGalleryById(id, locale);
    return reply.status(201).send(created);
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** PATCH /admin/galleries/:id */
export async function adminUpdateGallery(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const body = galleryUpdateSchema.parse(req.body);
    const locale = body.locale || 'tr';
    await repoUpdateGallery(id, body, locale);
    const updated = await repoGetGalleryById(id, locale);
    return reply.send(updated);
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** DELETE /admin/galleries/:id */
export async function adminDeleteGallery(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    await repoDeleteGallery(id);
    return reply.status(204).send();
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** POST /admin/galleries/reorder */
export async function adminReorderGalleries(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { items } = req.body as { items: { id: string; display_order: number }[] };
    if (!Array.isArray(items)) return reply.status(400).send({ error: 'items array required' });
    await repoReorderGalleries(items);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/* ---- Gallery Images ---- */

/** GET /admin/galleries/:id/images */
export async function adminListGalleryImages(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const { locale } = (req.query || {}) as { locale?: string };
    const images = await repoGetGalleryImages(id, locale || 'tr');
    return reply.send(images);
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** POST /admin/galleries/:id/images */
export async function adminAddGalleryImage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id: galleryId } = req.params as { id: string };
    const body = galleryImageCreateSchema.parse({ ...req.body as any, gallery_id: galleryId });
    const locale = body.locale || 'tr';
    const imageId = await repoAddGalleryImage(galleryId, body, locale);
    return reply.status(201).send({ id: imageId });
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** POST /admin/galleries/:id/images/bulk */
export async function adminBulkAddGalleryImages(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id: galleryId } = req.params as { id: string };
    const body = galleryBulkImagesSchema.parse({ ...req.body as any, gallery_id: galleryId });
    const ids = await repoBulkAddGalleryImages(galleryId, body.images);
    return reply.status(201).send({ ids });
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** PATCH /admin/galleries/:id/images/:imageId */
export async function adminUpdateGalleryImage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { imageId } = req.params as { id: string; imageId: string };
    const body = req.body as Record<string, any>;
    const locale = (body.locale as string) || 'tr';
    await repoUpdateGalleryImage(imageId, body, locale);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** DELETE /admin/galleries/:id/images/:imageId */
export async function adminDeleteGalleryImage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { imageId } = req.params as { id: string; imageId: string };
    await repoDeleteGalleryImage(imageId);
    return reply.status(204).send();
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}

/** POST /admin/galleries/:id/images/reorder */
export async function adminReorderGalleryImages(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { items } = req.body as { items: { id: string; display_order: number }[] };
    if (!Array.isArray(items)) return reply.status(400).send({ error: 'items array required' });
    await repoReorderGalleryImages(items);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_ADMIN');
  }
}
