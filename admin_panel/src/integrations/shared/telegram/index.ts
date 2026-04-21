export {
  TELEGRAM_BOOLEAN_SETTINGS_KEYS,
  type SimpleSuccessResp,
  TELEGRAM_EVENT_TOGGLES,
  TELEGRAM_SETTINGS_KEYS,
  TELEGRAM_TEMPLATE_DEFS,
  TELEGRAM_ADMIN_BASE,
  applyTelegramTemplate,
  buildTelegramPreviewVars,
  createTelegramSettingsDefaults,
  type TelegramAdminEventBody,
  type TelegramAdminSendBody,
  type TelegramAdminTestBody,
  type TelegramAdminTestResp,
  type TelegramEventToggleDef,
  type TelegramEventType,
  type TelegramNotificationBody,
  type TelegramSettingsKey,
  type TelegramSettingsModel,
  type TelegramTemplateDef,
  type TelegramTemplateVars,
  buildTelegramNotificationEventBody,
  normalizeTelegramTemplateValue,
} from '@/integrations/shared/telegram';

export {
  TELEGRAM_AUTOREPLY_ADMIN_BASE,
  TELEGRAM_AUTOREPLY_DEFAULT_TEMPLATE,
  TELEGRAM_INBOUND_ADMIN_BASE,
  type TelegramAutoReplyConfig,
  type TelegramAutoReplyMode,
  type TelegramAutoReplyUpdateBody,
  type TelegramInboundListParams,
  type TelegramInboundListResult,
  type TelegramInboundMessage,
  normalizeTelegramAutoReplyConfig,
} from '@/integrations/shared/telegram-inbound';

export {
  type TelegramUpdate,
  type TelegramWebhookResponse,
} from '@/integrations/shared/telegram-webhook';

export {
  formatTelegramInboundLocalDate,
  getTelegramInboundSenderName,
} from '@/integrations/shared/telegram-ui';
