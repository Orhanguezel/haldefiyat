// =============================================================
// FILE: src/modules/slider/schema.ts
// Slider – parent + i18n (slider + slider_i18n)
// =============================================================
import {
  mysqlTable,
  int,
  char,
  varchar,
  text,
  tinyint,
  datetime,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

/**
 * slider — parent tablo (locale'siz)
 *  - id: int AI (FE için numeric)
 *  - uuid: unique stable id
 *  - image_url / image_asset_id: storage entegrasyonu
 *  - featured, is_active, display_order: locale'den bağımsız
 */
export const slider = mysqlTable(
  'slider',
  {
    id: int('id', { unsigned: true }).autoincrement().notNull().primaryKey(),

    uuid: char('uuid', { length: 36 }).notNull(),

    image_url: text('image_url'),
    /** ✅ Standart ad: image_asset_id */
    image_asset_id: char('image_asset_id', { length: 36 }),

    site_id: char('site_id', { length: 36 }),

    featured: tinyint('featured', { unsigned: true }).notNull().default(0),
    is_active: tinyint('is_active', { unsigned: true }).notNull().default(1),

    display_order: int('display_order', { unsigned: true }).notNull().default(0),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => ({
    idx_site: index('idx_slider_site').on(t.site_id),
    idx_active: index('idx_slider_active').on(t.is_active),
    idx_order: index('idx_slider_order').on(t.display_order),
    idx_image_asset: index('idx_slider_image_asset').on(t.image_asset_id),
    idx_uuid: uniqueIndex('uniq_slider_uuid').on(t.uuid),
  }),
);

/**
 * slider_i18n — locale bazlı metin alanları
 *  - slider_id: parent FK
 *  - locale: 'de', 'en', ...
 *  - name, slug, description, alt, buttonText, buttonLink
 */
export const sliderI18n = mysqlTable(
  'slider_i18n',
  {
    id: int('id', { unsigned: true }).autoincrement().notNull().primaryKey(),

    sliderId: int('slider_id', { unsigned: true }).notNull(),

    locale: varchar('locale', { length: 8 }).notNull(),

    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),

    alt: varchar('alt', { length: 255 }),
    buttonText: varchar('button_text', { length: 100 }),
    buttonLink: varchar('button_link', { length: 255 }),
  },
  (t) => ({
    uniqSliderLocale: uniqueIndex('uniq_slider_i18n_slider_locale').on(t.sliderId, t.locale),
    uniqSlugLocale: uniqueIndex('uniq_slider_i18n_slug_locale').on(t.slug, t.locale),
    idxLocale: index('idx_slider_i18n_locale').on(t.locale),
  }),
);

export type SliderRow = typeof slider.$inferSelect;
export type NewSliderRow = typeof slider.$inferInsert;

export type SliderI18nRow = typeof sliderI18n.$inferSelect;
export type NewSliderI18nRow = typeof sliderI18n.$inferInsert;
