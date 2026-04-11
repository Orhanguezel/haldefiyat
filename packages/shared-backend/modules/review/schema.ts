// =============================================================
// FILE: src/modules/review/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  tinyint,
  int,
  datetime,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

/* =========================
 * REVIEWS (base — dil bagimsiz)
 * ========================= */
export const reviews = mysqlTable(
  'reviews',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    target_type: varchar('target_type', { length: 50 }).notNull(),
    target_id: char('target_id', { length: 36 }).notNull(),

    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    rating: tinyint('rating').notNull(),

    is_active: tinyint('is_active').notNull().default(1).$type<boolean>(),
    is_approved: tinyint('is_approved').notNull().default(0).$type<boolean>(),
    display_order: int('display_order').notNull().default(0),

    likes_count: int('likes_count').notNull().default(0),
    dislikes_count: int('dislikes_count').notNull().default(0),
    helpful_count: int('helpful_count').notNull().default(0),

    submitted_locale: varchar('submitted_locale', { length: 8 }).notNull().default('tr'),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('reviews_target_idx').on(t.target_type, t.target_id),
    index('reviews_rating_idx').on(t.rating),
    index('reviews_approved_active_idx').on(t.is_approved, t.is_active),
  ],
);

/* =========================
 * REVIEW I18N (ceviriler)
 * ========================= */
export const reviewTranslations = mysqlTable(
  'review_i18n',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    review_id: char('review_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull(),

    title: varchar('title', { length: 255 }),
    comment: text('comment').notNull(),
    admin_reply: text('admin_reply'),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('review_i18n_review_locale_uniq').on(t.review_id, t.locale),
    foreignKey({
      columns: [t.review_id],
      foreignColumns: [reviews.id],
      name: 'fk_review_i18n_review',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/* Types */
export type ReviewRow = typeof reviews.$inferSelect;
export type NewReviewRow = typeof reviews.$inferInsert;
export type ReviewTranslationRow = typeof reviewTranslations.$inferSelect;
export type NewReviewTranslationRow = typeof reviewTranslations.$inferInsert;
