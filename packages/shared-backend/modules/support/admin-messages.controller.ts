import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuthUserId, handleRouteError, sendNotFound } from '@agro/shared-backend/modules/_shared';
import { ticketIdParamSchema, ticketMessageCreateSchema } from './validation';
import { repoGetTicketById, repoUpdateTicket } from './repository';
import {
  repoInsertTicketMessage,
  repoListTicketMessages,
  repoTouchTicketUpdatedAt,
} from './ticket-messages.repository';

export async function adminListTicketMessages(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = ticketIdParamSchema.parse(req.params ?? {});
    const ticket = await repoGetTicketById(id);
    if (!ticket) return sendNotFound(reply);
    return reply.send(await repoListTicketMessages(id));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_ticket_messages_list');
  }
}

export async function adminPostTicketMessage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = ticketIdParamSchema.parse(req.params ?? {});
    const adminId = getAuthUserId(req);
    const data = ticketMessageCreateSchema.parse(req.body ?? {});
    const ticket = await repoGetTicketById(id);
    if (!ticket) return sendNotFound(reply);
    const created = await repoInsertTicketMessage({
      ticket_id: id,
      sender_type: 'staff',
      author_id: adminId,
      body: data.body,
    });
    if (ticket.status === 'open') await repoUpdateTicket(id, { status: 'in_progress' });
    else await repoTouchTicketUpdatedAt(id);
    return reply.code(201).send(created);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_ticket_message_create');
  }
}
