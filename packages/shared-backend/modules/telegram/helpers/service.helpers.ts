// src/modules/telegram/service.helpers.ts
// Service helpers for Telegram inbound mapping and test payloads.

import { randomUUID } from 'crypto';
import type { TelegramWebhookBody } from '../validation';

export function toTelegramSafeString(v: unknown): string {
  return String(v ?? '').trim();
}

export function toTelegramChatId(v: unknown): string {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return toTelegramSafeString(v);
}

export function toTelegramBoolInt(v: unknown): number {
  return v === true ? 1 : 0;
}

export function buildTelegramTestPayload(chatId?: string) {
  return {
    title: 'Telegram Test',
    message: 'Telegram bildirim testi başarılı.',
    chatId,
    createdAt: new Date(),
  };
}

export function isTelegramUserTextMessage(update: TelegramWebhookBody): boolean {
  const message = update.message;
  return !message?.from?.is_bot && typeof message?.text === 'string' && message.text.trim().length > 0;
}

export function mapTelegramInboundInsert(update: TelegramWebhookBody) {
  const message = update.message;
  const chatId = toTelegramChatId(message?.chat?.id);
  if (!message || !chatId) return null;

  return {
    id: randomUUID(),
    update_id: Number(update.update_id),
    message_id: typeof message.message_id === 'number' ? message.message_id : null,
    chat_id: chatId,
    chat_type: toTelegramSafeString(message.chat?.type) || null,
    chat_title: toTelegramSafeString(message.chat?.title) || null,
    chat_username: toTelegramSafeString(message.chat?.username) || null,
    from_id: toTelegramChatId(message.from?.id) || null,
    from_username: toTelegramSafeString(message.from?.username) || null,
    from_first_name: toTelegramSafeString(message.from?.first_name) || null,
    from_last_name: toTelegramSafeString(message.from?.last_name) || null,
    from_is_bot: toTelegramBoolInt(message.from?.is_bot),
    text: typeof message.text === 'string' ? message.text : null,
    raw: JSON.stringify(update),
    telegram_date: typeof message.date === 'number' ? message.date : null,
    created_at: new Date(),
  };
}
