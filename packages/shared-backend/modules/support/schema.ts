import {
  char,
  datetime,
  foreignKey,
  index,
  int,
  mysqlTable,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { longtext } from '@agro/shared-backend/modules/_shared';
import { users } from '@agro/shared-backend/modules/auth';

export const supportFaqs = mysqlTable(
  'support_faqs',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    category: varchar('category', { length: 100 }).notNull().default('genel'),
    display_order: int('display_order').notNull().default(0),
    is_published: tinyint('is_published').notNull().default(1),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [index('support_faqs_category_idx').on(t.category), index('support_faqs_order_idx').on(t.display_order)],
);

export const supportFaqsI18n = mysqlTable(
  'support_faqs_i18n',
  {
    faq_id: char('faq_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 10 }).notNull().default('tr'),
    question: varchar('question', { length: 500 }).notNull(),
    answer: longtext('answer').notNull(),
  },
  (t) => [
    foreignKey({
      columns: [t.faq_id],
      foreignColumns: [supportFaqs.id],
      name: 'fk_support_faq_i18n',
    }).onDelete('cascade'),
  ],
);

/** `user` = musteri, `staff` = admin panel kullanicisi */
export const supportTicketMessages = mysqlTable(
  'support_ticket_messages',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    ticket_id: char('ticket_id', { length: 36 }).notNull(),
    sender_type: varchar('sender_type', { length: 16 }).notNull(),
    author_id: char('author_id', { length: 36 }),
    body: longtext('body').notNull(),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index('support_ticket_messages_ticket_idx').on(t.ticket_id),
    index('support_ticket_messages_created_idx').on(t.created_at),
    foreignKey({
      columns: [t.ticket_id],
      foreignColumns: [supportTickets.id],
      name: 'fk_support_ticket_message_ticket',
    }).onDelete('cascade'),
    foreignKey({
      columns: [t.author_id],
      foreignColumns: [users.id],
      name: 'fk_support_ticket_message_author',
    }).onDelete('set null'),
  ],
);

export const supportTickets = mysqlTable(
  'support_tickets',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    subject: varchar('subject', { length: 255 }).notNull(),
    message: longtext('message').notNull(),
    category: varchar('category', { length: 100 }).notNull().default('genel'),
    status: varchar('status', { length: 20 }).notNull().default('open'),
    priority: varchar('priority', { length: 20 }).notNull().default('normal'),
    admin_note: longtext('admin_note'),
    ip: varchar('ip', { length: 64 }),
    user_agent: varchar('user_agent', { length: 500 }),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('support_tickets_status_idx').on(t.status),
    index('support_tickets_category_idx').on(t.category),
    index('support_tickets_created_idx').on(t.created_at),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: 'fk_support_ticket_user',
    }).onDelete('set null'),
  ],
);

export type SupportFaq = typeof supportFaqs.$inferSelect;
export type NewSupportFaq = typeof supportFaqs.$inferInsert;
export type SupportFaqI18n = typeof supportFaqsI18n.$inferSelect;
export type NewSupportFaqI18n = typeof supportFaqsI18n.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type SupportTicketMessage = typeof supportTicketMessages.$inferSelect;
export type NewSupportTicketMessage = typeof supportTicketMessages.$inferInsert;
