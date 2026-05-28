import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { mysqlTable, char, varchar, tinyint, datetime, longtext } from "drizzle-orm/mysql-core";

import { db } from "@/db/client";
import { sendBereketMail } from "@agro/shared-backend/core/mail";
import { telegramNotify } from "@agro/shared-backend/modules/telegram/helpers/telegram.notifier";

import { decodeEmail, verifyUnsubToken, unsubHeaders } from "./token";
import { buildWelcomeEmail } from "./welcome-email";

// Ortak `newsletter_subscribers` tablosu icin local proxy (digest ile ayni tablo).
const subscribers = mysqlTable("newsletter_subscribers", {
  id: char("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  isVerified: tinyint("is_verified").notNull().default(0),
  locale: varchar("locale", { length: 10 }),
  meta: longtext("meta").notNull(),
  unsubscribedAt: datetime("unsubscribed_at", { fsp: 3 }),
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscribeBody = { email?: string; source?: string; locale?: string };
type UnsubInput = { e?: string; t?: string };

async function subscribe(req: FastifyRequest, reply: FastifyReply) {
  const { email, source, locale } = (req.body ?? {}) as SubscribeBody;
  const clean = (email || "").toLowerCase().trim();
  if (!clean || !EMAIL_RE.test(clean)) {
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
    await sendBereketMail({ to: clean, subject, html, headers: unsubHeaders(clean) });
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
