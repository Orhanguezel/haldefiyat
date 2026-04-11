import type { RouteHandler } from 'fastify';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { comments } from './schema';

export const adminListComments: RouteHandler = async (req, reply) => {
  const q = (req.query || {}) as Record<string, string | undefined>;
  const limit = Math.min(parseInt(q.limit || '100', 10) || 100, 500);
  const offset = Math.max(parseInt(q.offset || '0', 10) || 0, 0);
  const sort = q.sort || 'created_at';
  const order = q.order === 'asc' ? 'asc' : 'desc';

  const [{ total }] = await db.select({ total: sql<number>`COUNT(*)` }).from(comments);

  const col = (comments as any)[sort] || comments.created_at;
  const rows = await db
    .select()
    .from(comments)
    .orderBy(order === 'asc' ? asc(col) : desc(col))
    .limit(limit)
    .offset(offset);

  reply.header('x-total-count', String(Number(total || 0)));
  return reply.send(rows);
};

export const adminGetComment: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const [row] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send(row);
};

export const adminUpdateComment: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body || {}) as any;
  const fields: any = {};
  if ('is_approved' in body) fields.is_approved = body.is_approved ? 1 : 0;
  if ('is_active' in body) fields.is_active = body.is_active ? 1 : 0;
  if ('content' in body) fields.content = body.content;

  if (Object.keys(fields).length) {
    await db.update(comments).set(fields).where(eq(comments.id, id));
  }
  return reply.send({ ok: true });
};

export const adminDeleteComment: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  await db.delete(comments).where(eq(comments.id, id));
  return reply.code(204).send();
};
