import type { FastifyInstance } from 'fastify';
import { repoListCategories, repoGetCategoryById } from './repository';

export async function registerCategories(app: FastifyInstance) {
  app.get('/categories', async (req) => {
    const locale = (req as any).locale || 'tr';
    return repoListCategories({ locale });
  });

  app.get('/categories/:id', async (req) => {
    const { id } = req.params as { id: string };
    const locale = (req as any).locale || 'tr';
    return repoGetCategoryById(id, locale);
  });
}
