// src/modules/jobApplications/schema.ts
import {
  mysqlTable,
  char,
  varchar,
  text,
  datetime,
  index,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { jobListings } from '../jobListings/schema';

export const jobApplications = mysqlTable(
  'job_applications',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    job_listing_id: char('job_listing_id', { length: 36 }).notNull(),
    full_name: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 64 }),
    cover_letter: text('cover_letter'),
    cv_url: varchar('cv_url', { length: 512 }),
    cv_asset_id: char('cv_asset_id', { length: 36 }),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    admin_note: varchar('admin_note', { length: 2000 }),
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
      name: 'fk_job_applications_job_listing_id',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    index('job_applications_listing_idx').on(t.job_listing_id),
    index('job_applications_status_idx').on(t.status),
    index('job_applications_email_idx').on(t.email),
    index('job_applications_created_idx').on(t.created_at),
  ],
);

export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;
