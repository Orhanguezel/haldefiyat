import type { FastifyInstance } from 'fastify';
import { createPublicComment, listPublicComments, uploadCommentImage } from './public.controller';

export async function registerCommentsPublic(app: FastifyInstance) {
  const pub = { config: { public: true } as const };

  app.get('/comments', pub, listPublicComments);
  app.post('/comments', pub, createPublicComment);
  app.post('/comments/upload-image', pub, uploadCommentImage);
}
