// =============================================================
// FILE: src/modules/gallery/schema.ts
// Gallery modülü — storage entegreli, merkezi görsel yönetimi
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  int,
  tinyint,
  datetime,
  index,
  uniqueIndex,
  primaryKey,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { storageAssets } from '../storage/schema';
import { longtext } from '../_shared';

/* =========================
 * GALLERIES (albümler)
 * ========================= */
export const galleries = mysqlTable(
  'galleries',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    /** Hangi modüle ait: 'bereketfide', 'bereketfide', 'blog', 'products', ... */
    module_key: varchar('module_key', { length: 64 }).notNull().default('general'),

    /** İlişkili kayıt (opsiyonel) — product_id, blog_id vb. */
    source_id: char('source_id', { length: 36 }),

    /** İlişki tipi: 'product' | 'blog' | 'reference' | 'standalone' */
    source_type: varchar('source_type', { length: 32 }).default('standalone'),

    is_active: tinyint('is_active').notNull().default(1).$type<boolean>(),
    is_featured: tinyint('is_featured').notNull().default(0).$type<boolean>(),
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
    index('galleries_module_idx').on(t.module_key),
    index('galleries_source_idx').on(t.source_type, t.source_id),
    index('galleries_active_idx').on(t.is_active),
    index('galleries_order_idx').on(t.display_order),
  ],
);

export type GalleryRow = typeof galleries.$inferSelect;
export type NewGalleryRow = typeof galleries.$inferInsert;

/* =========================
 * GALLERY I18N
 * ========================= */
export const galleryI18n = mysqlTable(
  'gallery_i18n',
  {
    gallery_id: char('gallery_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),

    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),

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
    primaryKey({
      columns: [t.gallery_id, t.locale],
      name: 'gallery_i18n_pk',
    }),
    uniqueIndex('gallery_i18n_locale_slug_uq').on(t.locale, t.slug),
    index('gallery_i18n_locale_idx').on(t.locale),

    foreignKey({
      columns: [t.gallery_id],
      foreignColumns: [galleries.id],
      name: 'fk_gallery_i18n_gallery',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type GalleryI18nRow = typeof galleryI18n.$inferSelect;
export type NewGalleryI18nRow = typeof galleryI18n.$inferInsert;

/* =========================
 * GALLERY IMAGES (storage entegreli)
 * ========================= */
export const galleryImages = mysqlTable(
  'gallery_images',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    gallery_id: char('gallery_id', { length: 36 }).notNull(),

    /** Storage asset bağlantısı — Cloudinary / local */
    storage_asset_id: char('storage_asset_id', { length: 36 }),

    /** Denormalized URL — hızlı erişim */
    image_url: longtext('image_url'),

    display_order: int('display_order').notNull().default(0),
    is_cover: tinyint('is_cover').notNull().default(0).$type<boolean>(),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index('gallery_images_gallery_idx').on(t.gallery_id),
    index('gallery_images_order_idx').on(t.gallery_id, t.display_order),
    index('gallery_images_asset_idx').on(t.storage_asset_id),

    foreignKey({
      columns: [t.gallery_id],
      foreignColumns: [galleries.id],
      name: 'fk_gallery_images_gallery',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),

    foreignKey({
      columns: [t.storage_asset_id],
      foreignColumns: [storageAssets.id],
      name: 'fk_gallery_images_asset',
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  ],
);

export type GalleryImageRow = typeof galleryImages.$inferSelect;
export type NewGalleryImageRow = typeof galleryImages.$inferInsert;

/* =========================
 * GALLERY IMAGE I18N (alt, caption)
 * ========================= */
export const galleryImageI18n = mysqlTable(
  'gallery_image_i18n',
  {
    image_id: char('image_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),

    alt: varchar('alt', { length: 255 }),
    caption: varchar('caption', { length: 500 }),
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
    primaryKey({
      columns: [t.image_id, t.locale],
      name: 'gallery_image_i18n_pk',
    }),

    foreignKey({
      columns: [t.image_id],
      foreignColumns: [galleryImages.id],
      name: 'fk_gallery_image_i18n_image',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type GalleryImageI18nRow = typeof galleryImageI18n.$inferSelect;
export type NewGalleryImageI18nRow = typeof galleryImageI18n.$inferInsert;
