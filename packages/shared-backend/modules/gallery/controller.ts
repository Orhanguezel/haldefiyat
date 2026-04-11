// src/modules/gallery/controller.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { repoListGalleries, repoGetGalleryBySlug, type GalleryListParams } from './repository';
import { handleRouteError, sendNotFound } from '../_shared';

/** GET /galleries */
export async function listGalleriesPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const q = (req.query || {}) as Record<string, string | undefined>;
    const params: GalleryListParams = {
      module_key: q.module_key,
      source_type: q.source_type,
      source_id: q.source_id,
      locale: q.locale || 'tr',
      is_active: true,
      is_featured: q.is_featured === '1' || q.is_featured === 'true' ? true : undefined,
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
    return handleRouteError(reply, req, err, 'GALLERY_PUBLIC');
  }
}

/** GET /galleries/:slug */
export async function getGalleryBySlugPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { slug } = req.params as { slug: string };
    const { locale } = (req.query || {}) as { locale?: string };
    const gallery = await repoGetGalleryBySlug(slug, locale || 'tr');
    if (!gallery) return sendNotFound(reply);
    return reply.send(gallery);
  } catch (err) {
    return handleRouteError(reply, req, err, 'GALLERY_PUBLIC');
  }
}
