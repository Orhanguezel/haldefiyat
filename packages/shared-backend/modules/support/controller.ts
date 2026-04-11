import type { FastifyReply, FastifyRequest } from 'fastify';
import { getAuthUserId, handleRouteError, sendForbidden, sendNotFound } from '@agro/shared-backend/modules/_shared';
import {
  faqListQuerySchema,
  ticketCreateSchema,
  ticketIdParamSchema,
  ticketListQuerySchema,
  ticketMessageCreateSchema,
} from './validation';
import { repoCreateTicket, repoGetTicketById, repoListFaqs, repoListMyTickets } from './repository';
import {
  repoInsertTicketMessage,
  repoListTicketMessages,
  repoTouchTicketUpdatedAt,
} from './ticket-messages.repository';

function getRequestMeta(req: FastifyRequest) {
  const ip = req.ip || null;
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;
  return { ip, userAgent };
}

export async function listFaqs(req: FastifyRequest, reply: FastifyReply) {
  try {
    const params = faqListQuerySchema.parse(req.query ?? {});
    return reply.send(await repoListFaqs({
      ...params,
      is_published: true,
    }));
  } catch (e) {
    return handleRouteError(reply, req, e, 'support_faqs_list_failed');
  }
}

export async function createTicket(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = ticketCreateSchema.parse(req.body ?? {});
    if (data.website && data.website.trim().length > 0) return reply.send({ ok: true });
    const userId = (() => {
      try {
        return getAuthUserId(req);
      } catch {
        return null;
      }
    })();
    const { ip, userAgent } = getRequestMeta(req);
    const created = await repoCreateTicket({
      ...data,
      user_id: userId,
      ip,
      user_agent: userAgent,
    });
    return reply.code(201).send(created);
  } catch (e) {
    return handleRouteError(reply, req, e, 'support_ticket_create_failed');
  }
}

export async function myTickets(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = getAuthUserId(req);
    const params = ticketListQuerySchema.parse(req.query ?? {});
    return reply.send(await repoListMyTickets(userId, params));
  } catch (e) {
    return handleRouteError(reply, req, e, 'support_my_tickets_failed');
  }
}

export async function getTicketMessages(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = ticketIdParamSchema.parse(req.params ?? {});
    const userId = getAuthUserId(req);
    const ticket = await repoGetTicketById(id);
    if (!ticket || ticket.user_id !== userId) return sendNotFound(reply);
    return reply.send(await repoListTicketMessages(id));
  } catch (e) {
    return handleRouteError(reply, req, e, 'support_ticket_messages_list_failed');
  }
}

export async function postTicketMessage(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = ticketIdParamSchema.parse(req.params ?? {});
    const userId = getAuthUserId(req);
    const data = ticketMessageCreateSchema.parse(req.body ?? {});
    const ticket = await repoGetTicketById(id);
    if (!ticket || ticket.user_id !== userId) return sendNotFound(reply);
    if (ticket.status === 'closed') return sendForbidden(reply);
    const created = await repoInsertTicketMessage({
      ticket_id: id,
      sender_type: 'user',
      author_id: userId,
      body: data.body,
    });
    await repoTouchTicketUpdatedAt(id);
    return reply.code(201).send(created);
  } catch (e) {
    return handleRouteError(reply, req, e, 'support_ticket_message_create_failed');
  }
}
