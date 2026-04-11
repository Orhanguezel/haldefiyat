import type { FastifyInstance } from 'fastify';
import {
  adminCreateFaq,
  adminDeleteFaq,
  adminGetFaq,
  adminDeleteTicket,
  adminGetTicket,
  adminListFaqs,
  adminListTickets,
  adminReorderFaqs,
  adminUpdateFaq,
  adminUpdateTicket,
} from './admin.controller';
import { adminListTicketMessages, adminPostTicketMessage } from './admin-messages.controller';

export async function registerSupportAdmin(app: FastifyInstance) {
  const B = '/support';
  app.get(`${B}/faqs`, adminListFaqs);
  app.get(`${B}/faqs/:id`, adminGetFaq);
  app.post(`${B}/faqs`, adminCreateFaq);
  app.patch(`${B}/faqs/:id`, adminUpdateFaq);
  app.delete(`${B}/faqs/:id`, adminDeleteFaq);
  app.post(`${B}/faqs/reorder`, adminReorderFaqs);
  app.get(`${B}/tickets`, adminListTickets);
  app.get(`${B}/tickets/:id/messages`, adminListTicketMessages);
  app.post(`${B}/tickets/:id/messages`, adminPostTicketMessage);
  app.get(`${B}/tickets/:id`, adminGetTicket);
  app.patch(`${B}/tickets/:id`, adminUpdateTicket);
  app.delete(`${B}/tickets/:id`, adminDeleteTicket);
}
