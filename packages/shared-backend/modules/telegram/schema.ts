// ===================================================================
// FILE: src/modules/telegram/schema.ts
// FINAL — Telegram inbound messages schema (Drizzle / MySQL)
// ===================================================================

import {
  mysqlTable,
  char,
  varchar,
  text,
  datetime,
  index,
  uniqueIndex,
  int,
} from 'drizzle-orm/mysql-core';

export const telegramInboundMessages = mysqlTable(
  'telegram_inbound_messages',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    // Telegram update/message identifiers
    update_id: int('update_id').notNull(),
    message_id: int('message_id'), // may be null for some update types

    // Who/where
    chat_id: varchar('chat_id', { length: 64 }).notNull(),
    chat_type: varchar('chat_type', { length: 32 }),
    chat_title: varchar('chat_title', { length: 255 }),
    chat_username: varchar('chat_username', { length: 255 }),

    from_id: varchar('from_id', { length: 64 }),
    from_username: varchar('from_username', { length: 255 }),
    from_first_name: varchar('from_first_name', { length: 255 }),
    from_last_name: varchar('from_last_name', { length: 255 }),
    from_is_bot: int('from_is_bot').notNull().default(0),

    // Content
    text: text('text'),
    raw: text('raw'), // JSON string (optional but very useful)

    // Telegram timestamps
    telegram_date: int('telegram_date'), // unix seconds

    created_at: datetime('created_at', { mode: 'date' }).notNull(),
  },
  (t) => ({
    uqUpdateMessage: uniqueIndex('uq_tg_inbound_update_message').on(t.update_id, t.message_id),
    idxChat: index('idx_tg_inbound_chat_id').on(t.chat_id),
    idxCreatedAt: index('idx_tg_inbound_created_at').on(t.created_at),
  }),
);
