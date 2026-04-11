import {
  char,
  customType,
  datetime,
  decimal,
  int,
  mysqlTable,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

import { products } from "@agro/shared-backend/modules/products/schema";

const longtext = customType<{ data: string | null; driverData: string }>({
  dataType() {
    return "longtext";
  },
});

export const offersTable = mysqlTable("offers", {
  id: char("id", { length: 36 }).primaryKey().notNull(),
  offer_no: varchar("offer_no", { length: 100 }),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  source: varchar("source", { length: 64 }).notNull().default("vistaseed"),
  locale: varchar("locale", { length: 10 }),
  country_code: varchar("country_code", { length: 80 }),
  customer_name: varchar("customer_name", { length: 255 }).notNull(),
  company_name: varchar("company_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 255 }),
  message: longtext("message"),
  product_id: char("product_id", { length: 36 }).references(() => products.id, {
    onDelete: "set null",
    onUpdate: "cascade",
  }),
  service_id: char("service_id", { length: 36 }),
  form_data: longtext("form_data"),
  consent_marketing: tinyint("consent_marketing").notNull().default(0),
  consent_terms: tinyint("consent_terms").notNull().default(0),
  currency: varchar("currency", { length: 10 }).notNull().default("EUR"),
  net_total: decimal("net_total", { precision: 12, scale: 2 }),
  vat_rate: decimal("vat_rate", { precision: 5, scale: 2 }),
  vat_total: decimal("vat_total", { precision: 12, scale: 2 }),
  shipping_total: decimal("shipping_total", { precision: 12, scale: 2 }),
  gross_total: decimal("gross_total", { precision: 12, scale: 2 }),
  valid_until: datetime("valid_until", { fsp: 3 }),
  admin_notes: longtext("admin_notes"),
  pdf_url: varchar("pdf_url", { length: 500 }),
  pdf_asset_id: char("pdf_asset_id", { length: 36 }),
  email_sent_at: datetime("email_sent_at", { fsp: 3 }),
  created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime("updated_at", { fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .$onUpdateFn(() => new Date()),
});

export const offerNumberCountersTable = mysqlTable("offer_number_counters", {
  year: int("year").primaryKey().notNull(),
  last_seq: int("last_seq").notNull(),
  prefix: varchar("prefix", { length: 20 }).notNull().default("VS"),
});

export type OfferRow = typeof offersTable.$inferSelect;
export type NewOfferRow = typeof offersTable.$inferInsert;
