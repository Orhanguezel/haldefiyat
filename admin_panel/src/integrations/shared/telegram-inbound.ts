// ===================================================================
// FILE: src/integrations/shared/telegram-inbound.ts
// Telegram inbound + auto-reply types (Ensotek)
// ===================================================================

export const TELEGRAM_INBOUND_ADMIN_BASE = '/admin/telegram/inbound';
export const TELEGRAM_AUTOREPLY_ADMIN_BASE = '/admin/telegram/autoreply';
export const TELEGRAM_AUTOREPLY_DEFAULT_TEMPLATE =
  'Mesajınız alındı. En kısa sürede size dönüş yapacağız.';

export type TelegramInboundMessage = {
  id: string;

  update_id: number;
  message_id: number | null;

  chat_id: string;
  chat_type: string | null;
  chat_title: string | null;
  chat_username: string | null;

  from_id: string | null;
  from_username: string | null;
  from_first_name: string | null;
  from_last_name: string | null;
  from_is_bot: boolean;

  text: string | null;
  telegram_date: number | null;

  created_at: string; // ISO
};

export type TelegramInboundListParams = {
  chat_id?: string;
  q?: string;
  limit?: number;
  cursor?: string;
};

export type TelegramInboundListResult = {
  items: TelegramInboundMessage[];
  next_cursor?: string | null;
};

export type TelegramAutoReplyMode = 'simple' | 'ai';

export type TelegramAutoReplyConfig = {
  enabled: boolean;
  mode: TelegramAutoReplyMode;
  template: string;
};

export type TelegramAutoReplyUpdateBody = {
  enabled?: boolean;
  mode?: TelegramAutoReplyMode;
  template?: string;
};

export function normalizeTelegramAutoReplyConfig(raw: unknown): TelegramAutoReplyConfig {
  const source =
    raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : ({} as Record<string, unknown>);

  const enabledRaw = source.enabled;
  const enabled =
    typeof enabledRaw === 'boolean'
      ? enabledRaw
      : typeof enabledRaw === 'number'
        ? enabledRaw !== 0
        : ['true', '1', 'yes', 'y', 'on'].includes(String(enabledRaw ?? '').trim().toLowerCase());

  const mode = String(source.mode ?? '').trim() === 'ai' ? 'ai' : 'simple';
  const template = String(source.template ?? '').trim() || TELEGRAM_AUTOREPLY_DEFAULT_TEMPLATE;

  return { enabled, mode, template };
}
