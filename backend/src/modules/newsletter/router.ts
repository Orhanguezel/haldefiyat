import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { mysqlTable, char, varchar, tinyint, datetime, longtext } from "drizzle-orm/mysql-core";

import { db, pool } from "@/db/client";
import { sendBereketMail } from "@agro/shared-backend/core/mail";
import { telegramNotify } from "@agro/shared-backend/modules/telegram/helpers/telegram.notifier";

import { decodeEmail, verifyUnsubToken, unsubHeaders } from "./token";
import { buildWelcomeEmail } from "./welcome-email";
import { isValidEmail, normalizeEmail } from "@agro/shared-backend/core/email-validate";

// Ortak `newsletter_subscribers` tablosu icin local proxy (digest ile ayni tablo).
const subscribers = mysqlTable("newsletter_subscribers", {
  id: char("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  isVerified: tinyint("is_verified").notNull().default(0),
  locale: varchar("locale", { length: 10 }),
  meta: longtext("meta").notNull(),
  unsubscribedAt: datetime("unsubscribed_at", { fsp: 3 }),
});


type SubscribeBody = { email?: string; source?: string; locale?: string };
type UnsubInput = { e?: string; t?: string };

async function subscribe(req: FastifyRequest, reply: FastifyReply) {
  const { email, source, locale } = (req.body ?? {}) as SubscribeBody;
  const clean = normalizeEmail(email);
  if (!isValidEmail(clean)) {
    return reply.code(422).send({ error: { message: "invalid_email" } });
  }

  const meta = JSON.stringify({ source: source || "hal-local", optin: "single" });

  const [existing] = await db
    .select({ id: subscribers.id, unsub: subscribers.unsubscribedAt })
    .from(subscribers)
    .where(eq(subscribers.email, clean))
    .limit(1);

  if (existing) {
    // Reaktivasyon / guncelleme — welcome maili tekrar gonderme.
    await db
      .update(subscribers)
      .set({ unsubscribedAt: null, isVerified: 1, meta, locale: locale || "tr" })
      .where(eq(subscribers.id, existing.id));
    return reply.code(200).send({ success: true, reactivated: !!existing.unsub });
  }

  // Single opt-in: explicit form girisi = acik riza -> is_verified=1.
  await db.insert(subscribers).values({
    id: randomUUID(),
    email: clean,
    isVerified: 1,
    locale: locale || "tr",
    meta,
  });

  // Welcome mail (best-effort — hata subscribe'i bozmaz).
  try {
    const { subject, html } = buildWelcomeEmail(clean);
    await sendBereketMail({ to: clean, subject, html, headers: unsubHeaders(clean) } as Parameters<typeof sendBereketMail>[0]);
  } catch (err) {
    req.log.warn({ err }, "newsletter_welcome_mail_failed");
  }

  telegramNotify({
    event: "new_newsletter_subscription",
    data: { email: clean, locale: locale || "tr", created_at: new Date().toISOString() },
  }).catch(() => {});

  return reply.code(201).send({ success: true });
}

async function unsubscribe(req: FastifyRequest, reply: FastifyReply) {
  // RFC 8058 one-click: e/t query'de gelir, POST body `List-Unsubscribe=One-Click` olur.
  // Frontend /abonelik ise body ile gonderir. Ikisini de destekle: query oncelikli.
  const query = (req.query ?? {}) as UnsubInput;
  const body = (req.body ?? {}) as UnsubInput;
  const encoded = query.e || body.e || "";
  const token = query.t || body.t || "";
  const email = encoded ? decodeEmail(encoded) : "";

  if (!email || !token || !verifyUnsubToken(email, token)) {
    return reply.code(400).send({ error: { message: "invalid_token" } });
  }

  await db
    .update(subscribers)
    .set({ unsubscribedAt: new Date() })
    .where(eq(subscribers.email, email));

  return reply.code(200).send({ success: true });
}

export async function registerHalNewsletter(app: FastifyInstance) {
  app.post("/newsletter/subscribe", subscribe);
  app.post("/newsletter/unsubscribe", unsubscribe);
  app.get("/newsletter/unsubscribe", unsubscribe); // one-click / List-Unsubscribe uyumu
}

// Funnel ölçümü: hangi CTA/kaynak kaç abone getiriyor + günlük akış.
export async function registerHalNewsletterAdmin(app: FastifyInstance) {
  app.get("/newsletter/funnel", async (_req, reply) => {
    const [[totals]] = await pool.query<any[]>(
      `SELECT COUNT(*) total,
         SUM(unsubscribed_at IS NULL) active,
         SUM(unsubscribed_at IS NOT NULL) unsubscribed,
         SUM(created_at >= NOW() - INTERVAL 7 DAY) last7,
         SUM(created_at >= NOW() - INTERVAL 30 DAY) last30
       FROM newsletter_subscribers`,
    );
    const [bySource] = await pool.query<any[]>(
      `SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(meta, '$.source')), '(belirsiz)') source,
         COUNT(*) n, SUM(unsubscribed_at IS NULL) active
       FROM newsletter_subscribers GROUP BY source ORDER BY n DESC`,
    );
    const [byDay] = await pool.query<any[]>(
      `SELECT DATE(created_at) day, COUNT(*) n
       FROM newsletter_subscribers WHERE created_at >= NOW() - INTERVAL 30 DAY
       GROUP BY DATE(created_at) ORDER BY day`,
    );
    return reply.send({
      data: {
        total: Number(totals?.total ?? 0),
        active: Number(totals?.active ?? 0),
        unsubscribed: Number(totals?.unsubscribed ?? 0),
        last7: Number(totals?.last7 ?? 0),
        last30: Number(totals?.last30 ?? 0),
        bySource: (bySource ?? []).map((r) => ({ source: r.source, n: Number(r.n), active: Number(r.active) })),
        byDay: (byDay ?? []).map((r) => ({
          day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10),
          n: Number(r.n),
        })),
      },
    });
  });
}
