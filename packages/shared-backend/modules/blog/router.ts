// src/modules/blog/router.ts
import type { FastifyInstance } from 'fastify';
import { getBlogPostBySlug, listBlogPosts } from './controller';
import { getBlogRssFeed } from './rss';

export async function registerBlog(app: FastifyInstance) {
  const B = '/blog';
  app.get('/feed/rss', getBlogRssFeed);
  app.get(B, listBlogPosts);
  app.get(`${B}/:slug`, getBlogPostBySlug);
}
