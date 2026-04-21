// ===================================================================
// FILE: src/integrations/shared/telegram.ts
// Telegram Admin API types
// ===================================================================

import { isObject, toStr } from '@/integrations/shared/common';

export const TELEGRAM_ADMIN_BASE = '/admin/telegram';

/** Telegram event types */
export type TelegramEventType =
  | 'new_contact'
  | 'new_catalog_request'
  | 'new_offer_request'
  | 'new_support_ticket';

/**
 * POST /admin/telegram/send
 * BE: TelegramSendBodySchema
 */
export type TelegramAdminSendBody = {
  title: string;
  message: string;
  type?: string;
  chat_id?: string;
  bot_token?: string;
};

/**
 * POST /admin/telegram/event
 * BE: TelegramEventBodySchema
 */
export type TelegramAdminEventBody = {
  event: string;
  chat_id?: string;
  data?: Record<string, unknown>;
};

/**
 * POST /admin/telegram/test
 * BE: TelegramTestBodySchema
 */
export type TelegramAdminTestBody = {
  chat_id?: string;
};

/**
 * Responses
 */
export type TelegramAdminTestResp = {
  ok: boolean;
  message?: string;
};

/** Generic success response */
export type SimpleSuccessResp = {
  ok: true;
};

/** Backward-compat: legacy notification body */
export type TelegramNotificationBody = Record<string, unknown>;

export const TELEGRAM_SETTINGS_KEYS = [
  'telegram_notifications_enabled',
  'telegram_webhook_enabled',
  'telegram_bot_token',
  'telegram_chat_id',
  'telegram_default_chat_id',
  'telegram_event_new_catalog_request_enabled',
  'telegram_event_new_offer_request_enabled',
  'telegram_event_new_contact_enabled',
  'telegram_event_new_ticket_enabled',
  'telegram_event_ticket_replied_enabled',
  'telegram_event_new_newsletter_subscription_enabled',
  'telegram_template_new_catalog_request',
  'telegram_template_new_offer_request',
  'telegram_template_new_contact',
  'telegram_template_new_ticket',
  'telegram_template_ticket_replied',
  'telegram_template_new_newsletter_subscription',
] as const;

export type TelegramSettingsKey = (typeof TELEGRAM_SETTINGS_KEYS)[number];

export type TelegramSettingsModel = Record<TelegramSettingsKey, string>;

export const TELEGRAM_BOOLEAN_SETTINGS_KEYS = new Set<TelegramSettingsKey>([
  'telegram_notifications_enabled',
  'telegram_webhook_enabled',
  'telegram_event_new_catalog_request_enabled',
  'telegram_event_new_offer_request_enabled',
  'telegram_event_new_contact_enabled',
  'telegram_event_new_ticket_enabled',
  'telegram_event_ticket_replied_enabled',
  'telegram_event_new_newsletter_subscription_enabled',
]);

export type TelegramTemplateVars = Record<string, string>;

export type TelegramEventToggleDef = {
  settingsKey: TelegramSettingsKey;
  i18nKey: string;
};

export const TELEGRAM_EVENT_TOGGLES: TelegramEventToggleDef[] = [
  { settingsKey: 'telegram_event_new_catalog_request_enabled', i18nKey: 'events.newCatalogRequest' },
  { settingsKey: 'telegram_event_new_offer_request_enabled', i18nKey: 'events.newOfferRequest' },
  { settingsKey: 'telegram_event_new_contact_enabled', i18nKey: 'events.newContact' },
  { settingsKey: 'telegram_event_new_ticket_enabled', i18nKey: 'events.newTicket' },
  { settingsKey: 'telegram_event_ticket_replied_enabled', i18nKey: 'events.ticketReplied' },
  { settingsKey: 'telegram_event_new_newsletter_subscription_enabled', i18nKey: 'events.newNewsletterSubscription' },
] as const;

export type TelegramTemplateDef = {
  settingsKey: TelegramSettingsKey;
  titleKey: string;
  varsKey: string;
};

