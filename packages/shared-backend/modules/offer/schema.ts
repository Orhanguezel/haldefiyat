// =============================================================
// FILE: src/modules/offer/schema.ts
// Bereket Fide – Offer Module Schema (Drizzle ORM)
// =============================================================

import {
  mysqlTable,
  char,
  varchar,
  int,
  tinyint,
  datetime,
  customType,
  decimal,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

import { products } from '../products/schema';

// LONGTEXT custom type
const longtext = customType<{ data: string | null; driverData: string }>({
  dataType() {
    return 'longtext';
  },
});

// -------------------- offers --------------------
export const offersTable = mysqlTable(
  'offers',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    offer_no: varchar('offer_no', { length: 100 }),

    status: varchar('status', { length: 32 }).notNull().default('new'),

    /** Teklifin geldiği kaynak site/marka: 'bereketfide' | 'bereketfide' | ... */
    source: varchar('source', { length: 64 }).notNull().default('bereketfide'),

    locale: varchar('locale', { length: 10 }),

    country_code: varchar('country_code', { length: 80 }),

    customer_name: varchar('customer_name', { length: 255 }).notNull(),
    company_name: varchar('company_name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),

    subject: varchar('subject', { length: 255 }),
    message: longtext('message'),

    product_id: char('product_id', { length: 36 }),
    service_id: char('service_id', { length: 36 }),

    form_data: longtext('form_data'),

    consent_marketing: tinyint('consent_marketing').notNull().default(0),
    consent_terms: tinyint('consent_terms').notNull().default(0),

    currency: varchar('currency', { length: 10 }).notNull().default('EUR'),
    net_total: decimal('net_total', { precision: 12, scale: 2 }),
    vat_rate: decimal('vat_rate', { precision: 5, scale: 2 }), // YENİ
    vat_total: decimal('vat_total', { precision: 12, scale: 2 }),
    shipping_total: decimal('shipping_total', { precision: 12, scale: 2 }), // YENİ
    gross_total: decimal('gross_total', { precision: 12, scale: 2 }),

    valid_until: datetime('valid_until', { fsp: 3 }),

    admin_notes: longtext('admin_notes'),

    pdf_url: varchar('pdf_url', { length: 500 }),
    pdf_asset_id: char('pdf_asset_id', { length: 36 }),

    email_sent_at: datetime('email_sent_at', { fsp: 3 }),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    {
      idx_status_created: {
        columns: [t.status, t.created_at],
        name: 'offers_status_created_idx',
      },
    } as any,
    {
      idx_email: {
        columns: [t.email],
        name: 'offers_email_idx',
      },
    } as any,
    {
      idx_product: {
        columns: [t.product_id],
        name: 'offers_product_idx',
      },
    } as any,
    {
      idx_offer_no: {
        columns: [t.offer_no],
        name: 'offers_offer_no_idx',
      },
    } as any,
    {
      idx_locale: {
        columns: [t.locale],
        name: 'offers_locale_idx',
      },
    } as any,
    {
      idx_country: {
        columns: [t.country_code],
        name: 'offers_country_idx',
      },
    } as any,
    {
      idx_source: {
        columns: [t.source],
        name: 'offers_source_idx',
      },
    } as any,
    {
      fk_product: {
        columns: [t.product_id],
        foreignColumns: [products.id],
        name: 'fk_offers_product',
        onDelete: 'set null',
        onUpdate: 'cascade',
      },
    } as any,
    {
      idx_service: {
        columns: [t.service_id],
        name: 'offers_service_idx',
      },
    } as any,
  ],
);

export type OfferRow = typeof offersTable.$inferSelect;
export type NewOfferRow = typeof offersTable.$inferInsert;

// -------------------- offer_number_counters --------------------
export const offerNumberCountersTable = mysqlTable('offer_number_counters', {
  year: int('year').primaryKey().notNull(),
  last_seq: int('last_seq').notNull(),
  prefix: varchar('prefix', { length: 20 }).notNull().default('BF'),
});

export type OfferNumberCounterRow = typeof offerNumberCountersTable.$inferSelect;
export type NewOfferNumberCounterRow = typeof offerNumberCountersTable.$inferInsert;
