// src/modules/blog/controller.ts
import type { RouteHandler } from 'fastify';
import {
  handleRouteError,
  parsePage,
  sendNotFound,
  sendValidationError,
} from '@agro/shared-backend/modules/_shared';
import {
  repoCountPublishedBlogPosts,
  repoGetPublishedBlogPostBySlug,
  repoListPublishedBlogPosts,
} from './repository';
import { blogListQuerySchema } from './validation';

export const listBlogPosts: RouteHandler = async (req, reply) => {
  try {
    const raw = req.query as Record<string, string>;
    const parsed = blogListQuerySchema.safeParse(raw);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { page, limit } = parsePage(raw, { maxLimit: 50 });
    const locale = parsed.data.locale ?? 'tr';
    const lim = parsed.data.limit ?? limit;
    const pageNum = parsed.data.page ?? page;
    const off = (pageNum - 1) * lim;

    const [data, total] = await Promise.all([
      repoListPublishedBlogPosts(locale, { category: parsed.data.category, limit: lim, offset: off }),
      repoCountPublishedBlogPosts(locale, parsed.data.category),
    ]);

    return reply.send({ data, total, page: pageNum, limit: lim });
  } catch (err) {
    return handleRouteError(reply, req, err, 'blog_list_error');
  }
};

export const getBlogPostBySlug: RouteHandler = async (req, reply) => {
  try {
    const { slug } = req.params as { slug: string };
    const locale = (req.query as { locale?: string }).locale ?? 'tr';
    const row = await repoGetPublishedBlogPostBySlug(slug, locale);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'blog_get_error');
  }
};