export const TELEGRAM_TEMPLATE_DEFS: TelegramTemplateDef[] = [
  {
    settingsKey: 'telegram_template_new_catalog_request',
    titleKey: 'templates.newCatalogRequest',
    varsKey: 'templates.newCatalogRequestVars',
  },
  {
    settingsKey: 'telegram_template_new_offer_request',
    titleKey: 'templates.newOfferRequest',
    varsKey: 'templates.newOfferRequestVars',
  },
  {
    settingsKey: 'telegram_template_new_contact',
    titleKey: 'templates.newContact',
    varsKey: 'templates.newContactVars',
  },
  {
    settingsKey: 'telegram_template_new_ticket',
    titleKey: 'templates.newTicket',
    varsKey: 'templates.newTicketVars',
  },
  {
    settingsKey: 'telegram_template_ticket_replied',
    titleKey: 'templates.ticketReplied',
    varsKey: 'templates.ticketRepliedVars',
  },
  {
    settingsKey: 'telegram_template_new_newsletter_subscription',
    titleKey: 'templates.newNewsletterSubscription',
    varsKey: 'templates.newNewsletterSubscriptionVars',
  },
] as const;

export function applyTelegramTemplate(template: string, vars: TelegramTemplateVars): string {
  const source = String(template ?? '');

  return source.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, keyRaw): string => {
    const key = String(keyRaw);
    return typeof vars[key] === 'string' ? vars[key] : '';
  });
}

export function buildTelegramPreviewVars(defaultLocaleCode: string): TelegramTemplateVars {
  return {
    customer_name: 'Ayse Yilmaz',
    customer_email: 'ayse@haldefiyat.com',
    customer_phone: '+90 532 000 0000',
    company_name: 'Hal Fiyatlari',
    message: 'Domates ve salatalik fiyatlari icin guncel veri talep ediyorum.',
    created_at: '2026-03-20 10:30:00',
    product_service: 'Gunluk hal fiyat raporu',
    subject: 'Fiyat veri talebi',
    name: 'Mehmet Demir',
    email: 'mehmet@example.com',
    phone: '+90 533 111 2233',
    user_name: 'Zeynep Kaya',
    user_email: 'zeynep@firma.com',
    priority: 'high',
    category: 'Operasyon Destegi',
    locale: defaultLocaleCode,
  };
}

export function createTelegramSettingsDefaults(
  translate: (key: string) => string,
): TelegramSettingsModel {
  return {
    telegram_notifications_enabled: 'false',
    telegram_webhook_enabled: 'false',
    telegram_bot_token: '',
    telegram_chat_id: '',
    telegram_default_chat_id: '',
    telegram_event_new_catalog_request_enabled: 'false',
    telegram_event_new_offer_request_enabled: 'false',
    telegram_event_new_contact_enabled: 'false',
    telegram_event_new_ticket_enabled: 'false',
    telegram_event_ticket_replied_enabled: 'false',
    telegram_event_new_newsletter_subscription_enabled: 'false',
    telegram_template_new_catalog_request: translate('settings.templates.newCatalogRequestDefault'),
    telegram_template_new_offer_request: translate('settings.templates.newOfferRequestDefault'),
    telegram_template_new_contact: translate('settings.templates.newContactDefault'),
    telegram_template_new_ticket: translate('settings.templates.newTicketDefault'),
    telegram_template_ticket_replied: translate('settings.templates.ticketRepliedDefault'),
    telegram_template_new_newsletter_subscription: translate(
      'settings.templates.newNewsletterSubscriptionDefault',
    ),
  };
}

export function normalizeTelegramTemplateValue(value: unknown): string {
  if (isObject(value) && 'template' in value) {
    return toStr((value as { template?: unknown }).template);
  }

  return toStr(value);
}

export function buildTelegramNotificationEventBody(
  body: TelegramNotificationBody = {},
): TelegramAdminEventBody {
  const source = body as Record<string, unknown>;
  const event = String(source.event ?? source.type ?? 'new_booking').trim() || 'new_booking';
  const chatId = String(source.chat_id ?? source.chatId ?? source.chatID ?? '').trim();

  return chatId ? { event, chat_id: chatId, data: source } : { event, data: source };
}
