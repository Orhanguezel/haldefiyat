// FILE: src/plugins/staticUploads.ts
import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';

export default fp(async (app: FastifyInstance) => {
  const uploadsDir = path.resolve(process.cwd(), 'uploads');

  app.register(fastifyStatic, {
    root: uploadsDir,
    prefix: '/uploads/', // https://www.bereketfide.de/uploads/...
  });
});
