// ===================================================================
// FILE: src/modules/telegram/service.ts
// Telegram module services (admin tools + inbound webhook)
// ===================================================================

import { repoInsertInbound, repoGetAutoReply } from './repository';
import type {
  TelegramSendBody,
  TelegramEventBody,
  TelegramWebhookBody,
} from './validation';
import {
  buildTelegramTestPayload,
  isTelegramUserTextMessage,
  mapTelegramInboundInsert,
  telegramNotify,
  telegramSendRaw,
  type TelegramEvent,
} from './helpers';

/**
 * Generic message send (no template selection).
 */
export async function sendTelegramGeneric(input: TelegramSendBody) {
  await telegramNotify({
    title: input.title,
    message: input.message,
    type: input.type,
    chatId: input.chat_id,
    createdAt: new Date(),
  });

  return { ok: true };
}

/**
 * Template-based event send (site_settings templates + flags).
 */
export async function sendTelegramEvent(input: TelegramEventBody) {
  await telegramNotify({
    event: input.event as TelegramEvent,
    chatId: input.chat_id,
    data: input.data ?? {},
  });

  return { ok: true };
}

/**
 * Simple test message to confirm bot token + chat_id works.
 */
export async function sendTelegramTest(chatId?: string) {
  await telegramNotify(buildTelegramTestPayload(chatId));

  return { ok: true };
}

/**
 * Stores inbound updates and optionally sends a simple auto-reply.
 */
export async function processTelegramWebhook(update: TelegramWebhookBody) {
  const msg = update.message;
  const inbound = mapTelegramInboundInsert(update);
  const chatId = inbound?.chat_id ?? '';

  // Persist only message updates with chat_id.
  if (msg && inbound && chatId) {
    await repoInsertInbound(inbound);

    const autoReply = await repoGetAutoReply();
    const isUserText = isTelegramUserTextMessage(update);

    if (autoReply.enabled && isUserText) {
      await telegramSendRaw({
        chatId,
        text: autoReply.template,
      });
    }
  }

  return { ok: true };
}
