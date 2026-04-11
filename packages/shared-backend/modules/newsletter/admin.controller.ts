import type { RouteHandler } from 'fastify';
import { asc, desc, eq, isNull, like, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { newsletterSubscribers } from './schema';

export const adminListNewsletter: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as Record<string, string | undefined>;
  const limit = Math.min(parseInt(q.limit || '200', 10) || 200, 500);
  const offset = Math.max(parseInt(q.offset || '0', 10) || 0, 0);
  const orderBy = q.orderBy || q.sort || 'created_at';
  const order = q.order === 'asc' ? 'asc' : 'desc';

  let qb = db.select().from(newsletterSubscribers).$dynamic();
  if (q.q) qb = qb.where(like(newsletterSubscribers.email, `%${q.q}%`));

  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(newsletterSubscribers);

  const col = (newsletterSubscribers as any)[orderBy] || newsletterSubscribers.created_at;
  const rows = await qb.orderBy(order === 'asc' ? asc(col) : desc(col)).limit(limit).offset(offset);

  reply.header('x-total-count', String(Number(total || 0)));
  return reply.send(rows);
};

export const adminGetNewsletterSubscriber: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(row);
};

export const adminDeleteNewsletterSubscriber: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.id, id));
  return reply.code(204).send();
};
