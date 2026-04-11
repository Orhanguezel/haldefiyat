import type { FastifyInstance } from 'fastify';
import { getPage, getPageBySlug, listPages } from './controller';

export async function registerCustomPages(app: FastifyInstance) {
  const B = '/custom-pages';
  app.get(B, listPages);
  app.get(`${B}/by-slug/:slug`, getPageBySlug);
  app.get(`${B}/:id`, getPage);
}
