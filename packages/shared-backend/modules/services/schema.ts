// =============================================================
// FILE: src/modules/services/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  longtext,
  int,
  tinyint,
  datetime,
  json,
  index,
  uniqueIndex,
  foreignKey,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

/* =========================
 * SERVICES (BASE TABLO – DİL BAĞIMSIZ)
 * ========================= */
export const services = mysqlTable(
  'services',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    module_key: varchar('module_key', { length: 50 }).notNull().default('bereketfide'),
    category_id: char('category_id', { length: 36 }),

    is_active: tinyint('is_active').notNull().default(1).$type<boolean>(),
    is_featured: tinyint('is_featured').notNull().default(0).$type<boolean>(),
    display_order: int('display_order').notNull().default(0),

    image_url: longtext('image_url'),
    storage_asset_id: char('storage_asset_id', { length: 36 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('services_module_key_idx').on(t.module_key),
    index('services_active_idx').on(t.is_active),
    index('services_featured_idx').on(t.is_featured),
    index('services_order_idx').on(t.display_order),
    index('services_category_idx').on(t.category_id),
    index('services_asset_idx').on(t.storage_asset_id),
  ],
);

/* =========================
 * SERVICES I18N (LOCALE BAZLI)
 * ========================= */
export const servicesI18n = mysqlTable(
  'services_i18n',
  {
    service_id: char('service_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),

    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),

    description: text('description'),
    content: longtext('content'),
    alt: varchar('alt', { length: 255 }),

    tags: json('tags')
      .$type<string[]>()
      .default(sql`JSON_ARRAY()`),

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
      name: 'services_i18n_pk',
      columns: [t.service_id, t.locale],
    }),

    uniqueIndex('services_i18n_locale_slug_uq').on(t.locale, t.slug),
    index('services_i18n_locale_idx').on(t.locale),

    foreignKey({
      columns: [t.service_id],
      foreignColumns: [services.id],
      name: 'fk_services_i18n_service',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/* =========================
 * SERVICE IMAGES (GALERİ)
 * ========================= */
export const serviceImages = mysqlTable(
  'service_images',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    service_id: char('service_id', { length: 36 }).notNull(),
    storage_asset_id: char('storage_asset_id', { length: 36 }),
    image_url: varchar('image_url', { length: 500 }),

    display_order: int('display_order').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1).$type<boolean>(),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('service_images_service_id_idx').on(t.service_id),
    index('service_images_order_idx').on(t.service_id, t.display_order),

    foreignKey({
      columns: [t.service_id],
      foreignColumns: [services.id],
      name: 'fk_service_images_service',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

/* =========================
 * SERVICE IMAGES I18N
 * ========================= */
export const serviceImagesI18n = mysqlTable(
  'service_images_i18n',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    image_id: char('image_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),

    title: varchar('title', { length: 255 }),
    alt: varchar('alt', { length: 255 }),
    caption: varchar('caption', { length: 500 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('service_images_i18n_image_locale_uq').on(t.image_id, t.locale),
    index('service_images_i18n_locale_idx').on(t.locale),

    foreignKey({
      columns: [t.image_id],
      foreignColumns: [serviceImages.id],
      name: 'fk_service_images_i18n_image',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

// Types
export type ServiceRow = typeof services.$inferSelect;
export type NewServiceRow = typeof services.$inferInsert;

export type ServiceI18nRow = typeof servicesI18n.$inferSelect;
export type NewServiceI18nRow = typeof servicesI18n.$inferInsert;

export type ServiceImageRow = typeof serviceImages.$inferSelect;
export type NewServiceImageRow = typeof serviceImages.$inferInsert;

export type ServiceImageI18nRow = typeof serviceImagesI18n.$inferSelect;
export type NewServiceImageI18nRow = typeof serviceImagesI18n.$inferInsert;
