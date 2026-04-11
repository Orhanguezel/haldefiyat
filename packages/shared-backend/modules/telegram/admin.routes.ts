// ===================================================================
// FILE: src/modules/telegram/admin.routes.ts
// Admin Telegram route definitions (guards are in app.ts admin plugin)
// ===================================================================

import type { FastifyInstance } from 'fastify';
import {
  adminListInbound,
  adminGetAutoReply,
  adminUpdateAutoReply,
  adminTelegramTest,
  adminTelegramSend,
  adminTelegramEvent,
} from './admin.controller';

export async function registerTelegramAdmin(app: FastifyInstance) {
  const B = '/telegram';

  app.get(`${B}/inbound`, adminListInbound);

  app.get(`${B}/autoreply`, adminGetAutoReply);
  app.post(`${B}/autoreply`, adminUpdateAutoReply);

  app.post(`${B}/test`, adminTelegramTest);
  app.post(`${B}/send`, adminTelegramSend);
  app.post(`${B}/event`, adminTelegramEvent);
}
