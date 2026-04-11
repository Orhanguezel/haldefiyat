import type { FastifyInstance } from 'fastify';
import { db } from '../../db/client';
import { subCategories, subCategoryI18n } from './schema';
import { eq } from 'drizzle-orm';

export async function registerSubCategories(app: FastifyInstance) {
  app.get('/subcategories', async () => {
    return db.select().from(subCategories);
  });

  app.get('/subcategories/:id', async (req) => {
    const { id } = req.params as { id: string };
    const rows = await db.select().from(subCategories).where(eq(subCategories.id, id));
    return rows[0] ?? null;
  });
}
