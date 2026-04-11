// src/modules/telegram/index.ts
// External module surface for telegram. Keep explicit; no export *.

export { registerTelegram } from './router';
export { registerTelegramAdmin } from './admin.routes';

export { telegramWebhookCtrl } from './controller';

export {
  adminListInbound,
  adminGetAutoReply,
  adminUpdateAutoReply,
  adminTelegramTest,
  adminTelegramSend,
  adminTelegramEvent,
} from './admin.controller';

export {
  sendTelegramGeneric,
  sendTelegramEvent,
  sendTelegramTest,
  processTelegramWebhook,
} from './service';

export { getTelegramSettings, getSiteSettingsMap } from './settings';
export type { TelegramEvent, TelegramSettings } from './settings';

export {
  TELEGRAM_EVENTS,
  toTelegramBool,
  toTelegramText,
  toTelegramSafeString,
  toTelegramChatId,
  toTelegramBoolInt,
  buildTelegramTestPayload,
  isTelegramUserTextMessage,
  mapTelegramInboundInsert,
  telegramSendRaw,
  telegramNotify,
} from './helpers';

export {
  TelegramSendBodySchema,
  TelegramEventBodySchema,
  TelegramTestBodySchema,
  TelegramInboundListQuerySchema,
  TelegramAutoReplyUpdateBodySchema,
  TelegramWebhookBodySchema,
} from './validation';
export type {
  TelegramSendBody,
  TelegramEventBody,
  TelegramTestBody,
  TelegramInboundListQuery,
  TelegramAutoReplyUpdateBody,
  TelegramWebhookBody,
} from './validation';

export {
  repoGetSiteSettingsMap,
  repoListInbound,
  repoGetAutoReply,
  repoUpsertAutoReply,
  repoInsertInbound,
} from './repository';
export type {
  InboundListParams,
  InboundListResult,
  TelegramInboundInsert,
} from './repository';

export { telegramInboundMessages } from './schema';
