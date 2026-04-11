# Telegram Template Keys

`site_settings` keys used by `src/modules/telegram`:

## Required base keys
- `telegram_notifications_enabled` (`true|false`)
- `telegram_webhook_enabled` (`true|false`)
- `telegram_bot_token`
- `telegram_default_chat_id`

## Event enable flags
- `telegram_event_new_user_enabled`
- `telegram_event_new_contact_enabled`
- `telegram_event_new_ticket_enabled`

## Event templates
- `telegram_template_new_user`
- `telegram_template_new_contact`
- `telegram_template_new_ticket`

## Placeholders by event
- `new_user`: `user_name`, `user_email`, `role`, `created_at`
- `new_contact`: `name`, `email`, `phone`, `subject`, `message`, `created_at`
- `new_ticket`: `user_name`, `subject`, `category`, `created_at`

## Notes
- Generic notifications (`title + message`) do not require template keys.
- Values can be set with locale `*` for global defaults.
- Markdown parse mode is enabled in Telegram send.
