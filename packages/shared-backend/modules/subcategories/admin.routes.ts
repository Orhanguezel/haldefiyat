import type { FastifyInstance } from 'fastify';
import { db } from '../../db/client';
import { subCategories } from './schema';
import { eq } from 'drizzle-orm';

export async function registerSubCategoriesAdmin(app: FastifyInstance) {
  const B = '/subcategories';

  app.get(B, async () => {
    return db.select().from(subCategories);
  });

  app.delete(`${B}/:id`, async (req) => {
    const { id } = req.params as { id: string };
    await db.delete(subCategories).where(eq(subCategories.id, id));
    return { success: true };
  });
}
