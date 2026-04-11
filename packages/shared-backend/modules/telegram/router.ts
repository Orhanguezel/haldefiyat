// ===================================================================
// FILE: src/modules/telegram/router.ts
// Public Telegram routes
// ===================================================================

import type { FastifyInstance } from 'fastify';
import { telegramWebhookCtrl } from './controller';

const B = '/telegram';

export async function registerTelegram(app: FastifyInstance) {
  // Telegram webhook endpoint (public)
  app.post(`${B}/webhook`, telegramWebhookCtrl);
}
