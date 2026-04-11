// src/modules/subcategories/schema.ts
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
import { categories } from '../categories/schema';

export const subCategories = mysqlTable(
  'sub_categories',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    category_id: char('category_id', { length: 36 }).notNull(),
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
    foreignKey({
      columns: [t.category_id],
      foreignColumns: [categories.id],
      name: 'fk_sub_categories_category_id',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('sub_categories_category_id_idx').on(t.category_id),
    index('sub_categories_active_idx').on(t.is_active),
  ],
);

export const subCategoryI18n = mysqlTable(
  'sub_category_i18n',
  {
    sub_category_id: char('sub_category_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    foreignKey({
      columns: [t.sub_category_id],
      foreignColumns: [subCategories.id],
      name: 'fk_sub_category_i18n_sub_category_id',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    uniqueIndex('sub_category_i18n_slug_locale_uq').on(t.slug, t.locale),
    index('sub_category_i18n_locale_idx').on(t.locale),
  ],
);

export type SubCategory = typeof subCategories.$inferSelect;
export type SubCategoryI18n = typeof subCategoryI18n.$inferSelect;
