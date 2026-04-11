// src/modules/telegram/helpers/telegram.notifier.ts
// corporate-backend — Telegram notifier (site_settings templates + flags)
// Fail-safe: never throws; logs errors for debugging

import { getTelegramSettings, type TelegramEvent } from '../settings';

type TelegramNotifyInput =
  | {
      event: TelegramEvent;
      chatId?: string;
      data: Record<string, unknown>;
    }
  | {
      title: string;
      message: string;
      type?: string;
      createdAt?: Date;
      chatId?: string;
    };

const escapeTelegramMarkdown = (text: string): string => {
  return text.replace(/([\\_*`\[\]])/g, '\\$1');
};

const renderTemplate = (tpl: string, data: Record<string, unknown>): string => {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    const v = (data as Record<string, unknown>)[key];
    if (v === null || typeof v === 'undefined') return '';
    if (v instanceof Date) return escapeTelegramMarkdown(v.toISOString());
    return escapeTelegramMarkdown(String(v));
  });
};

const defaultFallbackMessage = (input: { title: string; message: string }): string => {
  const title = escapeTelegramMarkdown(input.title);
  const message = escapeTelegramMarkdown(input.message);
  return `*${title}*\n\n${message}`;
};

async function sendTelegramMessage(opts: {
  botToken: string;
  chatId: string;
  text: string;
}): Promise<void> {
  const url = `https://api.telegram.org/bot${opts.botToken}/sendMessage`;
  const payload = {
    chat_id: opts.chatId,
    text: opts.text,
    parse_mode: 'Markdown' as const,
    disable_web_page_preview: true,
  };

  const r = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`telegram_send_failed status=${r.status} body=${body}`);
  }
}

function isEventAllowed(
  events: Partial<Record<TelegramEvent, boolean>> | undefined,
  event: TelegramEvent,
): boolean {
  if (!events) return true;
  const v = events[event];
  if (typeof v === 'boolean') return v;
  return true;
}

/**
 * RAW send for webhook replies / inbound messaging.
 */
export async function telegramSendRaw(input: { chatId: string; text: string }): Promise<void> {
  try {
    const cfg = await getTelegramSettings();
    if (!cfg.webhookEnabled || !cfg.botToken) return;
    const safeText = escapeTelegramMarkdown(String(input.text ?? ''));
    await sendTelegramMessage({ botToken: cfg.botToken, chatId: input.chatId, text: safeText });
  } catch (err) {
    console.error('telegram_send_raw_failed', err);
  }
}

/**
 * Main notification function — event-based or generic.
 */
export async function telegramNotify(input: TelegramNotifyInput): Promise<void> {
  try {
    const cfg = await getTelegramSettings();
    if (!cfg.enabled || !cfg.botToken) return;

    // Event template path
    if ('event' in input) {
      const event: TelegramEvent = input.event;
      if (!isEventAllowed(cfg.events, event)) return;

      const chatId = input.chatId ?? cfg.defaultChatId ?? cfg.legacyChatId;
      if (!chatId) return;

      const tpl = (cfg.templates?.[event] ?? '').trim();
      const text = tpl
        ? renderTemplate(tpl, input.data)
        : renderTemplate(`*${event}*\n\n{{message}}`, {
            ...input.data,
            message: (input.data as Record<string, unknown>)?.message ?? '',
          });

      await sendTelegramMessage({ botToken: cfg.botToken, chatId, text });
      return;
    }

    // Generic path
    const chatId = input.chatId ?? cfg.defaultChatId ?? cfg.legacyChatId;
    if (!chatId) return;
    const text = defaultFallbackMessage({ title: input.title, message: input.message });
    await sendTelegramMessage({ botToken: cfg.botToken, chatId, text });
  } catch (err) {
    console.error('telegram_notify_failed', err);
  }
}
