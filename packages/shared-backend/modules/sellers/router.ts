import type { FastifyInstance } from 'fastify';
import { getPublicSeller } from './controller';

export async function registerSellers(app: FastifyInstance) {
  app.get('/sellers/:id', getPublicSeller);
}
