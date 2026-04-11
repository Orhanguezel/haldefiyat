// =============================================================
// FILE: src/modules/contact/admin.routes.ts
// =============================================================
import type { FastifyInstance } from 'fastify';
import { listContactsAdmin, getContactAdmin, updateContactAdmin, removeContactAdmin } from './admin.controller';

export async function registerContactsAdmin(app: FastifyInstance) {
  const B = '/contacts';
  app.get(B, listContactsAdmin);
  app.get(`${B}/:id`, getContactAdmin);
  app.patch(`${B}/:id`, updateContactAdmin);
  app.delete(`${B}/:id`, removeContactAdmin);
}
