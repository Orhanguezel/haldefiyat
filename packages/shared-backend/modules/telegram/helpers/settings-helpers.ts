// src/modules/telegram/helpers/settings-helpers.ts

import { toBool } from '../../_shared';

export type TelegramEvent =
  | 'new_user'
  | 'new_contact'
  | 'new_ticket';

export type TelegramSettings = {
  enabled: boolean;
  webhookEnabled: boolean;
  botToken: string;
  defaultChatId: string | null;
  legacyChatId: string | null;
  events: Partial<Record<TelegramEvent, boolean>>;
  templates: Partial<Record<TelegramEvent, string>>;
};

export const TELEGRAM_EVENTS: TelegramEvent[] = [
  'new_user',
  'new_contact',
  'new_ticket',
];

export function toTelegramBool(v: string | null | undefined, fallback = false): boolean {
  if (v == null) return fallback;
  const s = String(v).trim();
  if (!s) return fallback;
  return toBool(s);
}

export function toTelegramText(v: string | null | undefined): string {
  return String(v ?? '').trim();
}
