// =============================================================
// FILE: src/modules/references/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  int,
  tinyint,
  datetime,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { categories } from "../categories/schema";

/** LONGTEXT -> string */
const longtext = customType<{ data: string; driverData: string }>({
  dataType() {
    return "longtext";
  },
});

// -------------------- references (parent) --------------------
export const referencesTable = mysqlTable(
  "references",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),

    is_published: tinyint("is_published").notNull().default(0),
    is_featured: tinyint("is_featured").notNull().default(0),
    display_order: int("display_order").notNull().default(0),

    featured_image: varchar("featured_image", { length: 500 }),
    featured_image_asset_id: char("featured_image_asset_id", {
      length: 36,
    }),

    website_url: varchar("website_url", { length: 500 }),

    category_id: char("category_id", { length: 36 }),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("references_created_idx").on(t.created_at),
    index("references_updated_idx").on(t.updated_at),
    index("references_published_idx").on(t.is_published),
    index("references_featured_idx").on(t.is_featured),
    index("references_display_order_idx").on(t.display_order),
    index("references_featured_asset_idx").on(t.featured_image_asset_id),

    index("references_category_id_idx").on(t.category_id),

    // FK'ler
    {
      fk_category: {
        columns: [t.category_id],
        foreignColumns: [categories.id],
        name: "fk_references_category",
        onDelete: "set null",
        onUpdate: "cascade",
      },
    } as any,
  ],
);

// -------------------- references_i18n --------------------
export const referencesI18n = mysqlTable(
  "references_i18n",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),

    reference_id: char("reference_id", { length: 36 })
      .notNull()
      .references(() => referencesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),

    locale: varchar("locale", { length: 10 }).notNull(),

    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),

    summary: longtext("summary"),
    content: longtext("content").notNull(),

    featured_image_alt: varchar("featured_image_alt", { length: 255 }),
    meta_title: varchar("meta_title", { length: 255 }),
    meta_description: varchar("meta_description", { length: 500 }),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("ux_references_i18n_parent_locale").on(
      t.reference_id,
      t.locale,
    ),
    uniqueIndex("ux_references_i18n_locale_slug").on(t.locale, t.slug),
    index("references_i18n_locale_idx").on(t.locale),
    index("references_i18n_slug_idx").on(t.slug),
  ],
);

// -------------------- reference_images --------------------
export const referenceImages = mysqlTable(
  "reference_images",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    reference_id: char("reference_id", { length: 36 })
      .notNull()
      .references(() => referencesTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    image_url: varchar("image_url", { length: 500 }),
    storage_asset_id: char("storage_asset_id", { length: 36 }),

    is_featured: tinyint("is_featured").notNull().default(0),
    display_order: int("display_order").notNull().default(0),
    is_published: tinyint("is_published").notNull().default(0),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("reference_images_reference_idx").on(t.reference_id),
    index("reference_images_asset_idx").on(t.storage_asset_id),
    index("reference_images_published_idx").on(t.is_published),
    index("reference_images_order_idx").on(t.display_order),
  ],
);

// -------------------- reference_images_i18n --------------------
export const referenceImagesI18n = mysqlTable(
  "reference_images_i18n",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    image_id: char("image_id", { length: 36 })
      .notNull()
      .references(() => referenceImages.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    locale: varchar("locale", { length: 10 }).notNull(),
    title: varchar("title", { length: 200 }),
    alt: varchar("alt", { length: 255 }),

    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex("ux_reference_images_i18n_parent_locale").on(
      t.image_id,
      t.locale,
    ),
    index("reference_images_i18n_locale_idx").on(t.locale),
  ],
);

export type ReferenceRow = typeof referencesTable.$inferSelect;
export type NewReferenceRow = typeof referencesTable.$inferInsert;

export type ReferenceI18nRow = typeof referencesI18n.$inferSelect;
export type NewReferenceI18nRow = typeof referencesI18n.$inferInsert;

export type ReferenceImageRow = typeof referenceImages.$inferSelect;
export type NewReferenceImageRow = typeof referenceImages.$inferInsert;

export type ReferenceImageI18nRow = typeof referenceImagesI18n.$inferSelect;
export type NewReferenceImageI18nRow =
  typeof referenceImagesI18n.$inferInsert;
