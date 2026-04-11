// src/modules/jobListings/schema.ts
import {
  mysqlTable,
  char,
  varchar,
  tinyint,
  int,
  datetime,
  index,
  uniqueIndex,
  foreignKey,
  text,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const jobListings = mysqlTable(
  'job_listings',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    department: varchar('department', { length: 128 }),
    location: varchar('location', { length: 255 }),
    employment_type: varchar('employment_type', { length: 64 }).default('full_time'),
    is_active: tinyint('is_active').notNull().default(1),
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
    index('job_listings_active_idx').on(t.is_active),
    index('job_listings_order_idx').on(t.display_order),
    index('job_listings_department_idx').on(t.department),
  ],
);

export const jobListingI18n = mysqlTable(
  'job_listings_i18n',
  {
    job_listing_id: char('job_listing_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    requirements: text('requirements'),
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
    foreignKey({
      columns: [t.job_listing_id],
      foreignColumns: [jobListings.id],
      name: 'fk_job_listings_i18n_job_listing_id',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    uniqueIndex('job_listings_i18n_slug_locale_uq').on(t.slug, t.locale),
    index('job_listings_i18n_locale_idx').on(t.locale),
  ],
);

export type JobListing = typeof jobListings.$inferSelect;
export type NewJobListing = typeof jobListings.$inferInsert;
export type JobListingI18n = typeof jobListingI18n.$inferSelect;
