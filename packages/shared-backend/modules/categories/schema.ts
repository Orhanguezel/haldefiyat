// src/modules/categories/schema.ts

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
import { longtext } from '../_shared';

export const categories = mysqlTable(
  'categories',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    module_key: varchar('module_key', { length: 64 }).notNull().default('general'),
    image_url: longtext('image_url'),
    storage_asset_id: char('storage_asset_id', { length: 36 }),
    alt: varchar('alt', { length: 255 }),
    icon: varchar('icon', { length: 255 }),
    is_active: tinyint('is_active').notNull().default(1),
    is_featured: tinyint('is_featured').notNull().default(0),
    display_order: int('display_order').notNull().default(0),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('categories_active_idx').on(t.is_active),
    index('categories_order_idx').on(t.display_order),
    index('categories_module_idx').on(t.module_key),
  ],
);

export const categoryI18n = mysqlTable(
  'category_i18n',
  {
    category_id: char('category_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    alt: varchar('alt', { length: 255 }),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('category_i18n_slug_locale_uq').on(t.slug, t.locale),
    index('category_i18n_locale_idx').on(t.locale),
    foreignKey({
      columns: [t.category_id],
      foreignColumns: [categories.id],
      name: 'fk_category_i18n_category',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type CategoryI18n = typeof categoryI18n.$inferSelect;
export type NewCategoryI18n = typeof categoryI18n.$inferInsert;
