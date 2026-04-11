import {
  mysqlTable,
  char,
  varchar,
  text,
  int,
  tinyint,
  datetime,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

/** `090_comments.sql` ile uyumlu — public API `target_type` / `target_id` kullanır */
export const comments = mysqlTable(
  'comments',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    target_type: varchar('target_type', { length: 50 }).notNull().default('project'),
    target_id: varchar('target_id', { length: 100 }).notNull(),
    parent_id: char('parent_id', { length: 36 }),
    author_name: varchar('author_name', { length: 255 }).notNull(),
    author_email: varchar('author_email', { length: 255 }),
    content: text('content').notNull(),
    image_url: varchar('image_url', { length: 500 }),
    is_approved: tinyint('is_approved').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),
    ip_address: varchar('ip_address', { length: 45 }),
    user_agent: varchar('user_agent', { length: 500 }),
    likes_count: int('likes_count').notNull().default(0),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('idx_comment_target').on(t.target_type, t.target_id),
    index('idx_comment_parent').on(t.parent_id),
    index('idx_comment_approved').on(t.is_approved),
    index('idx_comment_created').on(t.created_at),
  ],
);
