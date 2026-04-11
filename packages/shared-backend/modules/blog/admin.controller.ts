// src/modules/blog/admin.controller.ts
import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import {
  repoAdminGetBlogPost,
  repoAdminListBlogPosts,
  repoDeleteBlogPost,
  repoInsertBlogPost,
  repoUpdateBlogPost,
} from './repository';
import { blogPostCreateSchema, blogPostUpdateSchema, rssImportBodySchema } from './validation';
import {
  handleRouteError,
  sendNotFound,
  sendValidationError,
} from '@agro/shared-backend/modules/_shared';
import { runRssImport } from './rss-import.service';
import { getEffectiveDefaultLocale } from '@agro/shared-backend/modules/siteSettings';

async function resolveAdminBlogLocale(input?: string): Promise<string> {
  const locale = String(input || '').trim().toLowerCase();
  if (locale) return locale;
  return getEffectiveDefaultLocale();
}

function parsePublishedAt(input: string | null | undefined): Date | null {
  if (input === null || input === undefined || input === '') return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const adminListBlogPosts: RouteHandler = async (req, reply) => {
  try {
    const locale = await resolveAdminBlogLocale((req.query as { locale?: string }).locale);
    const rows = await repoAdminListBlogPosts(locale);
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_list_blog_error');
  }
};

export const adminGetBlogPost: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const locale = await resolveAdminBlogLocale((req.query as { locale?: string }).locale);
    const row = await repoAdminGetBlogPost(id, locale);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_get_blog_error');
  }
};

export const adminCreateBlogPost: RouteHandler = async (req, reply) => {
  try {
    const input = blogPostCreateSchema.parse(req.body ?? {});
    const id = randomUUID();
    let publishedAt = parsePublishedAt(input.published_at);
    if (input.status === 'published' && !publishedAt) {
      publishedAt = new Date();
    }

    await repoInsertBlogPost(
      id,
      {
        category: input.category,
        author: input.author ?? null,
        image_url: input.image_url ?? null,
        status: input.status,
        published_at: publishedAt,
        is_active: input.is_active ? 1 : 0,
        display_order: input.display_order,
      },
      {
        locale: input.locale,
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        content: input.content,
        meta_title: input.meta_title ?? null,
        meta_description: input.meta_description ?? null,
      },
    );

    const created = await repoAdminGetBlogPost(id, input.locale);
    return reply.status(201).send(created);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_create_blog_error');
  }
};

export const adminUpdateBlogPost: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const input = blogPostUpdateSchema.parse(req.body ?? {});
    const locale = await resolveAdminBlogLocale(input.locale);

    const existing = await repoAdminGetBlogPost(id, locale);
    if (!existing) return sendNotFound(reply);

    const base: Record<string, unknown> = {};
    if (input.category !== undefined) base.category = input.category;
    if (input.author !== undefined) base.author = input.author;
    if (input.image_url !== undefined) base.image_url = input.image_url;
    if (input.status !== undefined) base.status = input.status;
    if (input.is_active !== undefined) base.is_active = input.is_active ? 1 : 0;
    if (input.display_order !== undefined) base.display_order = input.display_order;

    if (input.published_at !== undefined) {
      base.published_at = parsePublishedAt(input.published_at);
    } else if (input.status === 'published' && !existing.published_at) {
      base.published_at = new Date();
    }

    const i18n: Record<string, unknown> = { locale };
    if (input.title !== undefined) i18n.title = input.title;
    if (input.slug !== undefined) i18n.slug = input.slug;
    if (input.excerpt !== undefined) i18n.excerpt = input.excerpt;
    if (input.content !== undefined) i18n.content = input.content;
    if (input.meta_title !== undefined) i18n.meta_title = input.meta_title;
    if (input.meta_description !== undefined) i18n.meta_description = input.meta_description;

    await repoUpdateBlogPost(
      id,
      Object.keys(base).length > 0 ? (base as Parameters<typeof repoUpdateBlogPost>[1]) : {},
      Object.keys(i18n).length > 1 ? (i18n as Parameters<typeof repoUpdateBlogPost>[2]) : undefined,
    );

    const updated = await repoAdminGetBlogPost(id, locale);
    return reply.send(updated);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_update_blog_error');
  }
};

export const adminDeleteBlogPost: RouteHandler = async (req, reply) => {
  try {
    const { id } = req.params as { id: string };
    const locale = await resolveAdminBlogLocale((req.query as { locale?: string }).locale);
    const existing = await repoAdminGetBlogPost(id, locale);
    if (!existing) return sendNotFound(reply);
    await repoDeleteBlogPost(id);
    return reply.send({ ok: true });
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_delete_blog_error');
  }
};

export const adminImportRssFeeds: RouteHandler = async (req, reply) => {
  try {
    const parsed = rssImportBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);
    const body = parsed.data;
    const result = await runRssImport({
      feedUrls: body.feed_urls,
      force: body.force,
      locale: body.locale,
      category: body.category,
    });
    return reply.send(result);
  } catch (err) {
    return handleRouteError(reply, req, err, 'admin_import_rss_error');
  }
};
