import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { db } from '../../db/client';
import { newsletterSubscribers } from './schema';

const VALID_SEGMENTS = ['urunler', 'haberler', 'bilgi-bankasi'] as const;
type Segment = (typeof VALID_SEGMENTS)[number];

interface SubscribeBody {
  email: string;
  locale?: string;
  segments?: string[];
  source?: string;
}

export async function subscribeNewsletter(req: FastifyRequest, reply: FastifyReply) {
  const { email, locale, segments, source } = req.body as SubscribeBody;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply.code(422).send({ error: { message: 'invalid_email' } });
  }

  const cleanSegments: Segment[] = Array.isArray(segments)
    ? (segments.filter((s) => VALID_SEGMENTS.includes(s as Segment)) as Segment[])
    : [];

  const meta = JSON.stringify({
    source: source || 'shared-backend',
    segments: cleanSegments,
  });

  const [existing] = await db
    .select({ id: newsletterSubscribers.id, unsubscribed_at: newsletterSubscribers.unsubscribed_at })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email.toLowerCase().trim()))
    .limit(1);

  if (existing) {
    if (existing.unsubscribed_at) {
      await db
        .update(newsletterSubscribers)
        .set({ unsubscribed_at: null, meta, locale: locale || 'tr', updated_at: new Date() })
        .where(eq(newsletterSubscribers.id, existing.id));
      return reply.code(200).send({ success: true, reactivated: true });
    }

    await db
      .update(newsletterSubscribers)
      .set({ meta, updated_at: new Date() })
      .where(eq(newsletterSubscribers.id, existing.id));
    return reply.code(200).send({ success: true });
  }

  await db.insert(newsletterSubscribers).values({
    id: randomUUID(),
    email: email.toLowerCase().trim(),
    is_verified: false,
    locale: locale || 'tr',
    meta,
  });

  return reply.code(201).send({ success: true });
}

export async function registerNewsletter(app: FastifyInstance) {
  app.post('/newsletter/subscribe', subscribeNewsletter);
}
