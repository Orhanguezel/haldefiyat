// src/modules/mail/controller.ts
import type { FastifyRequest, FastifyReply } from "fastify";
import { handleRouteError, getAuthUserId } from "../../_shared";
import { resolveTestMailRecipient } from "./helpers";
import { sendMailRaw } from "./service";
import { sendMailSchema } from "./validation";

/** POST /mail/test */
export async function sendTestMail(req: FastifyRequest, reply: FastifyReply) {
  try {
    getAuthUserId(req);
    const body = (req.body ?? {}) as { to?: string };
    const to = resolveTestMailRecipient(req, body);
    if (!to) return reply.code(400).send({ error: { message: "to_required_for_test_mail" } });

    await sendMailRaw({
      to,
      subject: "SMTP Test",
      text: "Bu bir test mailidir. SMTP ayarlariniz basarili gorunuyor.",
      html: "<p>Bu bir <strong>test mailidir</strong>. SMTP ayarlariniz basarili gorunuyor.</p>",
    });
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, "mail_test_failed");
  }
}

/** POST /mail/send */
export async function sendMailHandler(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = sendMailSchema.parse(req.body ?? {});
    await sendMailRaw(body);
    return reply.code(201).send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, "mail_send_failed");
  }
}
