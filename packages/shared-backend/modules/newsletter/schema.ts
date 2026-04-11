import {
  mysqlTable,
  char,
  varchar,
  longtext,
  tinyint,
  datetime,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const newsletterSubscribers = mysqlTable(
  'newsletter_subscribers',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    is_verified: tinyint('is_verified').notNull().default(0).$type<boolean>(),
    locale: varchar('locale', { length: 10 }),
    meta: longtext('meta').notNull(),
    unsubscribed_at: datetime('unsubscribed_at', { fsp: 3 }),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('newsletter_email_uq').on(t.email),
    index('newsletter_verified_idx').on(t.is_verified),
    index('newsletter_locale_idx').on(t.locale),
  ],
);
