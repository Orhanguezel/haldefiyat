import type { FastifyReply, FastifyRequest } from 'fastify';
import { handleRouteError, sendNotFound } from '@agro/shared-backend/modules/_shared';
import {
  faqCreateSchema,
  faqListQuerySchema,
  faqReorderSchema,
  faqUpdateSchema,
  ticketListQuerySchema,
  ticketUpdateSchema,
} from './validation';
import {
  repoCreateFaq,
  repoDeleteFaq,
  repoDeleteTicket,
  repoGetFaqById,
  repoGetTicketById,
  repoListFaqs,
  repoListTickets,
  repoReorderFaqs,
  repoUpdateFaq,
  repoUpdateTicket,
} from './repository';

export async function adminListFaqs(req: FastifyRequest, reply: FastifyReply) {
  try {
    const params = faqListQuerySchema.parse(req.query ?? {});
    return reply.send(await repoListFaqs(params));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_faqs_list');
  }
}

export async function adminCreateFaq(req: FastifyRequest, reply: FastifyReply) {
  try {
    const data = faqCreateSchema.parse(req.body ?? {});
    const { id } = await repoCreateFaq(data);
    return reply.code(201).send(await repoGetFaqById(id, data.locale));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_faq_create');
  }
}

export async function adminGetFaq(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const params = faqListQuerySchema.pick({ locale: true }).parse(req.query ?? {});
    const row = await repoGetFaqById(id, params.locale);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_faq_get');
  }
}

export async function adminUpdateFaq(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const data = faqUpdateSchema.parse(req.body ?? {});
    const existing = await repoGetFaqById(id, data.locale);
    if (!existing) return sendNotFound(reply);
    await repoUpdateFaq(id, data);
    return reply.send(await repoGetFaqById(id, data.locale));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_faq_update');
  }
}

export async function adminDeleteFaq(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    if (!(await repoGetFaqById(id, 'tr'))) return sendNotFound(reply);
    await repoDeleteFaq(id);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_faq_delete');
  }
}

export async function adminReorderFaqs(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { items } = faqReorderSchema.parse(req.body ?? {});
    await repoReorderFaqs(items);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_faq_reorder');
  }
}

export async function adminListTickets(req: FastifyRequest, reply: FastifyReply) {
  try {
    const params = ticketListQuerySchema.parse(req.query ?? {});
    return reply.send(await repoListTickets(params));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_tickets_list');
  }
}

export async function adminGetTicket(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetTicketById(id);
    if (!row) return sendNotFound(reply);
    return reply.send(row);
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_ticket_get');
  }
}

export async function adminUpdateTicket(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const row = await repoGetTicketById(id);
    if (!row) return sendNotFound(reply);
    const data = ticketUpdateSchema.parse(req.body ?? {});
    return reply.send(await repoUpdateTicket(id, data));
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_ticket_update');
  }
}

export async function adminDeleteTicket(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    if (!(await repoGetTicketById(id))) return sendNotFound(reply);
    await repoDeleteTicket(id);
    return reply.send({ ok: true });
  } catch (e) {
    return handleRouteError(reply, req, e, 'admin_support_ticket_delete');
  }
}
