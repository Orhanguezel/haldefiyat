// src/modules/blog/admin.routes.ts
import type { FastifyInstance } from 'fastify';
import {
  adminCreateBlogPost,
  adminDeleteBlogPost,
  adminGetBlogPost,
  adminImportRssFeeds,
  adminListBlogPosts,
  adminUpdateBlogPost,
} from './admin.controller';

export async function registerBlogAdmin(app: FastifyInstance) {
  const B = '/blog';
  app.post(`${B}/rss/import`, adminImportRssFeeds);
  app.get(B, adminListBlogPosts);
  app.get(`${B}/:id`, adminGetBlogPost);
  app.post(B, adminCreateBlogPost);
  app.put(`${B}/:id`, adminUpdateBlogPost);
  app.delete(`${B}/:id`, adminDeleteBlogPost);
}
