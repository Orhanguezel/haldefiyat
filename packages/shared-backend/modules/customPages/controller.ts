import type { FastifyReply, FastifyRequest } from 'fastify';
import { handleRouteError, sendNotFound, toBool } from '../_shared';
import { bySlugParamsSchema, listQuerySchema } from './validation';
import { repoGetCustomPageById, repoGetCustomPageBySlug, repoListCustomPages } from './repository';

export async function listPages(req: FastifyRequest, reply: FastifyReply) {
  try {
    const params = listQuerySchema.parse(req.query ?? {});
    const rows = await repoListCustomPages({
      ...params,
      is_published: true,
    });
    return reply.send(rows.filter((row) => toBool(row.is_published)));
  } catch (e) {
    return handleRouteError(reply, req, e, 'custom_pages_list_failed');
  }
}

export async function getPage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const locale = (req.query as { locale?: string } | undefined)?.locale ?? 'tr';
    const row = await repoGetCustomPageById(id, locale);
    if (!row || !toBool(row.is_published)) return sendNotFound(reply);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'custom_page_get_failed');
  }
}

export async function getPageBySlug(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { slug } = bySlugParamsSchema.parse(req.params ?? {});
    const locale = (req.query as { locale?: string } | undefined)?.locale ?? 'tr';
    const row = await repoGetCustomPageBySlug(slug, locale);
    if (!row || !toBool(row.is_published)) return sendNotFound(reply);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'custom_page_slug_failed');
  }
}
