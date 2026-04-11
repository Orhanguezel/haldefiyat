// =============================================================
// FILE: src/modules/contact/controller.ts (PUBLIC)
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import { SITE_NAME } from '../mail';
import {
  escapeContactHtml,
  getContactRequestLocale,
  getContactRequestMeta,
  logContactRequestError,
} from "./helpers";
import { ContactCreateSchema } from './validation';
import { repoCreateContact } from './repository';
import type { ContactView } from './schema';
import { sendMailRaw } from '../mail';
import { telegramNotify } from '../telegram';

async function sendContactEmails(contact: ContactView, _locale: string | null) {
  const { getSmtpSettings } = await import('../siteSettings');
  const smtp = await getSmtpSettings().catch(() => null);
  const adminEmail = smtp?.fromEmail || smtp?.username || '';

  if (adminEmail) {
    await sendMailRaw({
      to: adminEmail,
      subject: `[İletişim] ${escapeContactHtml(contact.subject)} — ${escapeContactHtml(contact.name)}`,
      html: `<p><strong>Ad:</strong> ${escapeContactHtml(contact.name)}</p>
             <p><strong>E-posta:</strong> ${escapeContactHtml(contact.email)}</p>
             <p><strong>Telefon:</strong> ${escapeContactHtml(contact.phone ?? '')}</p>
             <p><strong>Konu:</strong> ${escapeContactHtml(contact.subject)}</p>
             <p><strong>Mesaj:</strong><br/>${escapeContactHtml(contact.message).replace(/\n/g, '<br/>')}</p>`,
      text: `Ad: ${contact.name}\nE-posta: ${contact.email}\nTelefon: ${contact.phone ?? ''}\nKonu: ${contact.subject}\n\n${contact.message}`,
    });
  }

  await sendMailRaw({
    to: contact.email,
    subject: `Mesajınız alındı — ${escapeContactHtml(contact.subject)}`,
    html: `<p>Merhaba <strong>${escapeContactHtml(contact.name)}</strong>,</p>
           <p>Mesajınız tarafımıza ulaştı. En kısa sürede yanıt vereceğiz.</p>
           <p>Iyi gunler,<br/>${SITE_NAME} Ekibi</p>`,
    text: `Merhaba ${contact.name},\n\nMesajiniz tarafimiza ulasti. En kisa surede yanit verecegiz.\n\nIyi gunler,\n${SITE_NAME} Ekibi`,
  });
}

/** POST /contacts */
export async function createContactPublic(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = ContactCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'INVALID_BODY', details: parsed.error.flatten() });
    }

    // Honeypot
    if (parsed.data.website && parsed.data.website.trim().length > 0) {
      return reply.code(200).send({ ok: true });
    }

    const { ip, userAgent } = getContactRequestMeta(req);

    const created = await repoCreateContact({ ...parsed.data, ip, user_agent: userAgent });
    const locale = getContactRequestLocale(req);

    try {
      await sendContactEmails(created, locale);
    } catch (err: unknown) {
      logContactRequestError(req, err, 'contact_email_send_failed');
    }
    try {
      await telegramNotify({
        event: 'new_contact',
        data: {
          customer_name: created.name,
          customer_email: created.email,
          customer_phone: created.phone ?? '',
          company_name: '',
          subject: created.subject ?? '',
          message: created.message,
          created_at: created.created_at instanceof Date ? created.created_at.toISOString() : new Date().toISOString(),
        },
      });
    } catch (err: unknown) {
      logContactRequestError(req, err, 'contact_telegram_failed');
    }

    return reply.code(201).send(created);
  } catch (e) {
    return handleRouteError(reply, req, e, 'create_contact');
  }
}
