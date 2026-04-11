// src/modules/library/schema.ts

import {
  mysqlTable,
  char,
  varchar,
  tinyint,
  int,
  datetime,
  text,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { categories } from '../categories/schema';
import { subCategories } from '../subcategories/schema';
import { storageAssets } from '../storage/schema';

/* ============== LIBRARY PARENT ============== */

export const library = mysqlTable(
  'library',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),

    // non-i18n
    type: varchar('type', { length: 32 }).notNull().default('other'),

    // category relations
    category_id: char('category_id', { length: 36 }),
    sub_category_id: char('sub_category_id', { length: 36 }),

    featured: tinyint('featured').notNull().default(0),
    is_published: tinyint('is_published').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),
    display_order: int('display_order').notNull().default(0),

    // ana görsel alanları (legacy + storage)
    featured_image: varchar('featured_image', { length: 500 }),
    image_url: varchar('image_url', { length: 500 }),
    image_asset_id: char('image_asset_id', { length: 36 }),

    // metrics
    views: int('views').notNull().default(0),
    download_count: int('download_count').notNull().default(0),

    // ✅ Date mode
    published_at: datetime('published_at', { fsp: 3, mode: 'date' }),

    created_at: datetime('created_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('library_active_idx').on(t.is_active),
    index('library_published_idx').on(t.is_published),
    index('library_order_idx').on(t.display_order),

    index('library_type_idx').on(t.type),
    index('library_featured_idx').on(t.featured),

    index('library_category_id_idx').on(t.category_id),
    index('library_sub_category_id_idx').on(t.sub_category_id),

    index('library_asset_idx').on(t.image_asset_id),

    index('library_created_idx').on(t.created_at),
    index('library_updated_idx').on(t.updated_at),
    index('library_published_at_idx').on(t.published_at),
    index('library_views_idx').on(t.views),
    index('library_download_idx').on(t.download_count),

    foreignKey({
      columns: [t.category_id],
      foreignColumns: [categories.id],
      name: 'fk_library_category',
    })
      .onDelete('set null')
      .onUpdate('cascade'),

    foreignKey({
      columns: [t.sub_category_id],
      foreignColumns: [subCategories.id],
      name: 'fk_library_sub_category',
    })
      .onDelete('set null')
      .onUpdate('cascade'),

    foreignKey({
      columns: [t.image_asset_id],
      foreignColumns: [storageAssets.id],
      name: 'fk_library_featured_asset',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ],
);

export type LibraryRow = typeof library.$inferSelect;
export type NewLibraryRow = typeof library.$inferInsert;

/* ============== LIBRARY I18N ============== */

export const libraryI18n = mysqlTable(
  'library_i18n',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),

    library_id: char('library_id', { length: 36 })
      .notNull()
      .references(() => library.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    locale: varchar('locale', { length: 10 }).notNull(),

    slug: varchar('slug', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    image_alt: varchar('image_alt', { length: 255 }),

    tags: varchar('tags', { length: 255 }),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
    meta_keywords: varchar('meta_keywords', { length: 255 }),

    created_at: datetime('created_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('ux_library_i18n_unique').on(t.library_id, t.locale),
    uniqueIndex('ux_library_locale_slug').on(t.locale, t.slug),

    index('library_i18n_slug_idx').on(t.slug),
    index('library_i18n_name_idx').on(t.name),
    index('library_i18n_created_idx').on(t.created_at),
    index('library_i18n_updated_idx').on(t.updated_at),
  ],
);

export type LibraryI18nRow = typeof libraryI18n.$inferSelect;
export type NewLibraryI18nRow = typeof libraryI18n.$inferInsert;

/* ============== GALLERY IMAGES ============== */

export const libraryImages = mysqlTable(
  'library_images',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),

    library_id: char('library_id', { length: 36 })
      .notNull()
      .references(() => library.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    image_asset_id: char('image_asset_id', { length: 36 }).references(() => storageAssets.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    image_url: varchar('image_url', { length: 500 }),

    is_active: tinyint('is_active').notNull().default(1),
    display_order: int('display_order').notNull().default(0),

    created_at: datetime('created_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('library_images_library_idx').on(t.library_id),
    index('library_images_active_idx').on(t.is_active),
    index('library_images_order_idx').on(t.display_order),
    index('library_images_asset_idx').on(t.image_asset_id),
  ],
);

export type LibraryImageRow = typeof libraryImages.$inferSelect;
export type NewLibraryImageRow = typeof libraryImages.$inferInsert;

export const libraryImagesI18n = mysqlTable(
  'library_images_i18n',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),

    image_id: char('image_id', { length: 36 })
      .notNull()
      .references(() => libraryImages.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    locale: varchar('locale', { length: 10 }).notNull(),

    title: varchar('title', { length: 255 }),
    alt: varchar('alt', { length: 255 }),
    caption: varchar('caption', { length: 500 }),

    created_at: datetime('created_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('ux_library_images_i18n_unique').on(t.image_id, t.locale),
    index('library_images_i18n_locale_idx').on(t.locale),
  ],
);

export type LibraryImageI18nRow = typeof libraryImagesI18n.$inferSelect;
export type NewLibraryImageI18nRow = typeof libraryImagesI18n.$inferInsert;

/* ============== FILES ============== */

export const libraryFiles = mysqlTable(
  'library_files',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),

    library_id: char('library_id', { length: 36 })
      .notNull()
      .references(() => library.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    asset_id: char('asset_id', { length: 36 }).references(() => storageAssets.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),

    file_url: varchar('file_url', { length: 500 }),
    name: varchar('name', { length: 255 }).notNull(),

    size_bytes: int('size_bytes'),
    mime_type: varchar('mime_type', { length: 255 }),

    // JSON-string: ["tag1","tag2"]
    tags_json: text('tags_json'),

    display_order: int('display_order').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),

    created_at: datetime('created_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3, mode: 'date' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('library_files_library_idx').on(t.library_id),
    index('library_files_asset_idx').on(t.asset_id),
    index('library_files_active_idx').on(t.is_active),
    index('library_files_order_idx').on(t.display_order),
  ],
);

export type LibraryFileRow = typeof libraryFiles.$inferSelect;
export type NewLibraryFileRow = typeof libraryFiles.$inferInsert;
