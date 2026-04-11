import type { FastifyInstance } from 'fastify';
import { requireAuth } from '@agro/shared-backend/middleware/auth';
import { createTicket, getTicketMessages, listFaqs, myTickets, postTicketMessage } from './controller';

export async function registerSupport(app: FastifyInstance) {
  const B = '/support';
  app.get(`${B}/faqs`, listFaqs);
  app.post(`${B}/tickets`, createTicket);
  app.get(`${B}/tickets/my`, { onRequest: [requireAuth] }, myTickets);
  app.get(`${B}/tickets/:id/messages`, { onRequest: [requireAuth] }, getTicketMessages);
  app.post(`${B}/tickets/:id/messages`, { onRequest: [requireAuth] }, postTicketMessage);
}
