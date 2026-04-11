// =============================================================
// FILE: src/modules/contact/admin.controller.ts
// =============================================================
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError, sendNotFound } from '../_shared';
import { ContactListParamsSchema, ContactUpdateSchema } from './validation';
import { repoListContacts, repoGetContactById, repoUpdateContact, repoDeleteContact } from './repository';

/** GET /admin/contacts */
export async function listContactsAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const parsed = ContactListParamsSchema.parse(req.query ?? {});
    const list = await repoListContacts(parsed);
    return reply.send(list);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_list_contacts');
  }
}

/** GET /admin/contacts/:id */
export async function getContactAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetContactById(id);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_get_contact');
  }
}

/** PATCH /admin/contacts/:id */
export async function updateContactAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const data = ContactUpdateSchema.parse(req.body ?? {});
    const updated = await repoUpdateContact(id, data);
    if (!updated) return sendNotFound(reply);
    return reply.send(updated);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_update_contact');
  }
}

/** DELETE /admin/contacts/:id */
export async function removeContactAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const ok = await repoDeleteContact(id);
    return reply.send({ ok });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_delete_contact');
  }
}
