// src/modules/telegram/settings.ts
// corporate-backend — Telegram settings from site_settings
import { TELEGRAM_EVENTS, toTelegramBool, toTelegramText, type TelegramEvent, type TelegramSettings } from './helpers';
import { repoGetSiteSettingsMap } from './repository';

export type { TelegramEvent, TelegramSettings } from './helpers';

export { repoGetSiteSettingsMap as getSiteSettingsMap } from './repository';

export async function getTelegramSettings(): Promise<TelegramSettings> {
  const eventEnableKeys = TELEGRAM_EVENTS.flatMap((e) => [
    `telegram_event_${e}_enabled`,
    `telegram_${e}_enabled`,
  ]);
  const templateKeys = TELEGRAM_EVENTS.flatMap((e) => [`telegram_template_${e}`, `telegram_${e}_template`]);

  const baseKeys = [
    'telegram_notifications_enabled',
    'telegram_enabled',
    'telegram_webhook_enabled',
    'telegram_bot_token',
    'telegram_default_chat_id',
    'telegram_chat_id',
  ];

  const allKeys = [...baseKeys, ...eventEnableKeys, ...templateKeys];
  const map = await repoGetSiteSettingsMap(allKeys);

  const enabled =
    toTelegramBool(map.get('telegram_notifications_enabled'), false) ||
    toTelegramBool(map.get('telegram_enabled'), false);

  const webhookEnabled = toTelegramBool(map.get('telegram_webhook_enabled'), true);
  const botToken = toTelegramText(map.get('telegram_bot_token'));
  const defaultChatId = toTelegramText(map.get('telegram_default_chat_id')) || null;
  const legacyChatId = toTelegramText(map.get('telegram_chat_id')) || null;

  const eventMap: Partial<Record<TelegramEvent, boolean>> = {};
  const templates: Partial<Record<TelegramEvent, string>> = {};

  for (const event of TELEGRAM_EVENTS) {
    const enabledRaw =
      map.get(`telegram_event_${event}_enabled`) ?? map.get(`telegram_${event}_enabled`) ?? null;
    if (enabledRaw != null) eventMap[event] = toTelegramBool(enabledRaw, true);

    const templateRaw =
      map.get(`telegram_template_${event}`) ?? map.get(`telegram_${event}_template`) ?? null;
    const tpl = toTelegramText(templateRaw);
    if (tpl) templates[event] = tpl;
  }

  return { enabled, webhookEnabled, botToken, defaultChatId, legacyChatId, events: eventMap, templates };
}
