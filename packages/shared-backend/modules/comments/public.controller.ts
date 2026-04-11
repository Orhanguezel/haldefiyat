import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../db/client';
import { handleRouteError, sendValidationError } from '../_shared';
import { uploadToBucket } from '../storage/controller';
import { comments } from './schema';

const listQuerySchema = z.object({
  target_type: z.string().min(1).max(64),
  target_id: z.string().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).optional().default(50),
});

const createBodySchema = z.object({
  target_type: z.string().min(1).max(64),
  target_id: z.string().min(1).max(100),
  author_name: z.string().min(1).max(255),
  content: z.string().min(1).max(8000),
  image_url: z.string().max(500).optional(),
  captcha_token: z.string().optional(),
});

function normalizeQuery(q: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!q || typeof q !== 'object') return out;
  for (const [k, v] of Object.entries(q as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    const first = Array.isArray(v) ? v[0] : v;
    out[k] = String(first);
  }
  return out;
}

export async function listPublicComments(req: FastifyRequest, reply: FastifyReply) {
  try {
    const raw = normalizeQuery(req.query);
    const parsed = listQuerySchema.safeParse(raw);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const { target_type, target_id, limit } = parsed.data;
    const rows = await db
      .select({
        id: comments.id,
        author_name: comments.author_name,
        content: comments.content,
        image_url: comments.image_url,
        created_at: comments.created_at,
        likes_count: comments.likes_count,
      })
      .from(comments)
      .where(
        and(
          eq(comments.target_type, target_type),
          eq(comments.target_id, target_id),
          eq(comments.is_approved, 1),
          eq(comments.is_active, 1),
        ),
      )
      .orderBy(desc(comments.created_at))
      .limit(limit);

    const data = rows.map((r) => ({
      id: r.id,
      author_name: r.author_name,
      content: r.content,
      image_url: r.image_url ?? null,
      created_at: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
      likes_count: Number(r.likes_count ?? 0),
    }));

    return reply.send(data);
  } catch (e) {
    return handleRouteError(reply, req, e, 'comments_public_list');
  }
}

export async function createPublicComment(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(reply, parsed.error.issues);

    const b = parsed.data;
    const id = randomUUID();
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
    const ua = (req.headers['user-agent'] as string) || null;

    await db.insert(comments).values({
      id,
      target_type: b.target_type,
      target_id: b.target_id,
      author_name: b.author_name,
      content: b.content,
      image_url: b.image_url ?? null,
      is_approved: 0,
      is_active: 1,
      ip_address: ip,
      user_agent: ua ? ua.slice(0, 500) : null,
    });

    return reply.code(201).send({ ok: true, id });
  } catch (e) {
    return handleRouteError(reply, req, e, 'comments_public_create');
  }
}

/** POST /comments/upload-image — multipart; Cloudinary/local storage (bucket: comments) */
export async function uploadCommentImage(req: FastifyRequest, reply: FastifyReply) {
  const r = req as FastifyRequest & { params: { bucket: string } };
  r.params = { ...r.params, bucket: 'comments' };
  return uploadToBucket(r, reply);
}
