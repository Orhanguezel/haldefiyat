import {
  char,
  datetime,
  foreignKey,
  index,
  int,
  json,
  mysqlTable,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { longtext } from '../_shared';

export const customPages = mysqlTable(
  'custom_pages',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    module_key: varchar('module_key', { length: 100 }).notNull().default('kurumsal'),
    is_published: tinyint('is_published').notNull().default(0),
    display_order: int('display_order').notNull().default(0),
    featured_image: varchar('featured_image', { length: 500 }),
    storage_asset_id: char('storage_asset_id', { length: 36 }),
    images: json('images').$type<string[]>().default(sql`JSON_ARRAY()`),
    storage_image_ids: json('storage_image_ids').$type<string[]>().default(sql`JSON_ARRAY()`),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('custom_pages_module_idx').on(t.module_key),
    index('custom_pages_published_idx').on(t.is_published),
    index('custom_pages_order_idx').on(t.display_order),
  ],
);

export const customPagesI18n = mysqlTable(
  'custom_pages_i18n',
  {
    page_id: char('page_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 10 }).notNull().default('tr'),
    title: varchar('title', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 500 }).notNull(),
    content: longtext('content'),
    summary: longtext('summary'),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
  },
  (t) => [
    uniqueIndex('ux_cp_i18n_locale_slug').on(t.locale, t.slug),
    foreignKey({
      columns: [t.page_id],
      foreignColumns: [customPages.id],
      name: 'fk_cp_i18n_page',
    }).onDelete('cascade'),
  ],
);

export type CustomPage = typeof customPages.$inferSelect;
export type NewCustomPage = typeof customPages.$inferInsert;
export type CustomPageI18n = typeof customPagesI18n.$inferSelect;
export type NewCustomPageI18n = typeof customPagesI18n.$inferInsert;
