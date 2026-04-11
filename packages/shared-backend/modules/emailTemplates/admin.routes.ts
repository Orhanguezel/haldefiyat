// =============================================================
// FILE: src/modules/emailTemplates/admin.routes.ts
// =============================================================
import type { FastifyInstance } from 'fastify';
import {
  adminListEmailTemplates,
  adminGetEmailTemplate,
  adminCreateEmailTemplate,
  adminUpdateEmailTemplate,
  adminDeleteEmailTemplate,
} from './admin.controller';

export async function registerEmailTemplatesAdmin(app: FastifyInstance) {
  const B = '/email_templates';
  
  app.get(B, adminListEmailTemplates);
  app.get(`${B}/:id`, adminGetEmailTemplate);
  app.post(B, adminCreateEmailTemplate);
  app.patch(`${B}/:id`, adminUpdateEmailTemplate);
  app.delete(`${B}/:id`, adminDeleteEmailTemplate);
}
