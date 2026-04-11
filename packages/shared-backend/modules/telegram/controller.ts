// ===================================================================
// FILE: src/modules/telegram/controller.ts
// Public Telegram handlers
// ===================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleRouteError } from '../_shared';
import { TelegramWebhookBodySchema } from './validation';
import { processTelegramWebhook } from './service';

export async function telegramWebhookCtrl(req: FastifyRequest, reply: FastifyReply) {
  try {
    const body = TelegramWebhookBodySchema.parse(req.body ?? {});
    const result = await processTelegramWebhook(body);
    return reply.code(200).send(result);
  } catch (e) {
    return handleRouteError(reply, req, e, 'telegram_webhook_failed');
  }
}
